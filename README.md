# Public Delegation Dashboard

This package publishes a small public dashboard from the private `Tracker` worksheet in the OneDrive workbook.

## What is public?

Only rows where:
- `ITV/Delegation` = `Delegation`
- `Confirm` = `Confirm`
- the trip has not finished

are published, and only these fields are exposed:

`From`, `Till`, `Overseas Mission`, `Engineer 1`, `Engineer 2`.

The workbook itself is never published.

## Architecture

OneDrive Excel
→ Microsoft Graph
→ GitHub Actions (every 15 minutes)
→ `public/data.json`
→ static dashboard

The dashboard can be hosted on GitHub Pages, Cloudflare Pages, Azure Static Web Apps, or another static host.

## Microsoft Entra / Graph setup

Create an app registration in Microsoft Entra ID.

Add **Application** permission:
- `Files.Read.All`

Grant admin consent.

Create a client secret and store it only as a GitHub Actions secret.

> If your organisation does not permit `Files.Read.All`, use a Power Automate flow or a delegated Graph connection instead.

## GitHub secrets

Add:

- `GRAPH_TENANT_ID`
- `GRAPH_CLIENT_ID`
- `GRAPH_CLIENT_SECRET`
- `ONEDRIVE_USER`
- `ONEDRIVE_FILE_PATH`

Example:

`ONEDRIVE_USER = delegation@yourorg.gov.sg`

`ONEDRIVE_FILE_PATH = /Documents/ITV and Delegation Forecast(1).xlsx`

## Run locally

Node 20+:

```bash
export GRAPH_TENANT_ID="..."
export GRAPH_CLIENT_ID="..."
export GRAPH_CLIENT_SECRET="..."
export ONEDRIVE_USER="..."
export ONEDRIVE_FILE_PATH="/Documents/ITV and Delegation Forecast(1).xlsx"

node scripts/sync-onedrive.js
```

Then serve `public/` with any static server.

## Hosting
