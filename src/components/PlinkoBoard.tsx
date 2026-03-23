import { useEffect, useRef, useState, useMemo } from 'react';
import { useGameEngine } from '../hooks/useGameEngine';
import { PlinkoEngine } from '../engine/PlinkoEngine';
import { MULTIPLIERS, type RowCount, type RiskLevel, PHYSICS_CONFIG } from '../engine/config';
import { audio } from '../engine/audio';
import './PlinkoBoard.css';

const width = 800;
const height = 800;

export const PlinkoBoard = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { gameState, setEngine, updateConfig, dropBall, onDropEnd, nudgeBalls } = useGameEngine();

    // Interaction State for stick
    const [stickOffset, setStickOffset] = useState(0);
    const [autoPlay, setAutoPlay] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(true);

    useEffect(() => {
        if (!containerRef.current) return;

        const engine = new PlinkoEngine({
            container: containerRef.current,
            width,
            height,
            onDropEnd,
        });

        engine.updateBoard(gameState.rows);
        setEngine(engine);

        return () => {
            engine.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setEngine, onDropEnd]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (autoPlay) {
            interval = setInterval(() => {
                dropBall(0);
            }, 500);
        }
        return () => clearInterval(interval);
    }, [autoPlay, dropBall]);

    const handleDrop = () => {
        audio.init();
        dropBall(stickOffset);
    };

    const handleNudge = (dir: 'left' | 'right') => {
        nudgeBalls(dir);
    };

    const currentMultipliers = useMemo(() => {
        return MULTIPLIERS[gameState.rows][gameState.risk];
    }, [gameState.rows, gameState.risk]);

    // Calculate the layout for the bottom slots to match the physics engine
    const slotGap = PHYSICS_CONFIG.pegGapX;
    const bottomRowPins = gameState.rows + 2;
    const bottomRowWidth = (bottomRowPins - 1) * slotGap;
    const bottomStartX = (width - bottomRowWidth) / 2;
    const sensorsStartX = bottomStartX + slotGap / 2;

    return (
        <div className="game-container">
            <div className="controls-panel">
                <div className="balance-display">
                    <h2>Balance: ${gameState.balance.toFixed(2)}</h2>
                </div>

                <div className="control-group">
                    <label>Bet Amount: ${gameState.bet}</label>
                    <input
                        type="range"
                        min="10"
                        max="1000"
                        step="10"
                        value={gameState.bet}
                        onChange={(e) => updateConfig({ bet: Number(e.target.value) })}
                    />
                </div>

                <div className="control-group">
                    <label>Risk Level:</label>
                    <select
                        value={gameState.risk}
                        onChange={(e) => updateConfig({ risk: e.target.value as RiskLevel })}
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                <div className="control-group">
                    <label>Rows:</label>
                    <select
                        value={gameState.rows}
                        onChange={(e) => updateConfig({ rows: Number(e.target.value) as RowCount })}
                    >
                        <option value="8">8</option>
                        <option value="10">10</option>
                        <option value="12">12</option>
                        <option value="16">16</option>
                    </select>
                </div>

                <div className="stick-control">
                    <label>Spawn Offset ({stickOffset}px):</label>
                    <input
                        type="range"
                        min="-100"
                        max="100"
                        value={stickOffset}
                        onChange={(e) => setStickOffset(Number(e.target.value))}
                    />
                </div>

                <div className="nudge-controls">
                    <button onClick={() => { audio.init(); setAutoPlay(!autoPlay); }}>
                        {autoPlay ? 'STOP AUTO' : 'AUTO PLAY'}
                    </button>
                    <button onClick={() => { setAudioEnabled(audio.toggleMute()); }}>
                        {audioEnabled ? 'MUTE' : 'UNMUTE'}
                    </button>
                </div>

                <button className="drop-btn" onClick={handleDrop}>DROP BALL</button>

                <div className="nudge-controls">
                    <button onClick={() => handleNudge('left')}>Nudge Left</button>
                    <button onClick={() => handleNudge('right')}>Nudge Right</button>
                </div>

                <div className="history">
                    <h3>Recent Drops</h3>
                    <div className="history-list">
                        {gameState.history.slice(0, 5).map((h, i) => (
                            <span key={i} className={`history-item ${h.multiplier >= 1 ? 'win' : 'loss'}`}>
                                {h.multiplier}x
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="board-area">
                <div ref={containerRef} className="physics-container" style={{ width, height }}>
                    {/* Physics canvas renders here */}
                </div>

                {/* Render the multiplier slots as HTML overlays matching exact X coordinates */}
                <div className="slots-container" style={{
                    width: width,
                    top: 100 + gameState.rows * PHYSICS_CONFIG.pegGapY + 20,
                    position: 'absolute'
                }}>
                    {currentMultipliers.map((mult, i) => {
                        const x = sensorsStartX + i * slotGap - (slotGap / 2); // Center minus half width

                        // Color mapping logic based on risk/multiplier
                        let colorClass = 'slot-low';
                        if (mult >= 10) colorClass = 'slot-high';
                        else if (mult >= 2) colorClass = 'slot-mid';
                        else if (mult < 1) colorClass = 'slot-loss';

                        return (
                            <div
                                key={i}
                                className={`multiplier-slot ${colorClass}`}
                                style={{
                                    left: x,
                                    width: slotGap - 4, // slight padding
                                    position: 'absolute'
                                }}
                            >
                                {mult}x
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
