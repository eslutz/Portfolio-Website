using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
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

  public GetCosmosData(ILogger<GetCosmosData> logger, IConfiguration config)
  {
    _logger = logger;

    if (ValidateConfiguration(config, out var connectionString, out var databaseName, out var containerName))
    {
      _cosmosClient = new CosmosClient(connectionString);
      _container = _cosmosClient.GetContainer(databaseName, containerName);
    }
  }

  private bool ValidateConfiguration(IConfiguration config, out string connectionString, out string databaseName, out string containerName)
  {
    connectionString = config["COSMOS_CONNECTION_STRING"] ?? string.Empty;
    databaseName = config["COSMOS_DATABASE_NAME"] ?? string.Empty;
    containerName = config["COSMOS_CONTAINER_NAME"] ?? string.Empty;

    var missingValues = new List<string>();
    if (string.IsNullOrEmpty(connectionString)) missingValues.Add("COSMOS_CONNECTION_STRING");
    if (string.IsNullOrEmpty(databaseName)) missingValues.Add("COSMOS_DATABASE_NAME");
    if (string.IsNullOrEmpty(containerName)) missingValues.Add("COSMOS_CONTAINER_NAME");

    if (missingValues.Count != 0)
    {
      _logger.LogError("Missing required configuration values: {Values}", string.Join(", ", missingValues));
      return false;
    }

    return true;
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
      return new StatusCodeResult((int)HttpStatusCode.InternalServerError);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error fetching items");
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
