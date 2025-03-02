using System.Net;
using System.Text.Json;
using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using Microsoft.ApplicationInsights;
using Microsoft.ApplicationInsights.DataContracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.AzureAppConfiguration;
using PortfolioApi.Models;

namespace PortfolioApi;

public class GetCosmosData
{
  private readonly ILogger<GetCosmosData> _logger;
  private readonly CosmosClient? _cosmosClient;
  private readonly Container? _container;
  private readonly TelemetryClient _telemetryClient;

  private static object DeserializeItem(string itemJson, Component component)
  {
    return component switch
    {
      Component.Footer => JsonSerializer.Deserialize<Footer>(itemJson) ?? throw new JsonException($"Failed to deserialize Footer"),
      Component.Recognition => JsonSerializer.Deserialize<WorkRecognition>(itemJson) ?? throw new JsonException($"Failed to deserialize WorkRecognition"),
      Component.Project => JsonSerializer.Deserialize<Project>(itemJson) ?? throw new JsonException($"Failed to deserialize Project"),
      Component.Home => JsonSerializer.Deserialize<Home>(itemJson) ?? throw new JsonException($"Failed to deserialize Home"),
      Component.Education => JsonSerializer.Deserialize<Education>(itemJson) ?? throw new JsonException($"Failed to deserialize Education"),
      Component.Certification => JsonSerializer.Deserialize<Certification>(itemJson) ?? throw new JsonException($"Failed to deserialize Certification"),
      _ => throw new ArgumentException($"Unexpected component value: {component}")
    };
  }

  public GetCosmosData(
    ILogger<GetCosmosData> logger,
    IConfiguration config,
    TelemetryClient telemetryClient)
  {
    _logger = logger;
    _telemetryClient = telemetryClient;

    try
    {
      if (ValidateConfiguration(config, out var cosmosConfig))
      {
        _cosmosClient = new CosmosClient(cosmosConfig.ConnectionString);
        _container = _cosmosClient.GetContainer(cosmosConfig.DatabaseName, cosmosConfig.ContainerName);

        _telemetryClient.TrackEvent("CosmosClientInitialized",
          properties: new Dictionary<string, string>
          {
            { "DatabaseName", cosmosConfig.DatabaseName },
            { "ContainerName", cosmosConfig.ContainerName }
          });
      }
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error initializing Cosmos client");
      _telemetryClient.TrackException(ex);
    }
  }

  [Function("GetCosmosData")]
  public async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData request)
  {
    using var operation = _telemetryClient.StartOperation<RequestTelemetry>("GetCosmosData");
    _logger.LogInformation("GetCosmosData function processing request");

    if (_container is null || _cosmosClient is null)
    {
      _logger.LogError("Cosmos client or container is null");
      return new StatusCodeResult((int)HttpStatusCode.ServiceUnavailable);
    }

    try
    {
      using var reader = new StreamReader(request.Body);
      var requestBodyJson = await reader.ReadToEndAsync();
      var requestBody = JsonSerializer.Deserialize<ComponentRequest>(requestBodyJson);

      if (requestBody is null || string.IsNullOrWhiteSpace(requestBody.Component))
      {
        _logger.LogWarning("Invalid request: missing or empty component");
        return new BadRequestObjectResult(new { message = "Missing required 'component' in request body" });
      }

      if (!Enum.TryParse(requestBody.Component, true, out Component component))
      {
        _logger.LogWarning("Unknown component: {Component}", requestBody.Component);
        return new BadRequestObjectResult(new { message = $"Unknown component: {requestBody.Component}" });
      }

      _logger.LogInformation("Querying for component: {Component}", requestBody.Component);
      var queryDefinition = new QueryDefinition("SELECT * FROM c WHERE c.component = @componentName")
        .WithParameter("@componentName", requestBody.Component);

      List<dynamic> items;
      items = await FetchItemsAsync(queryDefinition, component);

      if (items.Count == 0)
      {
        _logger.LogWarning("No items found for component: {Component}", requestBody.Component);
        return new NotFoundObjectResult(new { message = $"{requestBody.Component} content not found" });
      }

      _logger.LogInformation("Successfully retrieved {Count} items for component: {Component}",
        items.Count, requestBody.Component);
      return new OkObjectResult(items);
    }
    catch (Exception ex) when (ex is JsonException || ex is ArgumentException)
    {
      _logger.LogError(ex, "Error deserializing items");
      _telemetryClient.TrackException(ex);
      return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error fetching items");
      _telemetryClient.TrackException(ex);
      return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
    }
  }

  private async Task<List<dynamic>> FetchItemsAsync(QueryDefinition queryDefinition, Component component)
  {
    var items = new List<dynamic>();
    var feed = _container!.GetItemQueryIterator<dynamic>(queryDefinition);
    while (feed.HasMoreResults)
    {
      var result = await feed.ReadNextAsync();
      foreach (var item in result)
      {
        items.Add(DeserializeItem(item.ToString(), component));
      }
    }
    return items;
  }

  private bool ValidateConfiguration(IConfiguration config, out CosmosConfiguration cosmosConfig)
  {
    cosmosConfig = new CosmosConfiguration();
    try
    {
      var credential = new DefaultAzureCredential();
      var appConfigEndpoint = config["APP_CONFIG_ENDPOINT"];
      var keyVaultUri = config["KEY_VAULT_ENDPOINT"];

      var missingEndpoints = new List<string>();
      if (string.IsNullOrEmpty(appConfigEndpoint)) missingEndpoints.Add("APP_CONFIG_ENDPOINT");
      if (string.IsNullOrEmpty(keyVaultUri)) missingEndpoints.Add("KEY_VAULT_ENDPOINT");

      if (missingEndpoints.Count > 0)
      {
        _logger.LogError("Missing Azure configuration endpoints: {MissingEndpoints}", string.Join(", ", missingEndpoints));
        return false;
      }

      // Get configuration from Azure App Configuration
      var appConfigClient = new ConfigurationBuilder()
          .AddAzureAppConfiguration(options =>
          {
            options.Connect(new Uri(appConfigEndpoint!), credential)
                   .ConfigureKeyVault(kv =>
                   {
                     kv.SetCredential(credential);
                   });
          })
          .Build();

      // Get database and container names from App Configuration
      cosmosConfig.DatabaseName = appConfigClient["CosmosDatabase"]!;
      cosmosConfig.ContainerName = appConfigClient["CosmosContainer"]!;

      // Get connection string from Key Vault
      var keyVaultClient = new SecretClient(new Uri(keyVaultUri!), credential);
      var secret = keyVaultClient.GetSecret("CosmosDbConnectionString");
      cosmosConfig.ConnectionString = secret.Value.Value;

      var missingValues = new List<string>();
      if (string.IsNullOrEmpty(cosmosConfig.ConnectionString)) missingValues.Add("CosmosDbConnectionString (from Key Vault)");
      if (string.IsNullOrEmpty(cosmosConfig.DatabaseName)) missingValues.Add("CosmosDatabase (from App Configuration)");
      if (string.IsNullOrEmpty(cosmosConfig.ContainerName)) missingValues.Add("CosmosContainer (from App Configuration)");

      if (missingValues.Count != 0)
      {
        _logger.LogError("Missing required configuration values: {Values}", string.Join(", ", missingValues));
        return false;
      }

      return true;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error retrieving configuration: {ErrorMessage}", ex.Message);
      if (ex.InnerException != null)
      {
        _logger.LogError("Inner exception: {InnerErrorMessage}", ex.InnerException.Message);
      }
      return false;
    }
  }
}
