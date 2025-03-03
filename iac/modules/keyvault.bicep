param location string
param name string
param cosmosDbAccountId string
param appInsightsId string // Changed from appInsightsName

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: name
  location: location
  properties: {
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    softDeleteRetentionInDays: 7
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: true
    enabledForDeployment: true
    accessPolicies: []
  }
}

// Store Cosmos DB Connection String in Key Vault
resource cosmosDbConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'CosmosDbConnectionString'
  properties: {
    value: listConnectionStrings(cosmosDbAccountId, '2023-04-15').connectionStrings[0].connectionString
  }
}

// Store App Insights Connection String in Key Vault
resource appInsightsConnectionString 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'AppInsightsConnectionString'
  properties: {
    value: reference(appInsightsId, '2020-02-02').ConnectionString
  }
}

// Store App Insights Instrumentation Key in Key Vault
resource appInsightsInstrumentationKey 'Microsoft.KeyVault/vaults/secrets@2023-02-01' = {
  parent: keyVault
  name: 'AppInsightsInstrumentationKey'
  properties: {
    value: reference(appInsightsId, '2020-02-02').InstrumentationKey
  }
}

output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
