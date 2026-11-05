# FinTrack AI: client
`cp .env.example .env`, then `npm install && npm run dev` (http://localhost:5173). The API must be running.
Deploy on Vercel: root dir `client`, env var `VITE_API_URL=https://YOUR-API.onrender.com/api`. Then add the Vercel URL to `FRONTEND_URL` on the API.
