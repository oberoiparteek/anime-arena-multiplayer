import { CharacterCard, PlayerState, CrewSlot, Role } from './types';
import { INITIAL_CREW_SLOTS } from './constants';
import { calculateScore } from './scoring';

export type GamePhase = 'WAITING_FOR_DRAW' | 'CARD_DRAWN' | 'GAME_OVER';

export interface GameEngineState {
    deck: CharacterCard[];
    discardPile: CharacterCard[];
    cardPool: CharacterCard | null; // The currently drawn card
    currentPlayer: number; // 1 or 2
    players: {
        1: PlayerState;
        2: PlayerState;
    };
    totalTurns: number;
    phase: GamePhase;
}

/**
 * Initializes a new game state.
 */
export function initGame(cardPool: CharacterCard[]): GameEngineState {
    return {
        deck: [...cardPool],
        discardPile: [],
        cardPool: null,
        currentPlayer: 1,
        players: {
            1: createInitialPlayerState(1),
            2: createInitialPlayerState(2)
        },
        totalTurns: 0,
        phase: 'WAITING_FOR_DRAW'
    };
}

function createInitialPlayerState(id: number): PlayerState {
    // Generate initial empty team based on constants
    const team: CrewSlot[] = [];
    INITIAL_CREW_SLOTS.forEach(slot => {
        for (let i = 0; i < slot.count; i++) {
            team.push({ role: slot.name, card: null });
        }
    });

    return {
        id,
        team,
        skipped: false,
        score: 0,
        scoreBreakdown: {
            baseStatScore: 0,
            synergyBonus: 0,
            captainAttack: 0,
            captainBonus: 0,
            totalScore: 0
        }
    };
}

/**
 * Draws a card from the deck to the center pool.
 */
export function drawCard(state: GameEngineState): GameEngineState {
    if (state.phase !== 'WAITING_FOR_DRAW') {
        throw new Error("Invalid phase: Cannot draw card now.");
    }
    if (state.deck.length === 0) {
        throw new Error("Deck is empty.");
    }

    const newDeck = [...state.deck];
    const drawnCard = newDeck.pop()!; // Take from end (top of deck)

    return {
        ...state,
        deck: newDeck,
        cardPool: drawnCard,
        phase: 'CARD_DRAWN'
    };
}

/**
 * Places the currently drawn card into the active player's slot.
 */
export function placeCard(state: GameEngineState, playerId: number, slotIndex: number): GameEngineState {
    if (state.phase !== 'CARD_DRAWN' || !state.cardPool) {
        throw new Error("Invalid phase: No card to place.");
    }
    if (playerId !== state.currentPlayer) {
        throw new Error("Not your turn.");
    }

    const player = state.players[playerId as 1 | 2];
    const slot = player.team[slotIndex];

    if (!slot) {
        throw new Error("Invalid slot.");
    }
    if (slot.card !== null) {
        throw new Error("Slot already full.");
    }

    const newTeam = [...player.team];
    newTeam[slotIndex] = { ...slot, card: state.cardPool };

    // Calculate score immediately for state mapping
    const { score, breakdown } = calculateScore(newTeam);

    const newPlayerState: PlayerState = {
        ...player,
        team: newTeam,
        score,
        scoreBreakdown: breakdown
    };

    const nextState = advanceTurn({
        ...state,
        cardPool: null,
        players: {
            ...state.players,
            [playerId]: newPlayerState
        }
    });

    return checkGameEnd(nextState);
}

/**
 * Skips the currently drawn card.
 */
export function skipTurn(state: GameEngineState, playerId: number): GameEngineState {
    if (state.phase !== 'CARD_DRAWN' || !state.cardPool) {
        throw new Error("Invalid phase: No card to skip.");
    }
    if (playerId !== state.currentPlayer) {
        throw new Error("Not your turn.");
    }
    
    const player = state.players[playerId as 1 | 2];
    if (player.skipped) {
        throw new Error("You have already used your skip this game.");
    }

    // Discard the card, mark player as skipped, reset phase to DRAW so they can draw again immediately
    return {
        ...state,
        discardPile: [...state.discardPile, state.cardPool],
        cardPool: null,
        phase: 'WAITING_FOR_DRAW',
        players: {
            ...state.players,
            [playerId]: { ...player, skipped: true }
        }
    };
}

function advanceTurn(state: GameEngineState): GameEngineState {
    return {
        ...state,
        totalTurns: state.totalTurns + 1,
        currentPlayer: state.currentPlayer === 1 ? 2 : 1,
        phase: 'WAITING_FOR_DRAW'
    };
}

function checkGameEnd(state: GameEngineState): GameEngineState {
    const p1Full = state.players[1].team.every(s => s.card !== null);
    const p2Full = state.players[2].team.every(s => s.card !== null);

    if (p1Full && p2Full) {
        return {
            ...state,
            phase: 'GAME_OVER'
        };
    }
    return state;
}
