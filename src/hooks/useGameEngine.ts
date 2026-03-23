import { useState, useCallback, useRef } from 'react';
import type { RiskLevel, RowCount } from '../engine/config';
import { MULTIPLIERS } from '../engine/config';
import { audio } from '../engine/audio';
import { PlinkoEngine } from '../engine/PlinkoEngine';

interface GameState {
    balance: number;
    bet: number;
    risk: RiskLevel;
    rows: RowCount;
    isPlaying: boolean;
    history: { multiplier: number; win: number }[];
    activeDrops: number;
}

export const useGameEngine = (initialBalance = 1000) => {
    const [gameState, setGameState] = useState<GameState>({
        balance: initialBalance,
        bet: 10,
        risk: 'Low',
        rows: 8,
        isPlaying: false,
        history: [],
        activeDrops: 0,
    });

    const engineRef = useRef<PlinkoEngine | null>(null);

    const setEngine = useCallback((engine: PlinkoEngine) => {
        engineRef.current = engine;
    }, []);

    const updateConfig = (updates: Partial<Pick<GameState, 'bet' | 'risk' | 'rows'>>) => {
        setGameState((prev) => {
            const nextState = { ...prev, ...updates };
            if (updates.rows && engineRef.current) {
                engineRef.current.updateBoard(updates.rows);
            }
            return nextState;
        });
    };

    const dropBall = useCallback((offsetX = 0) => {
        if (gameState.balance < gameState.bet) return null;
        if (!engineRef.current) return null;

        setGameState((prev) => ({
            ...prev,
            balance: prev.balance - prev.bet,
            activeDrops: prev.activeDrops + 1,
            isPlaying: true,
        }));

        audio.playDrop();
        const ballId = engineRef.current.dropBall(offsetX);
        return ballId;
    }, [gameState.balance, gameState.bet]);

    const onDropEnd = useCallback((slotIndex: number) => {
        setGameState((prev) => {
            const multiplier = MULTIPLIERS[prev.rows][prev.risk][slotIndex] || 0;
            const winAmount = prev.bet * multiplier;

            audio.playLand(multiplier);

            return {
                ...prev,
                balance: prev.balance + winAmount,
                activeDrops: Math.max(0, prev.activeDrops - 1),
                history: [{ multiplier, win: winAmount }, ...prev.history].slice(0, 50),
                isPlaying: prev.activeDrops - 1 > 0,
            };
        });
    }, []);

    const nudgeBalls = useCallback((direction: 'left' | 'right') => {
        if (engineRef.current) {
            engineRef.current.nudgeActiveBalls(direction);
        }
    }, []);

    return {
        gameState,
        updateConfig,
        setEngine,
        dropBall,
        onDropEnd,
        nudgeBalls,
    };
};
