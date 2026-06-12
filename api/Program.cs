using System.Text.Json;
using Azure.Monitor.OpenTelemetry.Exporter;
using Microsoft.Azure.Cosmos;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Azure.Functions.Worker.OpenTelemetry;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using OpenTelemetry;
using PortfolioApi.Models;
using PortfolioApi.Services;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

builder.Services.AddOpenTelemetry()
    .UseFunctionsWorkerDefaults()
    .UseAzureMonitorExporter();

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

builder.Services.AddSingleton<CmsAuthorizationService>();
builder.Services.AddSingleton<HtmlContentSanitizer>();
builder.Services.AddSingleton<MediaStorageService>();

builder.Build().Run();
