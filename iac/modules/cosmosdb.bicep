param existingAccountName string
param databaseName string
param containerName string

// Reference existing Cosmos DB Account
resource cosmosDbAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' existing = {
  name: existingAccountName
}

// Cosmos DB Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosDbAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

// Cosmos DB Container
resource cosmosDatabaseContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: containerName
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
