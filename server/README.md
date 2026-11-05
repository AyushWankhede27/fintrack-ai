# FinTrack AI: server

Express 5 + MongoDB API. `cp .env.example .env`, fill it in, then `npm install && npm run dev`. Tests: `npm test`.

Deploy (Render): root dir `server`, build `npm install`, start `npm start`, set the env vars from `.env.example`, set `FRONTEND_URL` to your Vercel URL, and use MongoDB Atlas.

Every AI feature works without `OPENAI_API_KEY` (regex parser, keyword categoriser, heuristic insights).

Routes: POST /api/auth/signup|login, GET /api/auth/me, CRUD /api/transactions, POST /api/transactions/import/preview|commit, GET|POST|PUT /api/budget, GET /api/dashboard/summary, GET /api/reports/monthly?year=&month=&format=pdf, POST /api/ai/insights|predict|parse|chat|goal, GET /api/ai/anomalies|recurring.
