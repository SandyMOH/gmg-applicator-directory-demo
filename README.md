# GMG Certified Applicator Directory - Demo v2

Next.js demo with the confirmed 3-tab structure.

## Tabs
- **All** - hubs + independent sprayers on one map
- **Certified Sprayers** - GPX-type sprayers grouped under expandable hub cards; independents shown individually
- **Spray Hubs** - hub entries only

## Matching Logic
A sprayer groups under a hub when company name + state both match.
Works for any company with hub entries (not just Graphonyx).
Sprayers with no matching hub show as individual cards with their own company.

## Run
```bash
npm install
npm run dev
```
Open http://localhost:3000

## Deploy to Vercel
Push to GitHub, import at vercel.com, deploy.
