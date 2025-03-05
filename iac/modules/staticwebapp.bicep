param location string
param name string
param repoUrl string
param repoBranch string
param cosmosDbAccountId string
param cosmosDbName string
param cosmosContainerName string
param appInsightsId string

// Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' = {
  name: name
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    branch: repoBranch
    buildProperties: {
      apiLocation: 'api'
      appLocation: '/'
      outputLocation: 'dist/portfolio/browser'
      skipGithubActionWorkflowGeneration: true
    }
    enterpriseGradeCdnStatus: 'Disabled'
    repositoryUrl: repoUrl
    stagingEnvironmentPolicy: 'Enabled'
  }
}

// Static Web App Function App Settings
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2022-09-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    COSMOS_DB_CONNECTION_STRING: listConnectionStrings(cosmosDbAccountId, '2023-04-15').connectionStrings[0].connectionString
    COSMOS_DATABASE: cosmosDbName
    COSMOS_CONTAINER: cosmosContainerName
    APPLICATIONINSIGHTS_CONNECTION_STRING: reference(appInsightsId, '2020-02-02').ConnectionString
    APPINSIGHTS_INSTRUMENTATIONKEY: reference(appInsightsId, '2020-02-02').InstrumentationKey
  }
}

output staticWebAppName string = staticWebApp.name
output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname
