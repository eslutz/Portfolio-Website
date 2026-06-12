using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using PortfolioApi.Models;

namespace PortfolioApi.Services;

public class CmsAuthorizationService
{
  private const string RequiredProvider = "github";
  private const string RequiredRole = "portfolio_admin";
  private readonly string _adminGitHubUsername;

  public CmsAuthorizationService(IConfiguration configuration)
  {
    _adminGitHubUsername =
      configuration["CMS_ADMIN_GITHUB_USERNAME"]?.Trim() ?? "eslutz";
  }

  public IActionResult? Authorize(HttpRequest request)
  {
    var principal = ParsePrincipal(request);
    if (principal is null)
    {
      return new UnauthorizedObjectResult(new { message = "Authentication required" });
    }

    var providerMatches = string.Equals(
      principal.IdentityProvider,
      RequiredProvider,
      StringComparison.OrdinalIgnoreCase);
    var userMatches = string.Equals(
      principal.UserDetails,
      _adminGitHubUsername,
      StringComparison.OrdinalIgnoreCase);
    var roleMatches = principal.UserRoles.Any(role =>
      string.Equals(role, RequiredRole, StringComparison.OrdinalIgnoreCase));

    if (!providerMatches || !userMatches || !roleMatches)
    {
      return new ObjectResult(new { message = "Access denied" })
      {
        StatusCode = StatusCodes.Status403Forbidden,
      };
    }

    return null;
  }

  private static StaticWebAppsClientPrincipal? ParsePrincipal(HttpRequest request)
  {
    if (!request.Headers.TryGetValue("x-ms-client-principal", out var encodedValues))
    {
      return null;
    }

    var encoded = encodedValues.FirstOrDefault();
    if (string.IsNullOrWhiteSpace(encoded))
    {
      return null;
    }

    try
    {
      var decoded = Convert.FromBase64String(encoded);
      var json = Encoding.UTF8.GetString(decoded);
      return JsonSerializer.Deserialize<StaticWebAppsClientPrincipal>(
        json,
        new JsonSerializerOptions(JsonSerializerDefaults.Web));
    }
    catch (FormatException)
    {
      return null;
    }
    catch (JsonException)
    {
      return null;
    }
  }
}
