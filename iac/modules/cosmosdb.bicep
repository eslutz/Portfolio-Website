param existingAccountName string
param databaseName string
param containerName string
param tags object = {}

// Reference existing Cosmos DB Account
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2024-11-15' existing = {
  name: existingAccountName
}

// Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-11-15' = {
  parent: cosmosDbAccount
  name: databaseName
  tags: tags
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Cosmos DB Container
resource cosmosDatabaseContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-11-15' = {
  parent: cosmosDatabase
  name: containerName
  tags: tags
  properties: {
    resource: {
      id: containerName
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
    }
  }
}

output databaseName string = cosmosDatabase.name
output containerName string = cosmosDatabaseContainer.name
