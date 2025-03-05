using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using PortfolioApi.Models;

namespace PortfolioApi;

public class GetCosmosData
{
  private readonly ILogger<GetCosmosData> _logger;
  private readonly CosmosClient? _cosmosClient;
  private readonly Container? _container;

  public GetCosmosData(
    ILogger<GetCosmosData> logger,
    IConfiguration config)
  {
    _logger = logger;

    try
    {
      if (ValidateConfiguration(config, out var cosmosConfig))
      {
        _cosmosClient = new CosmosClient(cosmosConfig.ConnectionString);
        _container = _cosmosClient.GetContainer(cosmosConfig.DatabaseName, cosmosConfig.ContainerName);
      }
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error initializing Cosmos client");
    }
  }

  [Function("GetCosmosData")]
  public async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData request)
  {
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

      var items = await FetchItemsAsync(queryDefinition, component);

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
      return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error fetching items");
      return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
    }
  }

  private bool ValidateConfiguration(IConfiguration config, out CosmosConfiguration cosmosConfig)
  {
    cosmosConfig = new CosmosConfiguration();
    try
    {
      // Get connection string, database, and container names from App Configuration
      cosmosConfig.ConnectionString = config["COSMOS_DB_CONNECTION_STRING"] ?? throw new InvalidOperationException("COSMOS_DB_CONNECTION_STRING is not configured");
      cosmosConfig.DatabaseName = config["COSMOS_DATABASE"] ?? throw new InvalidOperationException("COSMOS_DATABASE is not configured");
      cosmosConfig.ContainerName = config["COSMOS_CONTAINER"] ?? throw new InvalidOperationException("COSMOS_CONTAINER is not configured");

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
}
