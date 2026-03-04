import { useEffect, useRef, useCallback, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import gsap from "gsap";

interface SkaterGameProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

const SKATER_LEFT = 80;
const OBS_SPEED = 2.5;
const SPAWN_MIN = 1400;
const SPAWN_MAX = 2800;

type ObstacleType = "cone" | "barrier" | "text404" | "alert";

interface Obstacle {
  id: number;
  x: number;
  type: ObstacleType;
  width: number;
  height: number;
  passed: boolean;
}

export function SkaterGame({ title, message, onRetry }: SkaterGameProps) {
  const navigate = useNavigate();
  const loadingRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<gsap.core.Tween | null>(null);
  const activeRef = useRef(false);
  const ouchRef = useRef(false);
  const speedRef = useRef(1);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const obsIdRef = useRef(0);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const frameRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [, forceRender] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(() => new Set());

  const pressKey = (k: string) => setPressedKeys(p => new Set(p).add(k));
  const unpressKey = (k: string) => setPressedKeys(p => { const n = new Set(p); n.delete(k); return n; });
  const flashKey = (k: string, ms = 400) => { pressKey(k); setTimeout(() => unpressKey(k), ms); };

  // --- Create line tween helper ---
  const createLineTween = useCallback(() => {
    const el = loadingRef.current;
    if (!el) return null;
    return gsap.to(el, {
      keyframes: [{
        '--line-top-x': '-100%',
        '--line-bottom-x': '-200%',
        onComplete() { gsap.set(el, { '--line-top-x': '200%', '--line-bottom-x': '100%' }); }
      }, {
        '--line-top-x': '0%',
        '--line-bottom-x': '0%'
      }],
      duration: 1,
      repeat: -1
    });
  }, []);

  // --- Line animation init ---
  useEffect(() => {
    const tween = createLineTween();
    if (tween) linesRef.current = tween;
    return () => { if (linesRef.current) linesRef.current.kill(); };
  }, [createLineTween]);

  // --- Action functions (faithful port) ---
  const resetFn = useCallback(() => {
    const el = loadingRef.current;
    const lines = linesRef.current;
    if (!el || !lines || !activeRef.current) return;
    gsap.to(el, { '--skate-x': '0px', duration: 0.3 });
    gsap.to(el, {
      duration: 0.2,
      '--arm-front': '24deg', '--arm-front-end': '-48deg',
      '--arm-back': '164deg', '--arm-back-end': '-50deg',
      '--leg-front': '40deg', '--leg-front-end': '30deg',
      '--leg-back': '120deg', '--leg-back-end': '-36deg',
      '--board-r': '0deg', '--board-x': '0px',
      '--body-r': '12deg', '--body-y': '-65%', '--body-x': '-85%',
      onComplete() {
        activeRef.current = false;
        speedRef.current = 1;
        lines.play();
        lines.timeScale(1);
      }
    });
  }, []);

  const jumpFn = useCallback(() => {
    const el = loadingRef.current;
    const lines = linesRef.current;
    if (!el || !lines || activeRef.current) return;
    activeRef.current = true;
    speedRef.current = 2;
    lines.timeScale(2);
    gsap.to(el, {
      keyframes: [
        { '--skate-x': '-12px', duration: 0.3 },
        { '--skate-x': '12px', duration: 0.5 },
        { '--skate-x': '0px', duration: 0.5 },
      ]
    });
    gsap.to(el, {
      keyframes: [
        { '--skate-y': '-32px', duration: 0.4, delay: 0.2 },
        { '--skate-y': '0px', duration: 0.2 },
      ]
    });
    gsap.to(el, {
      keyframes: [
        {
          duration: 0.2, delay: 0.2,
          '--arm-front': '40deg', '--arm-front-end': '-12deg',
          '--arm-back': '172deg', '--arm-back-end': '38deg',
          '--leg-front': '-8deg', '--leg-front-end': '102deg',
          '--leg-back': '103deg', '--leg-back-end': '-16deg',
          '--board-r': '-40deg', '--body-r': '7deg',
          '--body-y': '-90%', '--body-x': '-160%',
        },
        {
          duration: 0.2,
          '--arm-front': '24deg', '--arm-front-end': '-48deg',
          '--arm-back': '172deg', '--arm-back-end': '15deg',
          '--leg-front': '22deg', '--leg-front-end': '55deg',
          '--leg-back': '142deg', '--leg-back-end': '-58deg',
          '--board-r': '3deg', '--body-r': '12deg',
          '--body-y': '-56%', '--body-x': '-60%',
        },
        {
          duration: 0.2,
          '--arm-front': '24deg', '--arm-front-end': '-48deg',
          '--arm-back': '164deg', '--arm-back-end': '-36deg',
          '--leg-front': '-4deg', '--leg-front-end': '66deg',
          '--leg-back': '111deg', '--leg-back-end': '-36deg',
          '--board-r': '0deg', '--body-r': '34deg',
          '--body-y': '-53%', '--body-x': '-28%',
        },
        {
          duration: 0.4,
          '--arm-front': '24deg', '--arm-front-end': '-48deg',
          '--arm-back': '164deg', '--arm-back-end': '-50deg',
          '--leg-front': '40deg', '--leg-front-end': '30deg',
          '--leg-back': '120deg', '--leg-back-end': '-36deg',
          '--board-r': '0deg', '--body-r': '12deg',
          '--body-y': '-65%', '--body-x': '-85%',
          onComplete() {
            activeRef.current = false;
            speedRef.current = 1;
            lines.timeScale(1);
          }
        }
      ]
    });
  }, []);

  const fastFn = useCallback(() => {
    const el = loadingRef.current;
    const lines = linesRef.current;
    if (!el || !lines || activeRef.current) return;
    activeRef.current = true;
    speedRef.current = 2.5;
    lines.timeScale(2.5);
    gsap.to(el, { '--skate-x': '12px', duration: 0.3 });
    gsap.to(el, {
      duration: 0.2,
      '--arm-front': '24deg', '--arm-front-end': '-48deg',
      '--arm-back': '164deg', '--arm-back-end': '-36deg',
      '--leg-front': '-4deg', '--leg-front-end': '66deg',
      '--leg-back': '111deg', '--leg-back-end': '-36deg',
      '--board-r': '0deg', '--body-r': '34deg',
      '--body-y': '-53%', '--body-x': '-28%',
    });
  }, []);

  const slowFn = useCallback(() => {
    const el = loadingRef.current;
    const lines = linesRef.current;
    if (!el || !lines || activeRef.current) return;
    activeRef.current = true;
    speedRef.current = 0.5;
    lines.timeScale(0.5);
    gsap.to(el, { '--skate-x': '-12px', duration: 0.3 });
    gsap.to(el, {
      duration: 0.2,
      '--arm-front': '32deg', '--arm-front-end': '20deg',
      '--arm-back': '156deg', '--arm-back-end': '-22deg',
      '--leg-front': '19deg', '--leg-front-end': '74deg',
      '--leg-back': '134deg', '--leg-back-end': '-29deg',
      '--board-r': '-15deg', '--body-r': '-8deg',
      '--body-y': '-65%', '--body-x': '-110%',
    });
  }, []);

  const downFn = useCallback(() => {
    const el = loadingRef.current;
    if (!el || activeRef.current) return;
    activeRef.current = true;
    gsap.to(el, {
      duration: 0.2,
      '--arm-front': '-26deg', '--arm-front-end': '-58deg',
      '--arm-back': '204deg', '--arm-back-end': '60deg',
      '--leg-front': '40deg', '--leg-front-end': '80deg',
      '--leg-back': '150deg', '--leg-back-end': '-96deg',
      '--body-r': '180deg', '--body-y': '-100%',
    });
  }, []);

  const fallFn = useCallback(() => {
    const el = loadingRef.current;
    const lines = linesRef.current;
    if (!el || !lines || activeRef.current) return;
    activeRef.current = true;
    ouchRef.current = true;
    speedRef.current = 0;
    lines.pause();
    setGameOver(true);
    gsap.to(el, { duration: 0.5, '--board-x': '60px' });
    gsap.to(el, {
      keyframes: [
        { '--board-r': '-40deg', duration: 0.15 },
        { '--board-r': '0deg', duration: 0.3 },
      ]
    });
    gsap.to(el, {
      keyframes: [
        {
          '--line-top-x': '-100%', '--line-bottom-x': '-200%',
          '--body-r': '-8deg',
          '--leg-back-end': '24deg', '--leg-back': '60deg',
          '--leg-front-end': '30deg', '--leg-front': '10deg',
          '--arm-back-end': '-40deg', '--arm-back': '54deg',
          '--arm-front-end': '-28deg', '--arm-front': '24deg',
          duration: 0.2,
        },
        {
          '--body-x': '-85%', '--body-y': '36%', '--body-r': '-26deg',
          '--leg-back-end': '24deg', '--leg-back': '20deg',
          '--leg-front-end': '30deg', '--leg-front': '-10deg',
          '--arm-back-end': '-40deg', '--arm-back': '164deg',
          '--arm-front-end': '-28deg', '--arm-front': '24deg',
          duration: 0.2,
        }
      ]
    });
  }, []);

  // --- Restart game ---
  const restartGame = useCallback(() => {
    const el = loadingRef.current;
    if (!el) return;

    gsap.killTweensOf(el);

    gsap.set(el, {
      '--arm-front': '24deg', '--arm-front-end': '-48deg',
      '--arm-back': '164deg', '--arm-back-end': '-50deg',
      '--leg-front': '40deg', '--leg-front-end': '30deg',
      '--leg-back': '120deg', '--leg-back-end': '-36deg',
      '--board-r': '0deg', '--board-x': '0px',
      '--body-r': '12deg', '--body-y': '-65%', '--body-x': '-85%',
      '--skate-x': '0px', '--skate-y': '0px',
      '--line-top-x': '0%', '--line-bottom-x': '0%',
    });

    activeRef.current = false;
    ouchRef.current = false;
    speedRef.current = 1;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);

    const tween = createLineTween();
    if (tween) linesRef.current = tween;

    forceRender(n => n + 1);
  }, [createLineTween]);

  // --- Obstacle spawning ---
  useEffect(() => {
    const spawn = () => {
      const canvas = canvasRef.current;
      if (canvas && !ouchRef.current) {
        const types: ObstacleType[] = ["cone", "barrier", "text404", "alert"];
        const type = types[Math.floor(Math.random() * types.length)];
        let w = 20, h = 25;
        if (type === "barrier") { w = 15; h = 30; }
        if (type === "text404") { w = 40; h = 22; }
        if (type === "alert") { w = 28; h = 24; }
        obstaclesRef.current.push({
          id: obsIdRef.current++, x: canvas.clientWidth + 10,
          type, width: w, height: h, passed: false,
        });
        forceRender(n => n + 1);
      }
      const delay = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      spawnTimerRef.current = setTimeout(spawn, delay);
    };
    spawnTimerRef.current = setTimeout(spawn, SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN));
    return () => { if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current); };
  }, []);

  // --- Game loop ---
  useEffect(() => {
    const tick = () => {
      const el = loadingRef.current;
      const canvas = canvasRef.current;
      if (!el || !canvas) { frameRef.current = requestAnimationFrame(tick); return; }
      if (ouchRef.current) { frameRef.current = requestAnimationFrame(tick); return; }

      const speed = OBS_SPEED * speedRef.current;
      const obstacles = obstaclesRef.current;
      let dirty = false;

      const skateYStr = el.style.getPropertyValue('--skate-y') || '0px';
      const jumpAbove = Math.abs(parseFloat(skateYStr));
      const skateXStr = el.style.getPropertyValue('--skate-x') || '0px';
      const skateX = parseFloat(skateXStr);
      const sLeft = SKATER_LEFT + skateX;
      const sRight = sLeft + 40;

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;
        if (obs.x < -60) { obstacles.splice(i, 1); dirty = true; continue; }
        if (!obs.passed && obs.x + obs.width < sLeft) {
          obs.passed = true;
          scoreRef.current++;
          setScore(scoreRef.current);
        }
        if (!obs.passed && !ouchRef.current) {
          if (sRight > obs.x + 4 && sLeft < obs.x + obs.width - 4 && jumpAbove < obs.height - 4) {
            fallFn();
            break;
          }
        }
      }

      const els = canvas.querySelectorAll<HTMLElement>('[data-obstacle]');
      els.forEach(dom => {
        const id = parseInt(dom.dataset.obstacle || '');
        const obs = obstacles.find(o => o.id === id);
        if (obs) dom.style.transform = `translateX(${obs.x}px)`;
      });

      if (dirty) forceRender(n => n + 1);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [fallFn]);

  // --- Keyboard ---
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (e.repeat) return;
      if (e.key === 'ArrowRight') { fastFn(); pressKey('right'); }
      if (e.key === 'ArrowDown') { downFn(); pressKey('down'); }
      if (e.key === 'ArrowLeft') { slowFn(); pressKey('left'); }
      if (e.key === 'c' || e.key === 'C') fallFn();
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === ' ') {
        jumpFn();
        flashKey('up');
        if (ouchRef.current) { ouchRef.current = false; resetFn(); }
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        if (!ouchRef.current) resetFn();
        if (e.key === 'ArrowRight') unpressKey('right');
        if (e.key === 'ArrowDown') unpressKey('down');
        if (e.key === 'ArrowLeft') unpressKey('left');
      }
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [jumpFn, fastFn, slowFn, downFn, fallFn, resetFn]);

  // Cleanup GSAP on unmount
  useEffect(() => {
    const el = loadingRef.current;
    return () => { if (el) gsap.killTweensOf(el); };
  }, []);

  const renderObstacle = (obs: Obstacle) => {
    const base: React.CSSProperties = { position: 'absolute', bottom: 2, left: 0, transform: `translateX(${obs.x}px)` };
    switch (obs.type) {
      case 'cone':
        return <div key={obs.id} data-obstacle={obs.id} style={base}><div className="sg-cone" /></div>;
      case 'barrier':
        return <div key={obs.id} data-obstacle={obs.id} style={base}><div className="sg-barrier" /></div>;
      case 'text404':
        return <div key={obs.id} data-obstacle={obs.id} style={{ ...base, width: obs.width, height: obs.height }} className="sg-text-obs">{title}</div>;
      case 'alert':
        return (
          <div key={obs.id} data-obstacle={obs.id} style={{ ...base, width: obs.width, height: obs.height }} className="sg-alert-obs">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="skater-game">
      <style>{STYLES}</style>

      <h1 className="sg-title">{title} — {message}</h1>

      <div className="sg-canvas" ref={canvasRef}>
        {/* In-game score (top-left, hidden on game over) */}
        {!gameOver && <div className="sg-score-live">Score: {score}</div>}

        {/* Skater */}
        <div className="sg-loading" ref={loadingRef}>
          <div className="sg-skate">
            <div className="sg-body">
              <div className="sg-arm back" />
              <div className="sg-arm front" />
              <div className="sg-leg back" />
              <div className="sg-leg front" />
            </div>
            <div className="sg-board">
              <svg viewBox="0 0 34 8">
                <path d="M0.897306 0.911767C1.22218 0.30263 1.97934 0.072188 2.58848 0.397061L2.91936 0.573532C3.75214 1.01768 4.68144 1.25 5.62525 1.25H28.3752C29.3191 1.25 30.2484 1.01768 31.0811 0.573532L31.412 0.397061C32.0212 0.072188 32.7783 0.30263 33.1032 0.911767C33.4281 1.5209 33.1976 2.27807 32.5885 2.60294L32.2576 2.77941C31.0627 3.41667 29.7294 3.75 28.3752 3.75H27.9692C28.5841 4.09118 29.0002 4.747 29.0002 5.5C29.0002 6.60457 28.1048 7.5 27.0002 7.5C25.8957 7.5 25.0002 6.60457 25.0002 5.5C25.0002 4.747 25.4164 4.09118 26.0312 3.75H7.96925C8.5841 4.09118 9.00025 4.747 9.00025 5.5C9.00025 6.60457 8.10482 7.5 7.00025 7.5C5.89568 7.5 5.00025 6.60457 5.00025 5.5C5.00025 4.747 5.41639 4.09118 6.03124 3.75H5.62525C4.27109 3.75 2.93774 3.41667 1.74289 2.77941L1.41201 2.60294C0.802874 2.27807 0.572432 1.5209 0.897306 0.911767Z" />
              </svg>
            </div>
            <div className="sg-line" />
            <div className="sg-line bottom" />
          </div>
        </div>

        {/* Obstacles */}
        {obstaclesRef.current.map(renderObstacle)}

        {/* Ground line */}
        <div className="sg-ground" />

        {/* Game over overlay */}
        {gameOver && (
          <div className="sg-gameover">
            <div className="sg-gameover-title">Game Over</div>
            <div className="sg-gameover-score">Score: {score}</div>
            <div className="sg-gameover-buttons">
              <Button variant="outline" size="sm" onClick={restartGame}>Reset</Button>
              {onRetry && <Button variant="outline" size="sm" onClick={onRetry}>Try Again</Button>}
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>Go Back</Button>
              <Button variant="outline" size="sm" onClick={() => navigate({ to: "/" })}>Go Home</Button>
            </div>
          </div>
        )}
      </div>

      {/* Arrow keys (always visible) */}
      <div className="sg-keyboard">
        <button className={`sg-key up${pressedKeys.has('up') ? ' pressed' : ''}`} onClick={() => {
          if (ouchRef.current) { ouchRef.current = false; resetFn(); }
          jumpFn();
          flashKey('up');
        }} aria-label="Jump">
          <svg viewBox="0 0 8 8"><path d="M3.99953 1C3.83653 1 3.68353 1.0795 3.59003 1.2135L0.0900328 6.2135C-0.0169672 6.366-0.0289672 6.5655 0.0560328 6.731C0.142533 6.8965 0.313033 7 0.499533 7H7.50003C7.68653 7 7.85753 6.8965 7.94353 6.731C8.02853 6.5655 8.01653 6.366 7.90953 6.2135L4.40953 1.2135C4.31653 1.0795 4.16353 1 4.00053 1Z" /></svg>
        </button>
        <button className={`sg-key left${pressedKeys.has('left') ? ' pressed' : ''}`}
          onPointerDown={() => { slowFn(); pressKey('left'); }}
          onPointerUp={() => { if (!ouchRef.current) resetFn(); unpressKey('left'); }}
          onPointerLeave={() => { if (!ouchRef.current) resetFn(); unpressKey('left'); }}
          aria-label="Slow">
          <svg viewBox="0 0 8 8"><path d="M1 4.00053C1 4.16353 1.0795 4.31653 1.2135 4.41003L6.2135 7.91003C6.366 8.01703 6.5655 8.02903 6.731 7.94403C6.8965 7.85753 7 7.68703 7 7.50053V0.499533C7 0.313033 6.8965 0.142033 6.731 0.0560328C6.5655-0.0289672 6.366-0.0169672 6.2135 0.0900328L1.2135 3.59003C1.0795 3.68353 1 3.83653 1 3.99953Z" /></svg>
        </button>
        <button className={`sg-key down${pressedKeys.has('down') ? ' pressed' : ''}`}
          onPointerDown={() => { downFn(); pressKey('down'); }}
          onPointerUp={() => { if (!ouchRef.current) resetFn(); unpressKey('down'); }}
          onPointerLeave={() => { if (!ouchRef.current) resetFn(); unpressKey('down'); }}
          aria-label="Crouch">
          <svg viewBox="0 0 8 8"><path d="M4.00053 7C4.16353 7 4.31653 6.9205 4.41003 6.7865L7.91003 1.7865C8.01703 1.634 8.02903 1.4345 7.94403 1.269C7.85753 1.1035 7.68703 1 7.50053 1H0.499533C0.313033 1 0.142533 1.1035 0.0560328 1.269C-0.0289672 1.4345-0.0169672 1.634 0.0900328 1.7865L3.59003 6.7865C3.68353 6.9205 3.83653 7 3.99953 7Z" /></svg>
        </button>
        <button className={`sg-key right${pressedKeys.has('right') ? ' pressed' : ''}`}
          onPointerDown={() => { fastFn(); pressKey('right'); }}
          onPointerUp={() => { if (!ouchRef.current) resetFn(); unpressKey('right'); }}
          onPointerLeave={() => { if (!ouchRef.current) resetFn(); unpressKey('right'); }}
          aria-label="Fast">
          <svg viewBox="0 0 8 8"><path d="M7 3.99953C7 3.83653 6.9205 3.68353 6.7865 3.59003L1.7865 0.0900328C1.6345-0.0169672 1.4345-0.0289672 1.269 0.0560328C1.1035 0.142533 1 0.313033 1 0.499533V7.50003C1 7.68653 1.1035 7.85753 1.269 7.94353C1.4345 8.02853 1.634 8.01653 1.7865 7.90953L6.7865 4.40953C6.9205 4.31653 7 4.16353 7 4.00053Z" /></svg>
        </button>
      </div>
    </div>
  );
}

const STYLES = `
.skater-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  gap: 24px;
  padding: 16px;
  user-select: none;
}

.skater-game .sg-title {
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin: 0;
  background-image: linear-gradient(135deg, #6366f1, #8b5cf6, #14b8a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.skater-game .sg-canvas {
  position: relative;
  width: 100%;
  max-width: 900px;
  height: 280px;
  overflow: hidden;
  background: transparent;
}

.skater-game .sg-ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 0;
  border-top: 2px solid var(--muted-foreground, #555);
}

/* In-game score (top-left of canvas) */
.skater-game .sg-score-live {
  position: absolute;
  top: 8px;
  left: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--primary, #14b8a6);
  z-index: 5;
}

/* === Game over overlay === */
.skater-game .sg-gameover {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  -webkit-backdrop-filter: blur(10px);
  z-index: 10;
}

.skater-game .sg-gameover-title {
  font-size: 1.6rem;
  font-weight: 800;
  background-image: linear-gradient(135deg, #6366f1, #8b5cf6, #14b8a6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.skater-game .sg-gameover-score {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary, #14b8a6);
}

.skater-game .sg-gameover-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

/* === Skater (ported from CodePen SCSS) === */

.skater-game .sg-loading {
  --arm-front: 24deg;
  --arm-front-end: -48deg;
  --arm-back: 164deg;
  --arm-back-end: -50deg;
  --leg-front: 40deg;
  --leg-front-end: 30deg;
  --leg-back: 120deg;
  --leg-back-end: -36deg;
  --board-r: 0deg;
  --board-x: 0px;
  --body-r: 12deg;
  --body-y: -65%;
  --body-x: -85%;
  --skate-x: 0px;
  --skate-y: 0px;
  --sg-color: var(--primary, #14b8a6);
  --line-top-x: 0%;
  --line-bottom-x: 0%;
  position: absolute;
  bottom: 2px;
  left: ${SKATER_LEFT}px;
}

.skater-game .sg-skate {
  position: relative;
  width: 40px;
  height: 46px;
  transform: translate(var(--skate-x), var(--skate-y)) translateZ(0);
}

.skater-game .sg-body {
  background: var(--sg-color);
  height: 15px;
  width: 7px;
  border-radius: 4px;
  transform-origin: 4px 11px;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(var(--body-x), var(--body-y)) rotate(var(--body-r)) translateZ(0);
}

.skater-game .sg-body::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 4px;
  bottom: 16px;
  left: 0;
  position: absolute;
  background: var(--sg-color);
  transform: translateY(-0.5px);
}

/* Arms & legs shared base */
.skater-game .sg-arm,
.skater-game .sg-arm::before,
.skater-game .sg-leg,
.skater-game .sg-leg::before {
  content: '';
  width: var(--w, 11px);
  height: 4px;
  top: var(--t, 0);
  left: var(--l, 2px);
  border-radius: 2px;
  transform-origin: 2px 2px;
  position: absolute;
  background: var(--sg-color);
  transform: rotate(var(--r, 0deg));
}

.skater-game .sg-arm::before { --l: 8px; }
.skater-game .sg-arm.front { --r: var(--arm-front); }
.skater-game .sg-arm.front::before { --r: var(--arm-front-end); }
.skater-game .sg-arm.back { --r: var(--arm-back); }
.skater-game .sg-arm.back::before { --r: var(--arm-back-end); }

.skater-game .sg-leg { --w: 11px; --t: 11px; }
.skater-game .sg-leg::before { --t: 0; --l: 8px; }
.skater-game .sg-leg.front { --r: var(--leg-front); }
.skater-game .sg-leg.front::before { --r: var(--leg-front-end); }
.skater-game .sg-leg.back { --l: 1px; --r: var(--leg-back); }
.skater-game .sg-leg.back::before { --r: var(--leg-back-end); }

/* Board */
.skater-game .sg-board {
  position: absolute;
  left: 2px;
  bottom: -1px;
  transform: translateX(var(--board-x)) rotate(var(--board-r)) translateZ(0);
  transform-origin: 7px 5.5px;
}
.skater-game .sg-board svg {
  display: block;
  width: 34px;
  height: 8px;
  fill: var(--sg-color);
}

/* Speed lines */
.skater-game .sg-line {
  height: 3px;
  border-radius: 1px;
  overflow: hidden;
  position: absolute;
  right: 105%;
  top: 18px;
  width: 16px;
  transform: scaleY(0.75);
}
.skater-game .sg-line::before {
  content: '';
  position: absolute;
  left: 0; top: 0; right: 0; bottom: 0;
  border-radius: inherit;
  background: var(--sg-color);
  transform: translateX(var(--x, var(--line-top-x)));
}
.skater-game .sg-line.bottom {
  --x: var(--line-bottom-x);
  width: 13px;
  top: 24px;
}

/* === Obstacles === */
.skater-game .sg-cone {
  width: 0; height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 25px solid #f97316;
}
.skater-game .sg-barrier {
  width: 15px; height: 30px;
  background: repeating-linear-gradient(45deg, #ef4444, #ef4444 4px, #fbbf24 4px, #fbbf24 8px);
  border-radius: 2px;
}
.skater-game .sg-text-obs {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  color: var(--destructive, #ef4444);
  font-family: monospace;
}
.skater-game .sg-alert-obs {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  color: #fbbf24;
}

/* === Keyboard === */
.skater-game .sg-keyboard {
  display: grid;
  grid-gap: 8px;
}
.skater-game .sg-key {
  appearance: none;
  height: 36px;
  width: 40px;
  border-radius: 7px;
  background: var(--muted, #2c2c31);
  border: none;
  outline: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
  transform: scale(1);
}
.skater-game .sg-key:hover {
  background: var(--accent, #3a3a42);
  box-shadow: 0 0 0 1px var(--border, #555);
}
.skater-game .sg-key:hover svg {
  fill: var(--foreground, #fff);
}
.skater-game .sg-key svg {
  display: block;
  width: 8px;
  height: 8px;
  fill: var(--muted-foreground, #7f7f85);
  transition: fill 0.12s ease;
}

/* Pressed state (keyboard or touch) */
.skater-game .sg-key.pressed {
  transform: scale(1.2);
  background: var(--primary, #14b8a6);
  box-shadow: 0 0 12px rgba(20, 184, 166, 0.4);
}
.skater-game .sg-key.pressed svg {
  fill: #fff;
}

.skater-game .sg-key.up { grid-row: 1; grid-column: 2; }
.skater-game .sg-key.left { grid-row: 2; grid-column: 1; }
.skater-game .sg-key.right { grid-row: 2; grid-column: 3; }
.skater-game .sg-key.down { grid-row: 2; grid-column: 2; }
`;
