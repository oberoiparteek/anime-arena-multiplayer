export type Role = 'Captain' | 'Vice Captain' | 'Tank' | 'Healer' | 'Support';
export type UniverseSlug = 'one-piece' | 'naruto' | 'dragon-ball';

export interface CardStats {
    Attack: number;
    Defense: number;
    Healing: number;
}

export interface CharacterCard {
    id: string;
    external_id: string;
    name: string;
    universe: UniverseSlug;
    role_affinity: Role[];
    stats: CardStats; // Used only for end-game calculation!
    img_url: string;
}

export interface CrewSlot {
    role: Role;
    card: CharacterCard | null;
}

export interface ScoreBreakdown {
    baseStatScore: number;
    synergyBonus: number;
    captainAttack: number;
    captainBonus: number;
    totalScore: number;
}

export interface PlayerState {
    id: number;
    team: CrewSlot[];
    skipped: boolean;
    score: number;
    scoreBreakdown: ScoreBreakdown;
}
