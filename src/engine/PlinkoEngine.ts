import Matter from 'matter-js';
import type { RowCount } from './config';
import { PHYSICS_CONFIG } from './config';
import { audio } from './audio';

export type OnDropEndCallback = (slotIndex: number) => void;

interface PlinkoEngineOptions {
    container: HTMLElement;
    width: number;
    height: number;
    onDropEnd: OnDropEndCallback;
}

export class PlinkoEngine {
    public engine: Matter.Engine;
    public render: Matter.Render;
    public runner: Matter.Runner;
    private width: number;
    private height: number;
    private onDropEnd: OnDropEndCallback;

    private activeBalls: Matter.Body[] = [];
    private pegs: Matter.Body[] = [];
    private sensors: Matter.Body[] = [];

    constructor({ container, width, height, onDropEnd }: PlinkoEngineOptions) {
        this.width = width;
        this.height = height;
        this.onDropEnd = onDropEnd;

        // Create engine
        this.engine = Matter.Engine.create({
            gravity: { x: 0, y: PHYSICS_CONFIG.engineGravityY, scale: 0.001 },
            enableSleeping: true,
        });

        // Create renderer
        this.render = Matter.Render.create({
            element: container,
            engine: this.engine,
            options: {
                width,
                height,
                wireframes: false,
                background: 'transparent', // We'll handle background in CSS
                pixelRatio: window.devicePixelRatio,
            },
        });

        // Create runner
        this.runner = Matter.Runner.create();

        // Collision events
        Matter.Events.on(this.engine, 'collisionStart', this.handleCollision.bind(this));

        Matter.Render.run(this.render);
        Matter.Runner.run(this.runner, this.engine);
    }

    public updateBoard(rows: RowCount) {
        // Clear previous bodies
        Matter.World.clear(this.engine.world, false);
        this.pegs = [];
        this.sensors = [];
        this.activeBalls = [];

        // Pegs layout calculation
        const startY = 100;
        const { pegGapX, pegGapY, pegRadius } = PHYSICS_CONFIG;

        // Create Pegs
        for (let row = 0; row < rows; row++) {
            const pinsInRow = row + 3; // Top row has 3 pins, etc.
            const rowWidth = (pinsInRow - 1) * pegGapX;
            const startX = (this.width - rowWidth) / 2;

            for (let i = 0; i < pinsInRow; i++) {
                const x = startX + i * pegGapX;
                const y = startY + row * pegGapY;

                const peg = Matter.Bodies.circle(x, y, pegRadius, {
                    isStatic: true,
                    restitution: PHYSICS_CONFIG.pegRestitution,
                    friction: PHYSICS_CONFIG.pegFriction,
                    render: {
                        fillStyle: '#e0e7ff', // Bright peg color
                        shadowColor: '#4f46e5',
                        shadowBlur: 10,
                    } as any, // extended render props
                    label: 'peg',
                });
                this.pegs.push(peg);
            }
        }

        // Create bottom sensors
        const bottomRowPins = rows + 2; // last row pins
        const bottomRowWidth = (bottomRowPins - 1) * pegGapX;
        const bottomStartX = (this.width - bottomRowWidth) / 2;
        const sensorY = startY + rows * pegGapY + 20;

        const slotsCount = rows + 1; // Number of slots is always rows + 1
        const slotGap = pegGapX;
        const sensorsStartX = bottomStartX + slotGap / 2;

        for (let i = 0; i < slotsCount; i++) {
            const x = sensorsStartX + i * slotGap;
            const sensor = Matter.Bodies.rectangle(x, sensorY, slotGap - 2, 20, {
                isStatic: true,
                isSensor: true,
                label: `sensor-${i}`,
                render: {
                    fillStyle: 'transparent'
                }
            });
            this.sensors.push(sensor);
        }

        // Walls
        const wallOptions = { isStatic: true, render: { visible: false } };
        const leftWall = Matter.Bodies.rectangle(-25, this.height / 2, 50, this.height, wallOptions);
        const rightWall = Matter.Bodies.rectangle(this.width + 25, this.height / 2, 50, this.height, wallOptions);

        Matter.World.add(this.engine.world, [...this.pegs, ...this.sensors, leftWall, rightWall]);
    }

    public dropBall(offsetX: number = 0) {
        // Add tiny random variance to avoid deterministic paths
        const randomOffset = (Math.random() - 0.5) * 0.5;
        const startX = this.width / 2 + offsetX + randomOffset;
        const startY = 40; // Above top pegs

        const ball = Matter.Bodies.circle(startX, startY, PHYSICS_CONFIG.ballRadius, {
            restitution: PHYSICS_CONFIG.ballRestitution,
            friction: PHYSICS_CONFIG.ballFriction,
            frictionAir: PHYSICS_CONFIG.ballFrictionAir,
            density: PHYSICS_CONFIG.ballDensity,
            label: 'ball',
            render: {
                fillStyle: '#22d3ee', // Cyan ball
                strokeStyle: '#06b6d4',
                lineWidth: 2,
            },
        });

        this.activeBalls.push(ball);
        Matter.World.add(this.engine.world, ball);
        return ball.id;
    }

    public nudgeActiveBalls(direction: 'left' | 'right') {
        const forceX = direction === 'left' ? -PHYSICS_CONFIG.maxNudgeForce : PHYSICS_CONFIG.maxNudgeForce;
        this.activeBalls.forEach(ball => {
            Matter.Body.applyForce(ball, ball.position, { x: forceX, y: 0 });
        });
    }

    private handleCollision(event: Matter.IEventCollision<Matter.Engine>) {
        const pairs = event.pairs;

        for (const pair of pairs) {
            const { bodyA, bodyB } = pair;

            // Check if ball hit a sensor
            const isBallA = bodyA.label === 'ball';
            const isBallB = bodyB.label === 'ball';

            const isSensorA = bodyA.label.startsWith('sensor-');
            const isSensorB = bodyB.label.startsWith('sensor-');

            if ((isBallA && bodyB.label === 'peg') || (isBallB && bodyA.label === 'peg')) {
                audio.playTick();
            }

            if ((isBallA && isSensorB) || (isBallB && isSensorA)) {
                const ball = isBallA ? bodyA : bodyB;
                const sensor = isSensorA ? bodyA : bodyB;

                const slotIndex = parseInt(sensor.label.split('-')[1], 10);

                // Remove ball
                this.removeBall(ball);

                // Trigger callback
                this.onDropEnd(slotIndex);
            }
        }
    }

    private removeBall(ball: Matter.Body) {
        Matter.World.remove(this.engine.world, ball);
        this.activeBalls = this.activeBalls.filter(b => b.id !== ball.id);
    }

    public destroy() {
        Matter.Render.stop(this.render);
        Matter.Runner.stop(this.runner);
        if (this.render.canvas) {
            this.render.canvas.remove();
        }
        Matter.World.clear(this.engine.world, false);
        Matter.Engine.clear(this.engine);
    }
}
