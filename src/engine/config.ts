export type RiskLevel = 'Low' | 'Medium' | 'High';
export type RowCount = 8 | 10 | 12 | 16;

export interface GameConfig {
    rows: RowCount;
    risk: RiskLevel;
}

export const MULTIPLIERS: Record<RowCount, Record<RiskLevel, number[]>> = {
    8: {
        Low: [2, 1.5, 1.2, 1, 0.5, 1, 1.2, 1.5, 2],
        Medium: [5, 3, 1, 0.5, 0.2, 0.5, 1, 3, 5],
        High: [25, 10, 1, 0.2, 0, 0.2, 1, 10, 25],
    },
    10: {
        Low: [2.5, 2, 1.5, 1.2, 1, 0.5, 1, 1.2, 1.5, 2, 2.5],
        Medium: [10, 5, 3, 1, 0.5, 0.2, 0.5, 1, 3, 5, 10],
        High: [50, 25, 10, 1, 0.2, 0, 0.2, 1, 10, 25, 50],
    },
    12: {
        Low: [3, 2.5, 2, 1.5, 1.2, 1, 0.5, 1, 1.2, 1.5, 2, 2.5, 3],
        Medium: [15, 10, 5, 3, 1, 0.5, 0.2, 0.5, 1, 3, 5, 10, 15],
        High: [100, 50, 25, 10, 1, 0.2, 0, 0.2, 1, 10, 25, 50, 100],
    },
    16: {
        Low: [5, 3, 2.5, 2, 1.5, 1.2, 1, 0.5, 0.2, 0.5, 1, 1.2, 1.5, 2, 2.5, 3, 5],
        Medium: [25, 15, 10, 5, 3, 2, 1, 0.5, 0.2, 0.5, 1, 2, 3, 5, 10, 15, 25],
        High: [500, 100, 50, 25, 10, 3, 1, 0.2, 0, 0.2, 1, 3, 10, 25, 50, 100, 500],
    },
};

export const PHYSICS_CONFIG = {
    pegRadius: 5,
    pegRestitution: 0.5,
    pegFriction: 0.1,

    ballRadius: 8,
    ballRestitution: 0.8,
    ballFriction: 0.05,
    ballFrictionAir: 0.04,
    ballDensity: 0.04,

    pegGapX: 40,
    pegGapY: 40,

    engineGravityY: 1.5, // 1 is normal

    // Plinko stick settings
    maxNudgeForce: 0.02,
};
