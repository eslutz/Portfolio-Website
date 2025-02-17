using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum RecognitionType
{
  Text,

  Image
}

public class WorkRecognition
{
  [JsonPropertyName("id")]
  public required string Id { get; set; }

  [JsonPropertyName("component")]
  public required string Component { get; set; }

  [JsonPropertyName("companies")]
  public required List<Company> Companies { get; set; }
}

public class Company
{
  [JsonPropertyName("company")]
  public required string CompanyName { get; set; }

  [JsonPropertyName("description")]
  public required string Description { get; set; }

  [JsonPropertyName("recognition")]
  public required List<Recognition> Recognitions { get; set; }
}

public class Recognition
{
  [JsonPropertyName("type")]
  public RecognitionType Type { get; set; }

  [JsonPropertyName("date")]
  public string? Date { get; set; }

  [JsonPropertyName("description")]
  public string? Description { get; set; }

  [JsonPropertyName("quote")]
  public string? Quote { get; set; }

  [JsonPropertyName("src")]
  public string? Src { get; set; }

  [JsonPropertyName("alt")]
  public string? Alt { get; set; }
}
