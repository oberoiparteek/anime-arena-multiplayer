import { create } from 'zustand';
import { initGame, drawCard, placeCard, skipTurn } from '@anime-arena/game-engine';
import type { GameEngineState, CharacterCard } from '@anime-arena/game-engine';
import seedData from '@anime-arena/game-engine/src/seed.json';

const initialDeck = seedData as CharacterCard[];

let ws: WebSocket | null = null;
let currentMatchId: string | null = null;

interface GameStore extends GameEngineState {
    isOnline: boolean;
    myPlayerIndex: 1 | 2 | null;
    opponentName: string | null;
    matchmakingStatus: 'idle' | 'searching' | 'found';
    
    // Actions
    initializeLocal: () => void;
    findMatch: (playerName: string) => void;
    quitOnline: () => void;
    
    // Game Actions
    draw: () => void;
    place: (playerId: number, slotIndex: number) => void;
    skip: (playerId: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
    ...initGame(initialDeck),
    isOnline: false,
    myPlayerIndex: null,
    opponentName: null,
    matchmakingStatus: 'idle',

    initializeLocal: () => {
        set({
            ...initGame(initialDeck),
            isOnline: false,
            myPlayerIndex: null,
            opponentName: null,
            matchmakingStatus: 'idle'
        });
    },

    findMatch: (playerName: string) => {
        set({ matchmakingStatus: 'searching' });
        
        ws = new WebSocket('ws://localhost:3000/ws');
        const playerId = crypto.randomUUID();

        ws.onopen = () => {
            ws?.send(JSON.stringify({ type: 'FIND_MATCH', playerId, playerName }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'MATCH_STARTED') {
                currentMatchId = data.matchId;
                set({
                    ...data.state,
                    isOnline: true,
                    myPlayerIndex: data.playerIndex,
                    opponentName: data.opponentName,
                    matchmakingStatus: 'found'
                });
            } else if (data.type === 'STATE_UPDATED') {
                set({ ...data.state });
            } else if (data.type === 'ERROR') {
                alert('Server Error: ' + data.message);
            }
        };

        ws.onclose = () => {
            if (get().isOnline) {
                alert('Connection lost to matchmaking server.');
                get().quitOnline();
            }
        };
    },

    quitOnline: () => {
        if (ws) {
            ws.close();
            ws = null;
        }
        currentMatchId = null;
        set({
            ...initGame(initialDeck),
            isOnline: false,
            myPlayerIndex: null,
            opponentName: null,
            matchmakingStatus: 'idle'
        });
    },

    draw: () => {
        const state = get();
        if (state.isOnline) {
            if (state.currentPlayer !== state.myPlayerIndex) return;
            ws?.send(JSON.stringify({ type: 'GAME_ACTION', matchId: currentMatchId, action: 'DRAW' }));
        } else {
            set((s) => {
                try { return drawCard(s); } catch(e) { return s; }
            });
        }
    },

    place: (playerId: number, slotIndex: number) => {
        const state = get();
        if (state.isOnline) {
            if (playerId !== state.myPlayerIndex) return;
            if (state.currentPlayer !== state.myPlayerIndex) return;
            ws?.send(JSON.stringify({ type: 'GAME_ACTION', matchId: currentMatchId, action: 'PLACE', payload: { slotIndex } }));
        } else {
            set((s) => {
                try { return placeCard(s, playerId, slotIndex); } catch(e) { return s; }
            });
        }
    },

    skip: (playerId: number) => {
        const state = get();
        if (state.isOnline) {
            if (playerId !== state.myPlayerIndex) return;
            if (state.currentPlayer !== state.myPlayerIndex) return;
            ws?.send(JSON.stringify({ type: 'GAME_ACTION', matchId: currentMatchId, action: 'SKIP' }));
        } else {
            set((s) => {
                try { return skipTurn(s, playerId); } catch(e) { return s; }
            });
        }
    }
}));
