using System.Text.Json;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PortfolioApi.Models;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// Application Insights isn't enabled by default. See https://aka.ms/AAt8mw4.
builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

builder.Services.AddOptions<CosmosConfiguration>()
  .Configure<IConfiguration>((options, config) =>
  {
    options.ConnectionString = config["COSMOS_DB_CONNECTION_STRING"] ?? string.Empty;
    options.DatabaseName = config["COSMOS_DATABASE"] ?? string.Empty;
    options.ContainerName = config["COSMOS_CONTAINER"] ?? string.Empty;
  })
  .Validate(options => !string.IsNullOrWhiteSpace(options.ConnectionString), "COSMOS_DB_CONNECTION_STRING is not configured")
  .Validate(options => !string.IsNullOrWhiteSpace(options.DatabaseName), "COSMOS_DATABASE is not configured")
  .Validate(options => !string.IsNullOrWhiteSpace(options.ContainerName), "COSMOS_CONTAINER is not configured")
  .ValidateOnStart();

builder.Services.AddSingleton(serviceProvider =>
{
  var cosmosConfig = serviceProvider.GetRequiredService<IOptions<CosmosConfiguration>>().Value;
  var clientOptions = new CosmosClientOptions
  {
    UseSystemTextJsonSerializerWithOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web)
  };
  return new CosmosClient(cosmosConfig.ConnectionString, clientOptions);
});

builder.Services.AddSingleton(serviceProvider =>
{
  var cosmosConfig = serviceProvider.GetRequiredService<IOptions<CosmosConfiguration>>().Value;
  return serviceProvider.GetRequiredService<CosmosClient>()
    .GetContainer(cosmosConfig.DatabaseName, cosmosConfig.ContainerName);
});

builder.Logging.Services.Configure<LoggerFilterOptions>(options =>
{
  LoggerFilterRule? defaultRule = options.Rules.FirstOrDefault(rule => rule.ProviderName
          == "Microsoft.Extensions.Logging.ApplicationInsights.ApplicationInsightsLoggerProvider");
  if (defaultRule is not null)
  {
    options.Rules.Remove(defaultRule);
  }
});

builder.Build().Run();
