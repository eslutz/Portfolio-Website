namespace PortfolioApi.Models;

public class CosmosConfiguration
{
  public required string ConnectionString { get; set; }
  public required string DatabaseName { get; set; }
  public required string ContainerName { get; set; }
}
