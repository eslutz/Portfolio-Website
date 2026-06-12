using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class StaticWebAppsClientPrincipal
{
  [JsonPropertyName("identityProvider")]
  public string? IdentityProvider { get; set; }

  [JsonPropertyName("userId")]
  public string? UserId { get; set; }

  [JsonPropertyName("userDetails")]
  public string? UserDetails { get; set; }

  [JsonPropertyName("userRoles")]
  public List<string> UserRoles { get; set; } = [];
}

public class HomeInput
{
  public string? Title { get; set; }
  public string? Subtitle { get; set; }
  public string? Content { get; set; }
}

public class ProjectInput
{
  public int Order { get; set; }
  public string? Title { get; set; }
  public string? Description { get; set; }
  public string? ImageSrc { get; set; }
  public string? VideoSrc { get; set; }
  public string? DemoLink { get; set; }
  public string? DemoLinkText { get; set; }
  public string? CodeLink { get; set; }
}

public class CertificationInput
{
  public string? Title { get; set; }
  public string? Description { get; set; }
  public string? Link { get; set; }
  public string? Earned { get; set; }
  public string? Expires { get; set; }
}

public class MediaUploadResult
{
  public required string Url { get; set; }
  public required string BlobName { get; set; }
  public required string ContentType { get; set; }
  public long Size { get; set; }
}
