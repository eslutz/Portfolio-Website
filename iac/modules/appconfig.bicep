param location string
param databaseName string
param containerName string

// App Configuration
resource appConfig 'Microsoft.AppConfiguration/configurationStores@2023-03-01' = {
  name: 'portfolio-site-config'
  location: location
  sku: {
    name: 'free'
  }
  properties: {
    encryption: {}
  }
}

// App Configuration Values
resource databaseNameConfig 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'COSMOS_DATABASE_NAME'
  properties: {
    value: databaseName
  }
}

resource containerNameConfig 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: 'COSMOS_CONTAINER_NAME'
  properties: {
    value: containerName
  }
}

output appConfigEndpoint string = appConfig.properties.endpoint
