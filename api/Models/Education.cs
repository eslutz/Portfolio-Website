using System.Text.Json.Serialization;

namespace PortfolioApi.Models;

public class Education
{
  [JsonPropertyName("id")]
  public required string Id { get; set; }

  [JsonPropertyName("component")]
  public required string Component { get; set; }

  [JsonPropertyName("degrees")]
  public required List<Degree> Degrees { get; set; }

  [JsonPropertyName("honors")]
  public required Honors Honors { get; set; }
}

public class Degree
{
  [JsonPropertyName("institution")]
  public required string Institution { get; set; }

  [JsonPropertyName("degree")]
  public required string DegreeName { get; set; }

  [JsonPropertyName("honors")]
  public string? Honors { get; set; }

  [JsonPropertyName("details")]
  public string? Details { get; set; }

  [JsonPropertyName("graduationYear")]
  public int GraduationYear { get; set; }

  [JsonPropertyName("gpa")]
  public double Gpa { get; set; }
}

public class Honors
{
  [JsonPropertyName("societies")]
  public required Society Societies { get; set; }

  [JsonPropertyName("lists")]
  public required HonorLists Lists { get; set; }
}

public class Society
{
  [JsonPropertyName("title")]
  public required string Title { get; set; }

  [JsonPropertyName("description")]
  public required string Description { get; set; }
}

public class HonorLists
{
  [JsonPropertyName("list")]
  public required List<List> List { get; set; }

  [JsonPropertyName("link")]
  public required Link Link { get; set; }
}

public class List
{
  [JsonPropertyName("title")]
  public required string Title { get; set; }

  [JsonPropertyName("description")]
  public required string Description { get; set; }

  [JsonPropertyName("details")]
  public required string Details { get; set; }
}

public class Link
{
  [JsonPropertyName("title")]
  public required string Title { get; set; }

  [JsonPropertyName("description")]
  public required string Description { get; set; }
}
