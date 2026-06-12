using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using PortfolioApi.Models;
using PortfolioApi.Services;

namespace PortfolioApi;

public class CmsContentFunctions
{
  private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

  private readonly CmsAuthorizationService _authorizationService;
  private readonly Container _container;
  private readonly HtmlContentSanitizer _sanitizer;
  private readonly ILogger<CmsContentFunctions> _logger;

  public CmsContentFunctions(
    CmsAuthorizationService authorizationService,
    Container container,
    HtmlContentSanitizer sanitizer,
    ILogger<CmsContentFunctions> logger)
  {
    _authorizationService = authorizationService;
    _container = container;
    _sanitizer = sanitizer;
    _logger = logger;
  }

  [Function("CmsGetComponent")]
  public async Task<IActionResult> GetComponentAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "cms/components/{component}")] HttpRequest request,
    string component,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    if (!Enum.TryParse(component, ignoreCase: true, out Component parsedComponent) || !Enum.IsDefined(parsedComponent))
    {
      return new BadRequestObjectResult(new { message = $"Unknown component: {component}" });
    }

    return new OkObjectResult(await FetchComponentAsync(parsedComponent, cancellationToken));
  }

  [Function("CmsUpdateHome")]
  public async Task<IActionResult> UpdateHomeAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "cms/home/{id}")] HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    var input = await ReadJsonAsync<HomeInput>(request, cancellationToken);
    if (input is null)
    {
      return InvalidJson();
    }

    if (IsBlank(input.Title) || IsBlank(input.Content))
    {
      return ValidationError("Home title and content are required");
    }

    var home = _sanitizer.Sanitize(new Home
    {
      Id = id,
      Component = Component.Home.ToString().ToLowerInvariant(),
      Title = input.Title!.Trim(),
      Subtitle = IsBlank(input.Subtitle) ? null : input.Subtitle!.Trim(),
      Content = input.Content!,
    });

    return await UpsertAsync(home, id, cancellationToken);
  }

  [Function("CmsCreateProject")]
  public async Task<IActionResult> CreateProjectAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "cms/projects")] HttpRequest request,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    var input = await ReadJsonAsync<ProjectInput>(request, cancellationToken);
    if (input is null)
    {
      return InvalidJson();
    }

    var project = BuildProject(Guid.NewGuid().ToString("N"), input);
    if (project is null)
    {
      return ValidationError("Project title, description, and code link are required");
    }

    return await UpsertAsync(_sanitizer.Sanitize(project), project.Id, cancellationToken);
  }

  [Function("CmsUpdateProject")]
  public async Task<IActionResult> UpdateProjectAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "cms/projects/{id}")] HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    var input = await ReadJsonAsync<ProjectInput>(request, cancellationToken);
    if (input is null)
    {
      return InvalidJson();
    }

    var project = BuildProject(id, input);
    if (project is null)
    {
      return ValidationError("Project title, description, and code link are required");
    }

    return await UpsertAsync(_sanitizer.Sanitize(project), id, cancellationToken);
  }

  [Function("CmsDeleteProject")]
  public async Task<IActionResult> DeleteProjectAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "cms/projects/{id}")] HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    return await DeleteAsync<Project>(request, id, cancellationToken);
  }

  [Function("CmsUpdateEducation")]
  public async Task<IActionResult> UpdateEducationAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "cms/education/{id}")] HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    var education = await ReadJsonAsync<Education>(request, cancellationToken);
    if (education is null)
    {
      return InvalidJson();
    }

    education.Id = id;
    education.Component = Component.Education.ToString().ToLowerInvariant();
    if (
      education.Degrees is null ||
      education.Degrees.Count == 0 ||
      education.Honors?.Societies is null ||
      IsBlank(education.Honors.Societies.Title))
    {
      return ValidationError("Education must include at least one degree and honors content");
    }

    return await UpsertAsync(education, id, cancellationToken);
  }

  [Function("CmsCreateCertification")]
  public async Task<IActionResult> CreateCertificationAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "cms/certifications")] HttpRequest request,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    var input = await ReadJsonAsync<CertificationInput>(request, cancellationToken);
    if (input is null)
    {
      return InvalidJson();
    }

    var certification = BuildCertification(Guid.NewGuid().ToString("N"), input);
    if (certification is null)
    {
      return ValidationError("Certification title, description, and earned date are required");
    }

    return await UpsertAsync(certification, certification.Id, cancellationToken);
  }

  [Function("CmsUpdateCertification")]
  public async Task<IActionResult> UpdateCertificationAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "cms/certifications/{id}")] HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    var input = await ReadJsonAsync<CertificationInput>(request, cancellationToken);
    if (input is null)
    {
      return InvalidJson();
    }

    var certification = BuildCertification(id, input);
    if (certification is null)
    {
      return ValidationError("Certification title, description, and earned date are required");
    }

    return await UpsertAsync(certification, id, cancellationToken);
  }

  [Function("CmsDeleteCertification")]
  public async Task<IActionResult> DeleteCertificationAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "cms/certifications/{id}")] HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    return await DeleteAsync<Certification>(request, id, cancellationToken);
  }

  [Function("CmsUpdateRecognition")]
  public async Task<IActionResult> UpdateRecognitionAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "cms/recognition/{id}")] HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    var recognition = await ReadJsonAsync<WorkRecognition>(request, cancellationToken);
    if (recognition is null)
    {
      return InvalidJson();
    }

    recognition.Id = id;
    recognition.Component = Component.Recognition.ToString().ToLowerInvariant();
    if (recognition.Companies is null || recognition.Companies.Count == 0)
    {
      return ValidationError("Recognition must include at least one company");
    }

    return await UpsertAsync(_sanitizer.Sanitize(recognition), id, cancellationToken);
  }

  private async Task<IActionResult> DeleteAsync<T>(
    HttpRequest request,
    string id,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    try
    {
      await _container.DeleteItemAsync<T>(id, new PartitionKey(id), cancellationToken: cancellationToken);
      return new NoContentResult();
    }
    catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
    {
      return new NotFoundObjectResult(new { message = $"Item not found: {id}" });
    }
  }

  private async Task<IActionResult> UpsertAsync<T>(
    T item,
    string id,
    CancellationToken cancellationToken)
  {
    try
    {
      var result = await _container.UpsertItemAsync(
        item,
        new PartitionKey(id),
        cancellationToken: cancellationToken);
      return new OkObjectResult(result.Resource);
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to save CMS item {Id}", id);
      return new StatusCodeResult(StatusCodes.Status500InternalServerError);
    }
  }

  private async Task<IReadOnlyList<object>> FetchComponentAsync(
    Component component,
    CancellationToken cancellationToken)
  {
    var componentName = component.ToString().ToLowerInvariant();
    var queryDefinition = new QueryDefinition("SELECT * FROM c WHERE c.component = @componentName")
      .WithParameter("@componentName", componentName);

    return component switch
    {
      Component.Footer => await FetchItemsAsync<Footer>(queryDefinition, cancellationToken),
      Component.Recognition => await FetchItemsAsync<WorkRecognition>(queryDefinition, cancellationToken),
      Component.Project => await FetchItemsAsync<Project>(queryDefinition, cancellationToken),
      Component.Home => await FetchItemsAsync<Home>(queryDefinition, cancellationToken),
      Component.Education => await FetchItemsAsync<Education>(queryDefinition, cancellationToken),
      Component.Certification => await FetchItemsAsync<Certification>(queryDefinition, cancellationToken),
      _ => [],
    };
  }

  private async Task<IReadOnlyList<object>> FetchItemsAsync<T>(
    QueryDefinition queryDefinition,
    CancellationToken cancellationToken)
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

  private static Project? BuildProject(string id, ProjectInput input)
  {
    if (IsBlank(input.Title) || IsBlank(input.Description) || IsBlank(input.CodeLink))
    {
      return null;
    }

    return new Project
    {
      Id = id,
      Component = Component.Project.ToString().ToLowerInvariant(),
      Order = input.Order,
      Title = input.Title!.Trim(),
      Description = input.Description!,
      ImageSrc = NormalizeOptional(input.ImageSrc),
      VideoSrc = NormalizeOptional(input.VideoSrc),
      DemoLink = NormalizeOptional(input.DemoLink),
      DemoLinkText = NormalizeOptional(input.DemoLinkText),
      CodeLink = input.CodeLink!.Trim(),
    };
  }

  private static Certification? BuildCertification(string id, CertificationInput input)
  {
    if (IsBlank(input.Title) || IsBlank(input.Description) || IsBlank(input.Earned))
    {
      return null;
    }

    return new Certification
    {
      Id = id,
      Component = Component.Certification.ToString().ToLowerInvariant(),
      Title = input.Title!.Trim(),
      Description = input.Description!.Trim(),
      Link = NormalizeOptional(input.Link),
      Earned = input.Earned!.Trim(),
      Expires = NormalizeOptional(input.Expires),
    };
  }

  private static async Task<T?> ReadJsonAsync<T>(HttpRequest request, CancellationToken cancellationToken)
  {
    try
    {
      return await JsonSerializer.DeserializeAsync<T>(request.Body, JsonOptions, cancellationToken);
    }
    catch (JsonException)
    {
      return default;
    }
  }

  private static string? NormalizeOptional(string? value)
  {
    return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
  }

  private static bool IsBlank(string? value)
  {
    return string.IsNullOrWhiteSpace(value);
  }

  private static BadRequestObjectResult InvalidJson()
  {
    return new BadRequestObjectResult(new { message = "Invalid JSON request body" });
  }

  private static BadRequestObjectResult ValidationError(string message)
  {
    return new BadRequestObjectResult(new { message });
  }
}
