targetScope = 'subscription'

@description('The location for all resources')
param location string

@description('The name of the resource group')
param resourceGroupName string

@description('The name of the static web app')
param swaName string

@description('The location for the swa resource')
param swaLocation string = 'eastus2'

@description('The url for the repository')
param repoUrl string

@description('The branch for the repository')
param repoBranch string

@description('The name of the database to be created in Cosmos DB')
param databaseName string = 'PortfolioDB'

@description('The name of the container to be created in Cosmos DB')
param containerName string = 'Portfolio-Content'

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
    databaseName: databaseName
    containerName: containerName
  }
}

// Key Vault Resources
module keyVault 'modules/keyvault.bicep' = {
  scope: resourceGroup
  name: 'keyVaultDeploy'
  params: {
    location: location
    cosmosDbAccountId: cosmosDb.outputs.cosmosDbAccountId
  }
}

// App Configuration Resources
module appConfig 'modules/appconfig.bicep' = {
  scope: resourceGroup
  name: 'appConfigDeploy'
  params: {
    location: location
    databaseName: databaseName
    containerName: containerName
  }
}

// Static Web App Resources
module staticWebApp 'modules/staticwebapp.bicep' = {
  scope: resourceGroup
  name: 'staticWebAppDeploy'
  params: {
    name: swaName
    location: swaLocation
    appConfigEndpoint: appConfig.outputs.appConfigEndpoint
    keyVaultUri: keyVault.outputs.keyVaultUri
    repoUrl: repoUrl
    repoBranch: repoBranch
  }
}

// Outputs
output staticWebAppDefaultHostname string = staticWebApp.outputs.staticWebAppDefaultHostname
output cosmosDbEndpoint string = cosmosDb.outputs.cosmosDbEndpoint
output appConfigEndpoint string = appConfig.outputs.appConfigEndpoint
output keyVaultUri string = keyVault.outputs.keyVaultUri
