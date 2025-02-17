using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class Home
{
  [JsonPropertyName("id")]
  public required string Id { get; set; }

  [JsonPropertyName("component")]
  public required string Component { get; set; }

  [JsonPropertyName("title")]
  public required string Title { get; set; }

  [JsonPropertyName("content")]
  public required string Content { get; set; }
}
