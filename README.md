# GMG API

Integration API for Graphene Manufacturing Group. Connects Arlo (training platform)
to the WordPress certified applicator directory.

## What It Does

One codebase, two ways to run it:

| Mode | Command | What it does |
|---|---|---|
| **Bulk Sync** | `npm run sync` | Pulls ALL passed Spray Academy applicants from Arlo into WordPress |
| **Webhook Server** | `npm start` | Listens for Arlo webhooks - adds each new applicant as they pass |

Both share the exact same core logic (`lib/processor.js`), so they behave
identically - the only difference is what triggers them.

## Project Structure

```
gmg-api/
├── index.js            Webhook server (Express)
├── sync.js             Bulk sync (command line)
├── .env                Credentials
├── lib/
│   ├── arloClient.js   Arlo API - OAuth + fetching registrations
│   ├── wpClient.js     WordPress REST API - create/update posts
│   ├── geocoder.js     Google geocoding - address to lat/lng
│   ├── processor.js    SHARED core logic - "process one applicant"
│   ├── emailSender.js  Placeholder for the congratulations email (future)
│   └── logger.js       Logging
└── logs/               Dated log files
```

## Setup

```bash
npm install
```

Edit `.env` with your credentials:
- Arlo: client ID, secret, platform, refresh token (or access token for testing)
- WordPress: URL, username, application password
- Google: Maps API key (with Geocoding API enabled)

## Usage

### Bulk Sync

Preview without changes:
```bash
npm run sync:dry
```

Sync for real:
```bash
npm run sync
```

### Webhook Server

Start the server:
```bash
npm start
```

Test processing a registration without a real webhook:
```
http://localhost:3000/test?id=32
```

Then expose with ngrok and register the webhook URL in Arlo:
```bash
ngrok http 3000
```

Webhook URL to give Arlo: `https://your-ngrok-url.ngrok-free.dev/webhook`

## Endpoints (Webhook Server)

| Endpoint | Purpose |
|---|---|
| `GET /` | Health check |
| `GET /test?id=NN` | Manually process registration NN (testing) |
| `POST /webhook` | Receives Arlo webhook events |

## How a Person Gets Added

```
1. Arlo sends event (webhook) OR sync fetches registrations
2. For each: fetch full details from Arlo
3. Is it the Spray Academy (SPRA1-OA-001)?  -> if no, skip
4. Have they passed / been certified?       -> if no, skip
5. Geocode their address
6. Already in WordPress?  -> update if changed
   Not in WordPress?      -> create new post
```

## Future: Email

`lib/emailSender.js` is a placeholder. When ready to add the congratulations
email, implement that file and uncomment the email hook in `lib/processor.js`.
The webhook will then add the person to the directory AND email them.

## Deploying

Currently runs locally. To deploy to `api.thermal-xr.com` on Hostinger:
1. Push to the server
2. Run with a process manager (pm2)
3. Update the webhook URL in Arlo to the production domain
