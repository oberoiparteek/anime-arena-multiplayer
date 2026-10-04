import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import dotenv from 'dotenv';
import crypto from 'crypto';
import {
  initGame,
  drawCard,
  placeCard,
  skipTurn,
  GameEngineState,
  CharacterCard,
  UniverseSlug,
  Role,
} from '@anime-arena/game-engine';
import fs from 'fs';
import path from 'path';

dotenv.config();

const server = Fastify({
  logger: true,
});

await server.register(websocket);

server.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const seedPath = path.resolve('../packages/game-engine/src/seed.json');
const CARDS: CharacterCard[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

function generateDeck(): CharacterCard[] {
  return [...CARDS].sort(() => Math.random() - 0.5);
}

interface Match {
  state: GameEngineState;
  clients: { ws: any; playerId: string; playerIndex: 1 | 2; playerName: string }[];
}

const matchQueue: { ws: any; playerId: string; playerName: string }[] = [];
const activeMatches = new Map<string, Match>();

function stripStateForClient(state: GameEngineState): any {
  const stripped = JSON.parse(JSON.stringify(state));
  if (stripped.phase !== 'GAME_OVER') {
    if (stripped.cardPool) {
      delete stripped.cardPool.stats;
      delete stripped.cardPool.role_affinity;
    }
  }
  return stripped;
}

server.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    connection.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'FIND_MATCH') {
          const playerId = data.playerId;
          const playerName = data.playerName || 'Anonymous';
          matchQueue.push({ ws: connection, playerId, playerName });

          if (matchQueue.length >= 2) {
            const player1 = matchQueue.shift()!;
            const player2 = matchQueue.shift()!;

            const matchId = crypto.randomUUID();
            const deck = generateDeck();
            const state = initGame(deck);

            const match: Match = {
              state,
              clients: [
                { ws: player1.ws, playerId: player1.playerId, playerIndex: 1, playerName: player1.playerName },
                { ws: player2.ws, playerId: player2.playerId, playerIndex: 2, playerName: player2.playerName },
              ],
            };

            activeMatches.set(matchId, match);

            const strippedState = stripStateForClient(state);

            player1.ws.send(
              JSON.stringify({
                type: 'MATCH_STARTED',
                matchId,
                state: strippedState,
                playerIndex: 1,
                opponentName: player2.playerName
              })
            );

            player2.ws.send(
              JSON.stringify({
                type: 'MATCH_STARTED',
                matchId,
                state: strippedState,
                playerIndex: 2,
                opponentName: player1.playerName
              })
            );
          }
        } else if (data.type === 'GAME_ACTION') {
          const { matchId, action, payload } = data;
          const match = activeMatches.get(matchId);

          if (!match) {
            connection.send(JSON.stringify({ type: 'ERROR', message: 'Match not found' }));
            return;
          }

          const client = match.clients.find(c => c.ws === connection);
          if (!client) {
             connection.send(JSON.stringify({ type: 'ERROR', message: 'Not a player in this match' }));
             return;
          }

          try {
            let newState = match.state;
            if (action === 'DRAW') {
              newState = drawCard(newState);
            } else if (action === 'PLACE') {
              newState = placeCard(newState, client.playerIndex, payload.slotIndex);
            } else if (action === 'SKIP') {
              newState = skipTurn(newState, client.playerIndex);
            }

            match.state = newState;
            const strippedState = stripStateForClient(newState);

            for (const c of match.clients) {
              c.ws.send(JSON.stringify({ type: 'STATE_UPDATED', state: strippedState }));
            }
          } catch (e: any) {
            connection.send(JSON.stringify({ type: 'ERROR', message: e.message }));
          }
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    });

    connection.on('close', () => {
      const index = matchQueue.findIndex(q => q.ws === connection);
      if (index !== -1) {
        matchQueue.splice(index, 1);
      }
    });
  });
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';
    await server.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
