using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class Certification
{
  [JsonPropertyName("id")]
  public required string Id { get; set; }

  [JsonPropertyName("component")]
  public required string Component { get; set; }

  [JsonPropertyName("title")]
  public required string Title { get; set; }

  [JsonPropertyName("description")]
  public required string Description { get; set; }

  [JsonPropertyName("link")]
  public string? Link { get; set; }

  [JsonPropertyName("earned")]
  public required string Earned { get; set; }

  [JsonPropertyName("expires")]
  public string? Expires { get; set; }
}
