targetScope = 'subscription'

@description('The location for all resources')
param location string = 'eastus'
@description('The location for the swa resource')
param swaLocation string = 'eastus2'
@description('The name of the application')
param appName string
@description('The url for the repository')
param repoUrl string
@description('The branch for the repository')
param repoBranch string
@description('The name of the existing Cosmos DB account')
param existingCosmosDbAccountName string
@description('The resource group of the existing Cosmos DB account')
param existingCosmosDbResourceGroup string

@description('The name of the resource group')
var resourceGroupName = '${appName}-resource-group'
@description('The properties for Cosmos DB')
var cosmos = {
  dbName: '${appName}-db'
  containerName: '${appName}-container'
}
@description('The properties for Application Insights')
var appInsights = {
  workspaceName: '${appName}-log-analytics-workspace'
  name: '${appName}-app-insights'
}
@description('The name of the static web app')
var swaName = '${appName}-swa'

// Resource Group
resource resourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
}

// Reference existing Cosmos DB Account
resource existingCosmosDbRG 'Microsoft.Resources/resourceGroups@2021-04-01' existing = {
  name: existingCosmosDbResourceGroup
}

resource existingCosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' existing = {
  scope: existingCosmosDbRG
  name: existingCosmosDbAccountName
}

// Cosmos DB Resources
module cosmosDb 'modules/cosmosdb.bicep' = {
  scope: existingCosmosDbRG
  name: 'cosmosDbDeploy'
  params: {
    existingAccountName: existingCosmosDbAccountName
    databaseName: cosmos.dbName
    containerName: cosmos.containerName
  }
}

// App Insights Resources
module applicationInsights 'modules/appinsights.bicep' = {
  scope: resourceGroup
  name: 'appInsightsDeploy'
  params: {
    location: swaLocation
    workspaceName: appInsights.workspaceName
    appInsightsName: appInsights.name
  }
}

// Static Web App Resources
module staticWebApp 'modules/staticwebapp.bicep' = {
  scope: resourceGroup
  name: 'staticWebAppDeploy'
  params: {
    name: swaName
    location: swaLocation
    repoUrl: repoUrl
    repoBranch: repoBranch
    cosmosDbAccountId: existingCosmosDbAccount.id
    cosmosDbName: cosmos.dbName
    cosmosContainerName: cosmos.containerName
    appInsightsId: applicationInsights.outputs.appInsightsId
  }
}

// Outputs
output staticWebAppName string = swaName
output resourceGroupName string = resourceGroupName
output staticWebAppDefaultHostname string = staticWebApp.outputs.staticWebAppDefaultHostname
output cosmosDbEndpoint string = existingCosmosDbAccount.properties.documentEndpoint
