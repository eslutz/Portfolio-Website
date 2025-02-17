using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class Project
{
  [JsonPropertyName("id")]
  public required string Id { get; set; }

  [JsonPropertyName("component")]
  public required string Component { get; set; }

  [JsonPropertyName("order")]
  public int Order { get; set; }

  [JsonPropertyName("title")]
  public required string Title { get; set; }

  [JsonPropertyName("description")]
  public required string Description { get; set; }

  [JsonPropertyName("imageSrc")]
  public string? ImageSrc { get; set; }

  [JsonPropertyName("videoSrc")]
  public string? VideoSrc { get; set; }

  [JsonPropertyName("demoLink")]
  public string? DemoLink { get; set; }

  [JsonPropertyName("demoLinkText")]
  public string? DemoLinkText { get; set; }

  [JsonPropertyName("codeLink")]
  public required string CodeLink { get; set; }
}
