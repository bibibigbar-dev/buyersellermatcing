# DEAL FACTORY Buyer × Seller Matching

Next.js web dashboard for unified Buyer / Seller / Inventory Offer management and automatic matching.

## Data sources
- Buyer source (read-only): `DEAL FACTORY VIP BUYER REGISTRATION (Responses)`
- Management: `DEAL FACTORY Matching Management`

## Features
- Dashboard KPIs
- Buyer list
- Seller directory
- Inventory offer cards
- Automatic buyer-to-offer matching
- A/B/C/D sales priority
- BEST OFFER and recommended WHAT TO DO
- Daily `/api/sync` route for management-sheet refresh

## Setup
1. Create a Google Cloud service account and enable Google Sheets API.
2. Share the Buyer Sheet as Viewer and the Management Sheet as Editor with the service-account email.
3. Copy `.env.example` to `.env.local` and fill credentials.
4. Run `npm install`.
5. Run `npm run dev`.

## Deploy to Vercel
Import this repository into Vercel and add the environment variables from `.env.example`.
Set `CRON_SECRET` for scheduled sync.

## Matching weights
- Product/category: 40
- Purchase unit: 20
- Budget/MOQ: 15
- Condition: 10
- Location/logistics: 10
- Offer readiness: 5
- Broad vague offer penalty: -10

The Buyer Registration source is read-only. Matching writes go only to the Management spreadsheet.
