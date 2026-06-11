param location string
param workspaceName string
param appInsightsName string
param siteUrl string
param tags object = {}

var webTestName = 'portfoliositeavailability-${appInsightsName}'
var testId = guid(appInsightsName, 'webtest')
var requestId = guid(appInsightsName, 'request')
var webTestXml = '<WebTest Name="Availability" Id="${testId}" Enabled="True" CssProjectStructure="" CssIteration="" Timeout="120" WorkItemIds="" xmlns="http://microsoft.com/schemas/VisualStudio/TeamTest/2010" Description="" CredentialUserName="" CredentialPassword="" PreAuthenticate="True" Proxy="default" StopOnError="False" RecordedResultFile="" ResultsLocale=""><Items><Request Method="GET" Guid="${requestId}" Version="1.1" Url="${siteUrl}" ThinkTime="0" Timeout="120" ParseDependentRequests="False" FollowRedirects="True" RecordResult="True" Cache="False" ResponseTimeGoal="0" Encoding="utf-8" ExpectedHttpStatusCode="200" ExpectedResponseUrl="" ReportingName="" IgnoreHttpStatusCode="False" /></Items></WebTest>'

// Log Analytics Workspace
resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: workspaceName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    workspaceCapping: {}
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Bluefield'
    WorkspaceResourceId: workspace.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Classic ping availability test (free — no charge per execution unlike Standard tests)
resource availabilityTest 'Microsoft.Insights/webtests@2022-06-15' = {
  name: webTestName
  location: location
  kind: 'ping'
  tags: union(tags, {
    'hidden-link:${appInsights.id}': 'Resource'
  })
  properties: {
    SyntheticMonitorId: webTestName
    Name: 'Availability - ${appInsightsName}'
    Enabled: true
    Frequency: 900
    Timeout: 120
    Kind: 'ping'
    Locations: [
      { Id: 'us-ca-sjc-azr' }
      { Id: 'us-va-ash-azr' }
      { Id: 'us-fl-mia-edge' }
      { Id: 'us-il-ch1-azr' }
      { Id: 'us-tx-sn1-azr' }
    ]
    Configuration: {
      WebTest: webTestXml
    }
  }
}

// Alert when 3 or more locations fail
resource availabilityAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: webTestName
  location: 'global'
  tags: union(tags, {
    'hidden-link:${appInsights.id}': 'Resource'
    'hidden-link:${availabilityTest.id}': 'Resource'
  })
  properties: {
    description: 'Alert when availability drops to 3 or more failed locations'
    severity: 1
    enabled: true
    scopes: [
      availabilityTest.id
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.WebtestLocationAvailabilityCriteria'
      webTestId: availabilityTest.id
      componentId: appInsights.id
      failedLocationCount: 3
    }
    actions: []
  }
}

output appInsightsId string = appInsights.id
