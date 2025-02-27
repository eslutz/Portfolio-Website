param location string
param cosmosDbAccountId string

// Key Vault
resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: 'portfolio-site-kv'
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

output keyVaultUri string = keyVault.properties.vaultUri
