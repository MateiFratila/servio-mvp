# Azure Deployment Guide

This app deploys as a single **Azure App Service** (Linux, Node 20). Express serves the built React SPA, so no separate frontend hosting is needed.

---

## 1. Configure App Settings

Set production environment variables (never commit these to source control):

```bash
az webapp config appsettings set \
  --resource-group servio-rg \
  --name servio \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="mysql://<db-admin>:<password>@servio-db.mysql.database.azure.com:3306/servio?sslaccept=strict" \
    JWT_SECRET="<long-random-secret>"
```

Set the startup command so App Service uses the root `package.json` `start` script:
```bash
az webapp config set \
  --resource-group servio-rg \
  --name servio \
  --startup-file "npm start"
```

Disable Oryx build (the CI workflow deploys a pre-built artifact):
```bash
az webapp config appsettings set \
  --resource-group servio-rg \
  --name servio \
  --settings SCM_DO_BUILD_DURING_DEPLOYMENT=false
```

---

## 2. Configure GitHub Actions secrets

In your GitHub repository → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|---|---|
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Contents of the publish profile (see below) |
| `DATABASE_URL` | Full MySQL connection string (same as App Setting above) |

Download the publish profile:
```bash
az webapp deployment list-publishing-profiles \
  --resource-group servio-rg \
  --name servio \
  --xml
```
Paste the entire XML output as the `AZURE_WEBAPP_PUBLISH_PROFILE` secret.

---

## 3. First deployment

Push to `main` (or trigger manually via **Actions → Run workflow**). The pipeline:

1. Installs dependencies
2. Builds `client/dist`
3. Generates the Prisma client
4. Runs `prisma migrate deploy` against the production DB
5. Prunes dev dependencies
6. Deploys a zip artifact to App Service

After the first successful deploy, your app is live at `https://servio.azurewebsites.net`.

---

## 4. Subsequent deployments

Every push to `main` triggers the full pipeline automatically. Database migrations are applied before the new code goes live, ensuring zero-downtime schema changes for backwards-compatible migrations.

---

## Notes

- **Scaling**: Upgrade the App Service Plan SKU (`S1`, `P1v3`, etc.) for production load or autoscale rules.
- **Custom domain**: Configure via `az webapp config hostname add`.
- **HTTPS**: App Service provides a free managed TLS certificate for `*.azurewebsites.net`. For custom domains use `az webapp config ssl bind`.
- **Logs**: Stream live logs with `az webapp log tail --resource-group servio-rg --name servio`.
