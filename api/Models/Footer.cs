using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class Footer
{
  [JsonPropertyName("email")]
  public required string Email { get; set; }

  [JsonPropertyName("github")]
  public required Social Github { get; set; }

  [JsonPropertyName("linkedin")]
  public required Social Linkedin { get; set; }
}

public class Social
{
  [JsonPropertyName("url")]
  public required string Url { get; set; }

  [JsonPropertyName("display")]
  public required string Display { get; set; }
}
