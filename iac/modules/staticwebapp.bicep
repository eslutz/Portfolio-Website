param name string
param location string
param appConfigEndpoint string
param keyVaultUri string
param repoUrl string
param repoBranch string

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
    APP_CONFIG_ENDPOINT: appConfigEndpoint
    KEY_VAULT_ENDPOINT: keyVaultUri
  }
}

output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname
