using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using PortfolioApi.Services;

namespace PortfolioApi;

public class CmsMediaFunctions
{
  private readonly CmsAuthorizationService _authorizationService;
  private readonly MediaStorageService _mediaStorageService;
  private readonly ILogger<CmsMediaFunctions> _logger;

  public CmsMediaFunctions(
    CmsAuthorizationService authorizationService,
    MediaStorageService mediaStorageService,
    ILogger<CmsMediaFunctions> logger)
  {
    _authorizationService = authorizationService;
    _mediaStorageService = mediaStorageService;
    _logger = logger;
  }

  [Function("CmsUploadMedia")]
  public async Task<IActionResult> UploadMediaAsync(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "cms/media")] HttpRequest request,
    CancellationToken cancellationToken)
  {
    var unauthorized = _authorizationService.Authorize(request);
    if (unauthorized is not null)
    {
      return unauthorized;
    }

    if (!request.HasFormContentType)
    {
      return new BadRequestObjectResult(new { message = "Media upload requires multipart form data" });
    }

    try
    {
      var form = await request.ReadFormAsync(cancellationToken);
      var file = form.Files.GetFile("file");
      if (file is null)
      {
        return new BadRequestObjectResult(new { message = "Upload field 'file' is required" });
      }

      var result = await _mediaStorageService.UploadAsync(
        file,
        form["category"].FirstOrDefault(),
        cancellationToken);
      return new OkObjectResult(result);
    }
    catch (InvalidOperationException ex)
    {
      return new BadRequestObjectResult(new { message = ex.Message });
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to upload CMS media");
      return new StatusCodeResult(StatusCodes.Status500InternalServerError);
    }
  }
}
