# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (Angular)
```bash
npm start           # Dev server at http://localhost:4200
npm run build       # Production build → dist/portfolio/browser/
npm run watch       # Dev build with watch mode
```

### API (C# Azure Functions)
```bash
cd api
dotnet build        # Build the function app
dotnet run          # Run locally (requires local.settings.json configured)
```

### Full-stack local dev
```bash
npm run swa:start   # Builds Angular + dotnet, starts Azure SWA emulator
                    # Requires: @azure/static-web-apps-cli, dotnet SDK
```

No test suite is configured in this project.

## Architecture

### Overview
Three-layer application deployed to Azure Static Web Apps:
- **`src/`** – Angular 19 SPA (NgModule-based, not standalone components)
- **`api/`** – C# .NET 8 Azure Functions v4 (isolated worker), single endpoint
- **`iac/`** – Bicep templates for all Azure resource provisioning

### Data Flow
All data is fetched dynamically from Cosmos DB. The Angular frontend calls a single API endpoint:

`POST /api/GetCosmosData` with body `{ "component": "<ComponentName>" }`

Valid component names are defined by the `Component` enum in [`api/Models/Component.cs`](api/Models/Component.cs): `Footer`, `Recognition`, `Project`, `Home`, `Education`, `Certification`.

The API deserializes Cosmos DB results into typed C# models (one per component) and returns a typed array. On the frontend, [`PortfolioApiService`](src/app/shared/services/portfolio-api.service.ts) wraps this with a 24-hour RxJS `shareReplay` cache keyed by component name.

### Angular Frontend
- **Routes**: `/` → `HomeComponent`, `/projects` → `ProjectsComponent`, `/achievements` → `AchievementsComponent`, `**` → `ErrorComponent`
- **Features** (`src/app/features/`): one folder per page/section — `home`, `projects`, `project` (single project card), `achievements`, `certifications`, `education`, `work-recognition`
- **Layout** (`src/app/layout/`): `navigation`, `footer`, `error`
- **Shared**: `PortfolioApiService` (single service for all API calls), `OutsideClickDirective`, `ApiError` model
- Build output lands in `dist/portfolio/browser/` (configured in `angular.json`)

### API
- Single Azure Function class [`GetCosmosData`](api/GetCosmosData.cs) handles all data requests
- Cosmos client is initialized in the constructor; if config is missing the function returns 503
- Component name is parsed to the `Component` enum, then Cosmos is queried with `SELECT * FROM c WHERE c.component = @componentName`
- Application Insights telemetry is wired in [`Program.cs`](api/Program.cs)

### Infrastructure (Bicep)
- [`iac/main.bicep`](iac/main.bicep) provisions: Azure Static Web App, Application Insights + Log Analytics workspace, with a reference to an existing Cosmos DB account
- Modules in [`iac/modules/`](iac/modules/): `staticwebapp.bicep`, `appinsights.bicep`, `cosmosdb.bicep`
- [`iac/swacustomdomain.bicep`](iac/swacustomdomain.bicep) is a separate deployment for custom domain setup

### CI/CD
GitHub Actions workflows in `.github/workflows/`:
- `deploy-site.yml` — triggers on push to `main` or PRs; deploys via `Azure/static-web-apps-deploy@v1`. PRs get preview environments that are torn down on PR close.
- `deploy-site-resources.yml` — deploys Bicep IaC
- `deploy-site-custom-domain.yml` — custom domain provisioning

### Local Configuration
The API reads Cosmos connection info from environment variables. For local dev, set in [`api/local.settings.json`](api/local.settings.json):
```json
{
  "Values": {
    "COSMOS_DB_CONNECTION_STRING": "...",
    "COSMOS_DATABASE": "...",
    "COSMOS_CONTAINER": "..."
  }
}
```
`local.settings.json` is excluded from publish but is tracked in git — do not commit real credentials here.
