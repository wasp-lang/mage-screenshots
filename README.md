# Mage Screenshot Repo

Test repo for generating screenshots for https://usemage.ai apps.

## Setup

Install dependencies:

```bash
npm install
```

Install Chromium:

```bash
npx playwright install chromium
```

Copy `.env.example` to `.env` and fill in the required environment variables.

### Run as web app locally

Run the server:

```bash
npm run server
```

Run the client:

```bash
npm run client
```

### Run as CLI

```bash
npm run cli -- --url https://usemage.ai/result/{uuid}
```
