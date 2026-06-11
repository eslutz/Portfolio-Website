using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using PortfolioApi.Models;

namespace PortfolioApi;

public class GetCosmosData
{
  private readonly ILogger<GetCosmosData> _logger;
  private readonly Container _container;

  public GetCosmosData(
    ILogger<GetCosmosData> logger,
    Container container)
  {
    _logger = logger;
    _container = container;
  }

  [Function("GetCosmosData")]
  public async Task<IActionResult> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "components/{component}")] HttpRequest request,
    string component,
    CancellationToken cancellationToken)
  {
    _logger.LogInformation("GetCosmosData function processing request");

    if (!Enum.TryParse(component, ignoreCase: true, out Component parsedComponent) || !Enum.IsDefined(parsedComponent))
    {
      _logger.LogWarning("Unknown component: {Component}", component);
      return new BadRequestObjectResult(new { message = $"Unknown component: {component}" });
    }

    var componentName = parsedComponent.ToString().ToLowerInvariant();

    try
    {
      _logger.LogInformation("Querying for component: {Component}", componentName);
      var queryDefinition = new QueryDefinition("SELECT * FROM c WHERE c.component = @componentName")
        .WithParameter("@componentName", componentName);

      var items = parsedComponent switch
      {
        Component.Footer => await FetchItemsAsync<Footer>(queryDefinition, cancellationToken),
        Component.Recognition => await FetchItemsAsync<WorkRecognition>(queryDefinition, cancellationToken),
        Component.Project => await FetchItemsAsync<Project>(queryDefinition, cancellationToken),
        Component.Home => await FetchItemsAsync<Home>(queryDefinition, cancellationToken),
        Component.Education => await FetchItemsAsync<Education>(queryDefinition, cancellationToken),
        Component.Certification => await FetchItemsAsync<Certification>(queryDefinition, cancellationToken),
        _ => throw new InvalidOperationException($"Unexpected component value: {parsedComponent}")
      };

      if (items.Count == 0)
      {
        _logger.LogWarning("No items found for component: {Component}", componentName);
        return new NotFoundObjectResult(new { message = $"{componentName} content not found" });
      }

      _logger.LogInformation("Successfully retrieved {Count} items for component: {Component}",
        items.Count, componentName);
      request.HttpContext.Response.Headers.CacheControl = "public, max-age=3600";
      return new OkObjectResult(items);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error fetching items for component: {Component}", componentName);
      return new StatusCodeResult(StatusCodes.Status500InternalServerError);
    }
  }

  private async Task<IReadOnlyList<object>> FetchItemsAsync<T>(QueryDefinition queryDefinition, CancellationToken cancellationToken)
    where T : class
  {
    var items = new List<object>();
    var requestOptions = new QueryRequestOptions { MaxItemCount = 100 };
    using var feed = _container.GetItemQueryIterator<T>(queryDefinition, requestOptions: requestOptions);
    while (feed.HasMoreResults)
    {
      var result = await feed.ReadNextAsync(cancellationToken);
      foreach (var item in result)
      {
        items.Add(item);
      }
    }
    return items;
  }
}
