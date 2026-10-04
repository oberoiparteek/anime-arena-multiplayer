# Anime Arena - Multiplayer

A real-time multiplayer drafting game built with:
- **Frontend**: React + Vite + Zustand + TailwindCSS
- **Backend**: Fastify + WebSockets
- **Engine**: Shared TypeScript Game Engine

## Deployment Architecture

### Backend (Render.com)
- **Root Directory**: `(Leave Blank)`
- **Build Command**: `npm install`
- **Start Command**: `npm run start --workspace=backend`

### Frontend (Vercel)
- **Root Directory**: `anime-arena`
- **Build Command**: `npm run build --workspace=@anime-arena/game-engine && npm run build --workspace=frontend`
- **Output Directory**: `frontend/dist`
- **Environment Variables**: `VITE_WS_URL = wss://your-render-url.onrender.com/ws`
