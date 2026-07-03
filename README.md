# Drivexa — Ride Booking Platform

Drivexa is a full-stack demo ride-booking platform with separate Rider and Driver web applications and a Node.js + Socket.IO backend.

**Live demo / Deployment:** https://your-drivexa-deployment.example.com  (replace with your real URL)

## Tech stack

- Backend: Node.js, Express, Socket.IO, MongoDB (Mongoose)
- Frontend: React, Vite
- Maps & geo: Leaflet, react-leaflet
- Auth: JWT-based tokens, bcrypt password hashing

## Repository layout

- `backend/` — Express API + Socket.IO server (entry: `server.js`)
- `driver-app/` — React driver UI (Vite)
- `rider-app/` — React rider UI (Vite)
- `start-drivexa.cmd` — convenience script to start services (Windows)

## Quick prerequisites

- Node.js (16+ recommended) and npm
- MongoDB (local or Atlas) reachable from backend

## Environment variables

Create a `.env` file in `backend/` with at least the following:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=drivexa
JWT_SECRET=replace_this_with_a_secure_value
```

Frontend apps can optionally set the API / socket URLs in `driver-app/.env` and `rider-app/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

If you deploy the backend to a different host, set `VITE_API_URL` and `VITE_SOCKET_URL` to the deployed addresses.

## Run locally

Open a terminal for each service or use the included `start-drivexa.cmd` on Windows.

Backend (development):

```powershell
cd backend
npm install
npm run dev   # uses `node --watch server.js` (auto-restart on change)
```

Backend (production):

```powershell
cd backend
npm install --production
npm start     # runs `node server.js`
```

Driver app:

```powershell
cd driver-app
npm install
npm run dev   # opens Vite dev server (default port shown in console)
```

Rider app:

```powershell
cd rider-app
npm install
npm run dev
```

The frontends default to `http://localhost:5000/api` for API calls when `VITE_API_URL` is not set.

## API overview

- Auth: `POST /api/auth/rider/signup`, `POST /api/auth/rider/login`, `POST /api/auth/driver/signup`, `POST /api/auth/driver/login`, `GET /api/auth/profile`
- Rides: `POST /api/rides` and ride lifecycle endpoints under `/api/rides`
- Drivers: driver listing and status under `/api/drivers`
- Ratings: rating endpoints under `/api/ratings`

All protected routes require an `Authorization: Bearer <token>` header.

## Sockets

The backend initializes a Socket.IO server (same port as the API by default). The frontends use `socket.io-client` to connect and listen for events such as `new-ride-request`, `ride-accepted`, `ride-status-update`, and `driver-location-update`.

## Building & deployment

Frontends (build for production):

```powershell
cd driver-app
npm run build

cd ../rider-app
npm run build
```

Serve the `dist` folders with a static host (Netlify, Vercel, Surge, or a static file server). The backend can be deployed to providers like Render, Fly.io, Heroku (container), or a VPS. If you deploy backend separately, update `VITE_API_URL` / `VITE_SOCKET_URL` accordingly.

Suggested deployment flow:

1. Deploy backend (obtain public API + socket URLs).  Keep `JWT_SECRET` and `MONGODB_URI` in provider environment settings.
2. Build and deploy each frontend, setting `VITE_API_URL` and `VITE_SOCKET_URL` to the backend address.

## Docker (optional)

You can containerize the backend and frontends. Minimal steps:

1. Add a `Dockerfile` for `backend`, build and push to registry.
2. Build static frontend assets and serve with a small Nginx image.

## Troubleshooting

- If the backend fails to start, check `MONGODB_URI` and that MongoDB is reachable.
- Ensure `JWT_SECRET` is set before creating users.
- If CORS/socket connections fail, confirm `VITE_API_URL`/`VITE_SOCKET_URL` and that the frontend origin is allowed by backend CORS (backend allows localhost origins by default).

## Where to look in the code

- Backend entry: [backend/server.js](backend/server.js)
- MongoDB connect: [backend/config/db.js](backend/config/db.js)
- Socket handler: [backend/socket/socketHandler.js](backend/socket/socketHandler.js)
- Driver frontend API helper: [driver-app/src/services/api.js](driver-app/src/services/api.js)
- Rider frontend API helper: [rider-app/src/services/api.js](rider-app/src/services/api.js)

---

If you provide the actual deployment URL I can replace the placeholder with the real link, or I can add a `backend/.env.example` file. Want me to add that? 
