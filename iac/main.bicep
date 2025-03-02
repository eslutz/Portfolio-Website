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

@description('The name of the resource group')
var resourceGroupName = '${appName}-resource-group'
@description('The properties for Cosmos DB')
var cosmos = {
  accountName: replace('${appName}dbaccount', '-', '')
  dbName: '${appName}-db'
  containerName: '${appName}-container'
}
@description('The name of the Key Vault')
var keyVaultName = '${appName}-key-vault'
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

// Cosmos DB Resources
module cosmosDb 'modules/cosmosdb.bicep' = {
  scope: resourceGroup
  name: 'cosmosDbDeploy'
  params: {
    location: location
    name: cosmos.accountName
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

// Key Vault Resources
module keyVault 'modules/keyvault.bicep' = {
  scope: resourceGroup
  name: 'keyVaultDeploy'
  params: {
    location: location
    name: keyVaultName
    cosmosDbAccountId: cosmosDb.outputs.cosmosDbAccountId
    appInsightsId: applicationInsights.outputs.appInsightsId
  }
}

// App Configuration Resources
module appConfig 'modules/appconfig.bicep' = {
  scope: resourceGroup
  name: 'appConfigDeploy'
  params: {
    location: location
    databaseName: cosmos.dbName
    containerName: cosmos.containerName
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
    appConfigEndpoint: appConfig.outputs.appConfigEndpoint
    keyVaultUri: keyVault.outputs.keyVaultUri
  }
}

// Outputs
output staticWebAppName string = swaName
output resourceGroupName string = resourceGroupName
output staticWebAppDefaultHostname string = staticWebApp.outputs.staticWebAppDefaultHostname
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint
output appConfigEndpoint string = appConfig.outputs.appConfigEndpoint
output keyVaultUri string = keyVault.outputs.keyVaultUri
