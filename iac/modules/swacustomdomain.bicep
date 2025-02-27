param staticWebAppName string

// Get reference to existing Static Web App
resource staticWebApp 'Microsoft.Web/staticSites@2022-09-01' existing = {
  name: staticWebAppName
}

// Custom root domain
resource customDomainRoot 'Microsoft.Web/staticSites/customDomains@2022-09-01' = {
  parent: staticWebApp
  name: 'ericslutz.dev'
}

// Custom www domain
resource customDomainWWW 'Microsoft.Web/staticSites/customDomains@2022-09-01' = {
  parent: staticWebApp
  name: 'www.ericslutz.dev'
}

output rootDomainName string = customDomainRoot.name
output wwwDomainName string = customDomainWWW.name
