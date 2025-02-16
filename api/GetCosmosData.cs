using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace api
{
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
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData request)
    {
      var response = request.CreateResponse();

      if (_cosmosClient == null || _container == null)
      {
        response.StatusCode = HttpStatusCode.ServiceUnavailable;
        await response.WriteAsJsonAsync(new { message = "Service is not properly configured" });
        return response;
      }

      try
      {
        using var reader = new StreamReader(request.Body);
        var requestBodyJson = await reader.ReadToEndAsync();
        var requestBody = JsonSerializer.Deserialize<ComponentRequest>(requestBodyJson);

        if (requestBody is null || string.IsNullOrWhiteSpace(requestBody.Component))
        {
          response.StatusCode = HttpStatusCode.BadRequest;
          await response.WriteAsJsonAsync(new { message = "Missing required 'component' in request body" });
          return response;
        }

        var queryDefinition = new QueryDefinition("SELECT * FROM c WHERE c.component = @componentName")
            .WithParameter("@componentName", requestBody.Component);
        var items = new List<dynamic>();
        var iterator = _container.GetItemQueryIterator<dynamic>(queryDefinition);
        while (iterator.HasMoreResults)
        {
          var result = await iterator.ReadNextAsync();
          items.AddRange(result);
        }

        if (items.Count == 0)
        {
          response.StatusCode = HttpStatusCode.NotFound;
          await response.WriteAsJsonAsync(new { message = $"{requestBody.Component} content not found" });
          return response;
        }

        response.StatusCode = HttpStatusCode.OK;
        response.Headers.Add("Content-Type", "application/json");
        await response.WriteAsJsonAsync(items);
        return response;
      }
      catch (Exception ex)
      {
        _logger.LogError(ex, "Error fetching content");
        response.StatusCode = HttpStatusCode.InternalServerError;
        await response.WriteAsJsonAsync(new { message = "Internal server error" });
        return response;
      }
    }
  }

  public class ComponentRequest
  {
    [JsonPropertyName("component")]
    public string? Component { get; set; }
  }
}
