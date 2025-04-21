@description('The name of the static web app')
param staticWebAppName string
@description('The custom root domain')
param rootDomain string

@description('The custom www domain')
var wwwDomain = 'www.${rootDomain}'

// Get reference to existing Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' existing = {
  name: staticWebAppName
}

// Custom root domain
resource customDomainRoot 'Microsoft.Web/staticSites/customDomains@2022-09-01' = {
  parent: staticWebApp
  name: rootDomain
  properties: {
    validationMethod: 'dns-txt-token' // Using TXT validation for apex domain
  }
}

// Custom www domain
resource customDomainWWW 'Microsoft.Web/staticSites/customDomains@2022-09-01' = {
  parent: staticWebApp
  name: wwwDomain
  properties: {
    validationMethod: 'dns-txt-token' // Using TXT validation for www subdomain
  }
}

output rootDomainName string = customDomainRoot.name
output wwwDomainName string = customDomainWWW.name
