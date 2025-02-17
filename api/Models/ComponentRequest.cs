using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class ComponentRequest
{
  [JsonPropertyName("component")]
  public string? Component { get; set; }
}
