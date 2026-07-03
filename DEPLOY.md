# Deployment guide

This document explains how to deploy the Drivexa backend and both frontends (`driver-app`, `rider-app`).

## 1. Backend — Render (recommended for WebSockets)

1. Push code to GitHub (already done if you followed earlier steps).
2. Sign in to Render (https://render.com) and click **New → Web Service**.
3. Connect your GitHub account and select the `shifak2004/Drivexa` repository.
4. Choose the `backend` folder as the Root Directory (Render supports monorepos).
5. Set the build and start commands:

   - Build command: `npm install`
   - Start command: `npm start`

6. Add environment variables in Render dashboard (Environment tab):

   - `MONGODB_URI` (your MongoDB connection string)
   - `MONGODB_DB_NAME` (e.g. `drivexa`)
   - `JWT_SECRET` (secure string)
   - `PORT` (optional)

7. Create and deploy. Copy the public URL (e.g. `https://drivexa-backend.onrender.com`).

Notes:

- Render supports WebSockets; Socket.IO should work with the default setup.
- If using MongoDB Atlas, allow Render IP access or use the connection string with SRV.

## 2. Frontends — Vercel (driver-app and rider-app)

For each app perform these steps:

1. Go to Vercel (https://vercel.com) and click **New Project** → **Import Git Repository**.
2. Select the `shifak2004/Drivexa` repository, then choose the folder for the project (`driver-app` or `rider-app`).
3. Configure build settings:

   - Framework Preset: `Vite` (or allow auto-detect)
   - Build command: `npm install && npm run build`
   - Output directory: `dist`

4. Add Environment Variables in Project Settings → Environment Variables:

   - `VITE_API_URL` = `https://<your-backend-host>/api` (replace with your Render backend URL)
   - `VITE_SOCKET_URL` = `https://<your-backend-host>`

5. Deploy. Vercel will provide a public URL for each app.

CLI option (if you prefer the Vercel CLI):

```bash
# install globally if needed
# npm i -g vercel
cd driver-app
vercel --prod

cd ../rider-app
vercel --prod
```

After the first deploy, set environment variables in the Vercel dashboard for production.

## 3. Post-deployment checks

- Ensure `VITE_API_URL` and `VITE_SOCKET_URL` point to the backend domain.
- Check browser console/network for CORS or socket errors.
- If Socket.IO fails to connect, check the backend's CORS settings and that the socket URL is correct.

## 4. Optional: Automatic deploys from GitHub

- Both Render and Vercel can be configured to automatically redeploy on GitHub pushes. Enable this when creating the service/project.

## 5. Optional: GitHub Actions (example)

- You can add GitHub Actions workflows to build and deploy automatically. For private tokens and secrets, store them in GitHub Secrets and reference them in the workflow.

---

If you want, I can:

- trigger Vercel deploys using the Vercel CLI here (requires you to run `vercel login` in the terminal or provide deploy tokens), or
- create GitHub Actions workflows to deploy automatically (you must add provider secrets).