import { CrewSlot, ScoreBreakdown } from './types';

/**
 * Calculates the score and breakdown for a player's crew.
 * Preserves the exact math from the original index.html
 */
export function calculateScore(team: CrewSlot[]): { score: number, breakdown: ScoreBreakdown } {
    let baseStatScore = 0;
    let synergyBonus = 0;
    let captainAttack = 0;
    let captainBonus = 0;

    team.forEach(slot => {
        if (slot.card) {
            const card = slot.card;
            const role = slot.role;

            // 1. Base Score
            const cardBaseScore = card.stats.Attack + card.stats.Defense + card.stats.Healing;
            baseStatScore += cardBaseScore;

            // 2. Role Synergy Bonus (50 points for matching)
            if (card.role_affinity.includes(role)) {
                synergyBonus += 50;
            }

            // 3. Track Captain Attack for Multiplier
            if (role === 'Captain') {
                captainAttack = card.stats.Attack;
            }
        }
    });

    // 4. Calculate Captain Bonus (50% of Captain's Attack)
    if (captainAttack > 0) {
        captainBonus = Math.round(captainAttack * 0.5);
    }

    const totalScore = baseStatScore + synergyBonus + captainBonus;

    return {
        score: totalScore,
        breakdown: {
            baseStatScore,
            synergyBonus,
            captainAttack,
            captainBonus,
            totalScore
        }
    };
}
