import { useEffect, useMemo, useRef, useState } from "react";

type ParameterName =
  | "LIFE"
  | "ORGANIC"
  | "MEMORY"
  | "GHOST"
  | "TIME"
  | "NIGHT"
  | "TEXTURE"
  | "DECAY"
  | "HUMAN"
  | "SPACE"
  | "TIME DEPTH"
  | "FRAGMENT"
  | "MOTION"
  | "SILENCE"
  | "RETURN";

type Control = {
  label: ParameterName;
  value: number;
};

type Mode = "NORMAL" | "FOCUS" | "TRACE" | "MAP";

const initialControls: Control[] = [
  { label: "LIFE", value: 62 },
  { label: "ORGANIC", value: 74 },
  { label: "MEMORY", value: 38 },
  { label: "GHOST", value: 56 },
  { label: "TIME", value: 54 },
  { label: "NIGHT", value: 40 },
  { label: "TEXTURE", value: 25 },
  { label: "DECAY", value: 20 },
  { label: "HUMAN", value: 18 },
  { label: "SPACE", value: 35 },
  { label: "TIME DEPTH", value: 48 },
  { label: "FRAGMENT", value: 35 },
  { label: "MOTION", value: 46 },
  { label: "SILENCE", value: 12 },
  { label: "RETURN", value: 32 },
];

const parameterMeta: Record<
  ParameterName,
  { description: string; system: string; response: string; related: ParameterName[] }
> = {
  LIFE: {
    description: "density of active events",
    system: "PARTICLE DENSITY",
    response: "ACTIVITY FIELD",
    related: ["ORGANIC", "MOTION", "SILENCE"],
  },
  ORGANIC: {
    description: "trajectory irregularity",
    system: "PATH VARIANCE",
    response: "ORBIT DEFORMATION",
    related: ["LIFE", "HUMAN", "TEXTURE"],
  },
  MEMORY: {
    description: "persistence of the past",
    system: "HISTORY",
    response: "TRAILS",
    related: ["DECAY", "GHOST", "RETURN"],
  },
  GHOST: {
    description: "delayed secondary activity",
    system: "DELAY FIELD",
    response: "ECHO PARTICLES",
    related: ["MEMORY", "DECAY", "TIME DEPTH"],
  },
  TIME: {
    description: "global temporal speed",
    system: "CLOCK RATE",
    response: "EVENT FREQUENCY",
    related: ["TIME DEPTH", "MOTION", "HUMAN"],
  },
  NIGHT: {
    description: "high-frequency reduction",
    system: "SPECTRAL SHADE",
    response: "QUIET DETAIL",
    related: ["TEXTURE", "SILENCE", "LIFE"],
  },
  TEXTURE: {
    description: "particle grain and micro detail",
    system: "GRAIN FIELD",
    response: "FINE DUST",
    related: ["ORGANIC", "NIGHT", "FRAGMENT"],
  },
  DECAY: {
    description: "event and trail lifetime",
    system: "PERSISTENCE",
    response: "TRAIL LENGTH",
    related: ["MEMORY", "GHOST", "RETURN"],
  },
  HUMAN: {
    description: "performed timing variation",
    system: "TIMING DRIFT",
    response: "IMPERFECT PULSES",
    related: ["ORGANIC", "TIME", "SILENCE"],
  },
  SPACE: {
    description: "spatial distribution radius",
    system: "ORBITAL RADIUS",
    response: "FIELD SCALE",
    related: ["TIME DEPTH", "MOTION", "RETURN"],
  },
  "TIME DEPTH": {
    description: "separation of temporal layers",
    system: "DEPTH PLANES",
    response: "FOREGROUND / BACKGROUND",
    related: ["TIME", "MEMORY", "SPACE"],
  },
  FRAGMENT: {
    description: "distribution of discrete events",
    system: "EVENT DISTRIBUTION",
    response: "PARTICLE CLUSTERS",
    related: ["TEXTURE", "SILENCE", "DECAY"],
  },
  MOTION: {
    description: "movement amplitude",
    system: "VELOCITY",
    response: "ORBIT MOVEMENT",
    related: ["TIME", "SPACE", "LIFE"],
  },
  SILENCE: {
    description: "negative-space intervals",
    system: "ACTIVITY GATES",
    response: "DEAD ZONES",
    related: ["LIFE", "FRAGMENT", "HUMAN"],
  },
  RETURN: {
    description: "attraction to previous states",
    system: "STATE RECALL",
    response: "RETURN TRAJECTORY",
    related: ["MEMORY", "DECAY", "SPACE"],
  },
};

function seeded(index: number) {
  const value = Math.sin(index * 91.227 + 14.87) * 43758.5453;
  return value - Math.floor(value);
}

function Waveform({ seed = 0, compact = false }: { seed?: number; compact?: boolean }) {
  const points = useMemo(() => {
    const total = compact ? 45 : 70;
    return Array.from({ length: total }, (_, i) => {
      const x = (i / (total - 1)) * 100;
      const envelope = Math.sin((i / (total - 1)) * Math.PI);
      const noise = seeded(i + seed * 71);
      const y = 12 - (noise - 0.48) * 13 * envelope;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");
  }, [seed, compact]);
  return (
    <svg
      className={compact ? "waveform compact" : "waveform"}
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
    >
      <line x1="0" y1="12" x2="100" y2="12" />
      <polyline points={points} />
    </svg>
  );
}

function Meter({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="meter">
      <span>{label}</span>
      <div className="meter-track">
        <i className={accent ? "accent" : ""} style={{ width: `${value}%` }} />
      </div>
      <b>{value}%</b>
    </div>
  );
}

function ActivityMonitor({
  label,
  value,
  active,
}: {
  label: ParameterName;
  value: number;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    let width = 0;
    let height = 0;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const strokeSignal = (
      time: number,
      layer = 0,
      alpha = 0.7,
      offset = 0,
      forcedLabel = label,
    ) => {
      const amount = value / 100;
      const samples = 100;
      const center = height * 0.5 + offset;
      context.beginPath();
      for (let i = 0; i <= samples; i += 1) {
        const x = (i / samples) * width;
        const p = i / samples;
        const phase = p * Math.PI * 2;
        const clock = time * 0.001;
        let signal = 0;
        let visible = true;
        switch (forcedLabel) {
          case "LIFE": {
            const rate = 2 + amount * 12;
            const pulse = Math.max(0, Math.sin(phase * rate - clock * 2.1));
            signal = Math.pow(pulse, 8 - amount * 5) * (0.2 + amount * 0.8);
            visible = Math.sin(phase * rate * 0.5 - clock) > 0.3 - amount;
            break;
          }
          case "ORGANIC":
            signal =
              Math.sin(phase * 2.2 + clock) * (1 - amount * 0.55) +
              Math.sin(phase * 5.7 + clock * 1.37) * amount * 0.55 +
              Math.sin(phase * 13.1 - clock * 2.1) * amount * 0.2;
            break;
          case "MEMORY":
            signal = Math.sin(phase * 3 + clock - layer * 0.42) * (0.68 - layer * 0.05);
            break;
          case "GHOST":
            signal = Math.sin(phase * 3.6 + clock - layer * (0.5 + amount));
            break;
          case "TIME":
            signal = Math.sin(phase * (1.4 + amount * 8) + clock * (0.5 + amount * 2));
            break;
          case "NIGHT":
            signal =
              Math.sin(phase * (6 - amount * 4.5) + clock) * 0.68 +
              Math.sin(phase * 18 + clock * 3) * (1 - amount) * 0.22;
            break;
          case "TEXTURE":
            signal =
              Math.sin(phase * 2.5 + clock) * 0.52 +
              Math.sin(phase * (8 + amount * 27) - clock * 1.7) * amount * 0.35 +
              (seeded(i + Math.floor(clock * 5)) - 0.5) * amount * 0.65;
            break;
          case "DECAY": {
            const event = (p * (3 + Math.round(amount * 3)) + clock * 0.25) % 1;
            signal = event < 0.08 ? event / 0.08 : Math.exp(-(event - 0.08) * (13 - amount * 11));
            break;
          }
          case "HUMAN": {
            const jitter = Math.sin(i * 0.73 + clock) * amount * 0.6;
            signal =
              Math.sin(phase * 4 + clock + jitter) * (0.7 + Math.sin(i * 0.17) * amount * 0.25);
            visible = Math.sin(phase * 2 + clock + jitter) > -0.9 + amount * 0.25;
            break;
          }
          case "SPACE":
            signal =
              Math.sin(phase * 3 + clock) *
              (0.18 + Math.abs(p - 0.5) * 2 * amount * 0.9) *
              (layer ? -1 : 1);
            break;
          case "TIME DEPTH":
            signal = Math.sin(phase * 3 + clock - layer * (0.12 + amount * 0.55)) * 0.7;
            break;
          case "FRAGMENT": {
            const fragments = 1 + Math.round(amount * 10);
            const local = (p * fragments + clock * 0.08) % 1;
            visible = local < Math.max(0.22, 0.88 - amount * 0.62);
            signal = Math.sin(phase * 3.2 + clock) * 0.72;
            break;
          }
          case "MOTION":
            signal = Math.sin(phase * 3.3 + clock) * (0.08 + amount * 0.92);
            break;
          case "SILENCE": {
            const gates = 2 + Math.round(amount * 5);
            const local = (p * gates + clock * 0.05) % 1;
            visible = local < Math.max(0.14, 0.96 - amount * 0.75);
            signal = Math.sin(phase * 7 + clock) * 0.58;
            break;
          }
          case "RETURN":
            signal = Math.sin(phase * 2.7 + clock - layer * 0.7) * (layer ? 0.52 : 0.75);
            break;
        }
        const y = center - signal * height * 0.38;
        if (!visible) {
          context.moveTo(x, center);
        } else if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.strokeStyle = active ? `rgba(235, 48, 36, ${alpha})` : `rgba(28, 29, 29, ${alpha})`;
      context.lineWidth = layer === 0 ? 1 : 0.7;
      context.stroke();
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      if (label !== "FRAGMENT" && label !== "SILENCE") {
        context.strokeStyle = "rgba(25,26,26,.11)";
        context.lineWidth = 0.5;
        context.beginPath();
        context.moveTo(0, height / 2);
        context.lineTo(width, height / 2);
        context.stroke();
      }

      if (label === "MEMORY") {
        const layers = 1 + Math.floor(value / 22);
        for (let layer = layers; layer > 0; layer -= 1) {
          strokeSignal(time, layer, 0.08 + (layers - layer) * 0.045);
        }
      } else if (label === "GHOST") {
        strokeSignal(time, 1, 0.16 + value * 0.004);
      } else if (label === "TIME DEPTH") {
        const layers = 2 + Math.floor(value / 28);
        for (let layer = layers; layer > 0; layer -= 1) {
          strokeSignal(time, layer, 0.08 + layer * 0.025, (layer - layers / 2) * 1.1);
        }
      } else if (label === "SPACE") {
        strokeSignal(time, 1, 0.24, value * 0.035);
      } else if (label === "RETURN") {
        strokeSignal(time, 1, 0.12 + value * 0.004);
        const amount = value / 100;
        const clock = time * 0.001;
        context.beginPath();
        for (let i = 1; i < 7; i += 1) {
          const x = (i / 7) * width;
          const phase = (i / 7) * Math.PI * 2;
          const currentY = height * 0.5 - Math.sin(phase * 2.7 + clock) * height * 0.285;
          const previousY = height * 0.5 - Math.sin(phase * 2.7 + clock - 0.7) * height * 0.198;
          context.moveTo(x, previousY);
          context.quadraticCurveTo(x + 3, (currentY + previousY) / 2, x, currentY);
        }
        context.strokeStyle = active
          ? `rgba(235,48,36,${0.08 + amount * 0.28})`
          : `rgba(28,29,29,${0.05 + amount * 0.18})`;
        context.lineWidth = 0.6;
        context.stroke();
      }
      strokeSignal(time, 0, active ? 0.9 : 0.62);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [label, value, active]);

  return (
    <div className={`activity-monitor ${active ? "active" : ""}`}>
      <canvas ref={canvasRef} aria-label={`${label} real-time parameter activity`} />
      <span>ACTIVITY</span>
    </div>
  );
}

function DustField({
  values,
  active,
  mode,
}: {
  values: Record<ParameterName, number>;
  active: ParameterName;
  mode: Mode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let animation = 0;
    let width = 0;
    let height = 0;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const cx = width * 0.5;
      const cy = height * 0.52;
      const unit = Math.min(width / 920, height / 440);
      const life = values.LIFE / 100;
      const organic = values.ORGANIC / 100;
      const memory = values.MEMORY / 100;
      const ghost = values.GHOST / 100;
      const speed = 0.000004 + values.TIME * 0.00000022;
      const night = values.NIGHT / 100;
      const texture = values.TEXTURE / 100;
      const decay = values.DECAY / 100;
      const human = values.HUMAN / 100;
      const space = 0.72 + values.SPACE * 0.0062;
      const timeDepth = values["TIME DEPTH"] / 100;
      const fragment = values.FRAGMENT / 100;
      const motion = values.MOTION / 100;
      const silence = values.SILENCE / 100;
      const returning = values.RETURN / 100;
      const pulse =
        Math.sin(time * speed * (1.2 + human * Math.sin(time * 0.0007))) * (0.007 + motion * 0.027);
      const focus = mode === "FOCUS";
      const trace = mode === "TRACE";

      context.save();
      context.translate(cx, cy);

      // Orbital system responds directly to SPACE, MOTION and TIME.
      for (let i = 0; i < 12; i += 1) {
        context.save();
        const orbitMotion = Math.sin(time * speed * ((i % 3) + 1) + i) * motion * 0.06;
        context.rotate(-0.42 + i * 0.069 + orbitMotion);
        context.scale(1, 0.38 + i * 0.017);
        context.beginPath();
        context.ellipse(
          0,
          0,
          (250 + i * 15) * unit * space,
          (250 + i * 15) * unit * space,
          0,
          0,
          Math.PI * 2,
        );
        const emphasis = active === "SPACE" || active === "MOTION" || active === "TIME";
        context.strokeStyle = `rgba(${emphasis ? "55,48,47" : "26,28,28"}, ${
          (trace ? 0.29 : 0.17) * (focus && !emphasis ? 0.25 : 1)
        })`;
        context.lineWidth = 0.55 / Math.max(unit, 0.6);
        context.stroke();
        context.restore();
      }

      context.strokeStyle = "rgba(38,39,39,.12)";
      context.lineWidth = 0.7;
      context.beginPath();
      context.moveTo(-width * 0.48, 0);
      context.lineTo(width * 0.48, 0);
      context.moveTo(0, -height * 0.47);
      context.lineTo(0, height * 0.47);
      context.stroke();

      // Layered membrane deforms with ORGANIC, FRAGMENT, MOTION and RETURN.
      context.globalCompositeOperation = "multiply";
      const membraneLayers = 11 + Math.round(timeDepth * 8);
      for (let layer = 0; layer < membraneLayers; layer += 1) {
        const points = 150;
        const phase = layer * 0.46 + time * speed * (0.7 + layer * 0.015);
        context.beginPath();
        for (let j = 0; j <= points; j += 1) {
          const a = (j / points) * Math.PI * 2;
          const fragmented = Math.sin(a * (4 + Math.round(fragment * 8)) + phase) * fragment * 18;
          const lobe =
            Math.sin(a * 3 + phase) * (17 + organic * 18) +
            Math.sin(a * 5 - phase * 1.3) * (8 + organic * 12) +
            Math.cos(a * 2 + phase * 0.4) * 15 +
            fragmented;
          const rememberedRadius = 174 + Math.sin(a * 3 + layer * 0.46) * 22;
          const liveRadius = 174 + lobe + layer * (3.8 + timeDepth * 2.1);
          const radius =
            (liveRadius * (1 - returning * 0.28) + rememberedRadius * returning * 0.28) *
            unit *
            space *
            (1 + pulse);
          const x = Math.cos(a) * radius * (1.27 + Math.sin(a + phase) * organic * 0.1);
          const y = Math.sin(a) * radius * (0.64 + Math.cos(a * 2 - phase) * organic * 0.08);
          if (j === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.closePath();
        const activeMembrane = ["ORGANIC", "FRAGMENT", "MOTION", "RETURN", "TIME DEPTH"].includes(
          active,
        );
        context.strokeStyle = `rgba(${activeMembrane ? "88,83,82" : "98,101,104"}, ${
          (0.075 - layer * 0.002) * (focus && !activeMembrane ? 0.25 : 1)
        })`;
        context.lineWidth = 0.9 + (layer % 3) * 0.4;
        context.shadowColor = "rgba(255,255,255,.7)";
        context.shadowBlur = 3 + layer * 0.25;
        context.stroke();
      }
      context.globalCompositeOperation = "source-over";

      const mass = context.createRadialGradient(8, -4, 8, 0, 0, 145 * unit * space);
      mass.addColorStop(0, `rgba(255,54,41,${0.68 + life * 0.25})`);
      mass.addColorStop(0.08, `rgba(30,28,28,${0.72 - night * 0.12})`);
      mass.addColorStop(0.42, `rgba(44,45,45,${0.4 + memory * 0.12})`);
      mass.addColorStop(1, "rgba(110,112,112,0)");
      context.fillStyle = mass;
      context.beginPath();
      context.ellipse(0, 0, 150 * unit * space, 108 * unit * space, 0.2, 0, Math.PI * 2);
      context.fill();

      const particleCount = 320 + Math.round(life * 900);
      for (let i = 0; i < particleCount; i += 1) {
        const baseAngle = seeded(i) * Math.PI * 2;
        const irregular =
          Math.sin(time * speed * (1 + (i % 5)) + i * 0.17) *
          organic *
          (0.08 + seeded(i + 3) * 0.2);
        const timingDrift = Math.sin(time * 0.00011 + i * 1.7) * human * 0.06;
        const angle = baseAngle + time * speed * (i % 5) + irregular + timingDrift;
        const cluster = Math.round((baseAngle / (Math.PI * 2)) * (3 + fragment * 12));
        const fragmentGap = seeded(cluster + 900) < fragment * 0.48;
        const silenceGate =
          seeded(i + 77) < silence * 0.72 &&
          Math.sin(time * speed * 3 + cluster * 1.9) > 0.08 - silence;
        if (fragmentGap || silenceGate) continue;

        const baseRadial = Math.pow(seeded(i + 933), 1.85) * 340 * unit * space;
        const fragmentationOffset = (seeded(cluster + 71) - 0.5) * fragment * 75 * unit;
        const radial = Math.max(4, baseRadial + fragmentationOffset);
        const depth = seeded(i + 144);
        const flatten = 0.5 + seeded(i + 122) * (0.18 + timeDepth * 0.16);
        const movement = Math.sin(time * speed * 5 + i) * motion * 18 * unit;
        const liveX = Math.cos(angle) * (radial + movement) * (1 + seeded(i + 41) * 0.42);
        const liveY = Math.sin(angle) * (radial + movement * 0.5) * flatten;
        const restX = Math.cos(baseAngle) * radial * (1 + seeded(i + 41) * 0.42);
        const restY = Math.sin(baseAngle) * radial * flatten;
        const x = liveX * (1 - returning * 0.22) + restX * returning * 0.22;
        const y = liveY * (1 - returning * 0.22) + restY * returning * 0.22;
        const size =
          (0.3 + seeded(i + 202) * (radial < 120 * unit ? 1.8 : 1.05) + texture * seeded(i + 16)) *
          (0.65 + depth * timeDepth * 0.9);
        const highlighted = i % Math.max(9, Math.round(36 - values[active] * 0.22)) === 0;
        const red = i % 37 === 0 || (highlighted && focus);
        const alpha =
          (0.14 + seeded(i + 62) * 0.72) *
          (1 - night * 0.42) *
          (focus && !highlighted ? 0.2 : 1) *
          (0.7 + depth * timeDepth * 0.5);

        // MEMORY and DECAY produce literal retained trails.
        if ((memory > 0.08 || trace) && i % 4 === 0) {
          const previousAngle = angle - (0.012 + decay * 0.19 + memory * 0.08);
          const px = Math.cos(previousAngle) * radial * (1 + seeded(i + 41) * 0.42);
          const py = Math.sin(previousAngle) * radial * flatten;
          context.strokeStyle = `rgba(36,37,37,${(0.025 + memory * 0.15) * (trace ? 1.8 : 1)})`;
          context.lineWidth = Math.max(0.35, size * 0.55);
          context.beginPath();
          context.moveTo(px, py);
          context.lineTo(x, y);
          context.stroke();
        }

        context.fillStyle = red
          ? `rgba(247,48,32,${Math.max(0.35, alpha)})`
          : `rgba(19,20,20,${alpha})`;
        context.beginPath();
        context.arc(x, y, size, 0, Math.PI * 2);
        context.fill();

        // GHOST is a delayed faded copy, not extra random noise.
        if (ghost > 0.05 && i % 5 === 0) {
          const ghostAngle = angle - (0.08 + ghost * 0.42);
          const gx = Math.cos(ghostAngle) * radial * (1 + seeded(i + 41) * 0.42);
          const gy = Math.sin(ghostAngle) * radial * flatten;
          context.fillStyle = `rgba(72,74,74,${ghost * 0.18 * (trace ? 1.8 : 1)})`;
          context.beginPath();
          context.arc(gx, gy, size * (0.65 + ghost * 0.35), 0, Math.PI * 2);
          context.fill();
        }
      }

      const spheres = [
        [-365, -130, 13],
        [-310, -74, 8],
        [-290, 88, 9],
        [-398, 128, 14],
        [-270, 150, 6],
        [294, -84, 9],
        [372, -151, 8],
        [418, 132, 15],
        [304, 135, 9],
        [405, -117, 8],
      ];
      spheres.forEach(([sx, sy, sr], index) => {
        const orbit = time * speed * (0.3 + (index % 3) * 0.2) * motion;
        const x = (sx * Math.cos(orbit) - sy * Math.sin(orbit) * 0.18) * unit * space;
        const y = (sy * Math.cos(orbit) + sx * Math.sin(orbit) * 0.12) * unit * space;
        const radius = sr * unit * (0.8 + timeDepth * seeded(index + 11) * 0.5);
        const gradient = context.createRadialGradient(
          x - radius * 0.45,
          y - radius * 0.5,
          radius * 0.08,
          x,
          y,
          radius,
        );
        gradient.addColorStop(0, "rgba(255,255,255,.95)");
        gradient.addColorStop(0.18, index % 3 ? "#767878" : "#353636");
        gradient.addColorStop(0.72, "#161717");
        gradient.addColorStop(1, "rgba(3,3,3,.2)");
        context.shadowColor = "rgba(20,20,20,.28)";
        context.shadowBlur = 7;
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
      animation = requestAnimationFrame(draw);
    };
    animation = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animation);
      observer.disconnect();
    };
  }, [values, active, mode]);

  return <canvas className="dust-field" ref={canvasRef} aria-hidden="true" />;
}

function Knob({
  control,
  onChange,
  onActivate,
  active,
}: {
  control: Control;
  onChange: (value: number) => void;
  onActivate: () => void;
  active: boolean;
}) {
  const drag = useRef<{ y: number; value: number } | null>(null);
  const angle = -135 + control.value * 2.7;

  const change = (value: number) => onChange(Math.max(0, Math.min(100, Math.round(value))));
  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    onActivate();
    drag.current = { y: event.clientY, value: control.value };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    change(drag.current.value + (drag.current.y - event.clientY) * 0.55);
  };
  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      onActivate();
      change(control.value + (event.shiftKey ? 10 : 1));
    }
    if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      onActivate();
      change(control.value - (event.shiftKey ? 10 : 1));
    }
  };

  return (
    <div className={`knob-cell ${active ? "active" : ""}`}>
      <label>{control.label}</label>
      <div className="knob-row">
        <div
          className="knob-shell"
          role="slider"
          tabIndex={0}
          aria-label={control.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={control.value}
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={keyDown}
          onFocus={onActivate}
        >
          <div className="encoder-shadow" />
          <div className="knob-ticks" />
          <div className="encoder-ring">
            <div className="knob" style={{ "--angle": `${angle}deg` } as React.CSSProperties}>
              <i className="position-indicator" />
              <span className="mechanical-center">
                <i />
              </span>
            </div>
          </div>
        </div>
        <span className="knob-side-value">{control.value}%</span>
      </div>
      <strong>{control.value}%</strong>
      <ActivityMonitor label={control.label} value={control.value} active={active} />
    </div>
  );
}

function PillButton({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button className={`pill ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default function App() {
  const [controls, setControls] = useState(initialControls);
  const [active, setActive] = useState<ParameterName>("MEMORY");
  const [mode, setMode] = useState<Mode>("NORMAL");
  const [bloom, setBloom] = useState(true);
  const [freeze, setFreeze] = useState(false);
  const [preset, setPreset] = useState(1);
  const values = useMemo(
    () =>
      Object.fromEntries(controls.map((control) => [control.label, control.value])) as Record<
        ParameterName,
        number
      >,
    [controls],
  );
  const activeMeta = parameterMeta[active];

  const updateControl = (index: number, value: number) => {
    setControls((current) =>
      current.map((control, controlIndex) =>
        controlIndex === index ? { ...control, value } : control,
      ),
    );
  };

  const randomize = () => {
    setControls((current) =>
      current.map((control) => ({ ...control, value: Math.round(Math.random() * 100) })),
    );
  };

  return (
    <main className="instrument">
      <header className="topbar">
        <div className="brand">
          <h1>LIVING DUST</h1>
          <span className="brand-line" />
          <i />
          <b>+</b>
        </div>
        <nav className="preset-bar" aria-label="Preset controls">
          <PillButton>Presets⌄</PillButton>
          <PillButton>Save preset</PillButton>
          <label className="preset-select">
            <span>{preset}</span>
            <select value={preset} onChange={(event) => setPreset(Number(event.target.value))}>
              {[1, 2, 3, 4].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <PillButton>Snap save</PillButton>
          <PillButton>Recall</PillButton>
          <PillButton onClick={randomize}>RANDOMIZE</PillButton>
        </nav>
        <div className="experimental">
          <i /> EXPERIMENTAL
        </div>
      </header>

      <section className="hero-grid">
        <aside className="side-panel organism-panel">
          <h2>
            <i className="red-dot" /> ORGANISM
          </h2>
          <div className="primary-meters">
            {controls.slice(0, 3).map((control) => (
              <Meter
                key={control.label}
                label={control.label}
                value={control.value}
                accent={control.label === active}
              />
            ))}
          </div>
          <h2>
            <i className="black-dot" /> SYSTEMS
          </h2>
          <div className="system-meters">
            {controls.slice(3, 12).map((control) => (
              <Meter
                key={control.label}
                label={control.label}
                value={control.value}
                accent={control.label === active}
              />
            ))}
          </div>
          <Waveform seed={values.LIFE + values.ORGANIC} />
        </aside>

        <section
          className={`visualizer mode-${mode.toLowerCase()}`}
          aria-label="Living Dust particle system"
        >
          <DustField values={values} active={active} mode={mode} />
          <div className="active-readout">
            <i />
            <span>{active}</span>
            <b>{values[active]}%</b>
          </div>
          {mode === "MAP" && (
            <div className="map-overlay">
              <span>{active}</span>
              <i>↓</i>
              <span>{activeMeta.system}</span>
              <i>↓</i>
              <strong>{activeMeta.response}</strong>
            </div>
          )}
          {mode === "TRACE" && (
            <div className="trace-label">
              HISTORY DEPTH <b>{Math.round((values.MEMORY + values.DECAY) / 2)}%</b>
            </div>
          )}
          <div className="view-switcher">
            {(["NORMAL", "FOCUS", "TRACE", "MAP"] as Mode[]).map((item) => (
              <button
                key={item}
                className={mode === item ? "selected" : ""}
                onClick={() => setMode(item)}
              >
                {item === "NORMAL" && <i />} {item}
              </button>
            ))}
          </div>
        </section>

        <aside className="side-panel context-panel">
          <h2>
            <i className="red-dot" /> ACTIVE CONTEXT
          </h2>
          <h3>{active}</h3>
          <p>{activeMeta.description}</p>
          <div className="context-memory">
            <Meter label={active} value={values[active]} accent />
          </div>
          <div className="related">
            <h4>RELATED CONTROLS</h4>
            {activeMeta.related.map((label) => (
              <Meter key={label} label={label} value={values[label]} />
            ))}
          </div>
          <div className="links">
            <h4>ACTIVE LINKS</h4>
            <div className="dynamic-link-map">
              <span>{active}</span>
              <i className="node red" />
              <i className="link-line" />
              <i className="node center" />
              <div>
                <b>{activeMeta.system}</b>
                <small>{activeMeta.response}</small>
              </div>
            </div>
          </div>
          <ActivityMonitor label={active} value={values[active]} active />
        </aside>
      </section>

      <section className="control-bank" aria-label="Primary parameters">
        {controls.map((control, index) => (
          <Knob
            key={control.label}
            control={control}
            active={active === control.label}
            onActivate={() => setActive(control.label)}
            onChange={(value) => updateControl(index, value)}
          />
        ))}
      </section>

      <section className="utility-bar">
        <div className="transport">
          <PillButton active={bloom} onClick={() => setBloom((current) => !current)}>
            <i className="status-dot" /> BLOOM
          </PillButton>
          <PillButton active={freeze} onClick={() => setFreeze((current) => !current)}>
            <i className="status-dot muted" /> FREEZE
          </PillButton>
        </div>
        <div className="utility-section sync">
          <span>Host tempo</span>
          <i className="status-dot" />
          <span>Reset on play</span>
          <i className="status-dot" />
        </div>
        <div className="utility-section audio">
          <label>Output</label>
          <input type="range" defaultValue="72" aria-label="Output level" />
          <b>0.0 dB</b>
        </div>
        <div className="utility-section audio">
          <label>Input</label>
          <input type="range" defaultValue="65" aria-label="Input level" />
          <b>0.0 dB</b>
        </div>
        <div className="utility-section tempo">
          <label>Tempo</label>
          <input type="range" defaultValue="58" aria-label="Tempo" />
          <b>90 bpm</b>
        </div>
      </section>

      <footer className="footer-bar">
        <svg viewBox="0 0 55 30" aria-hidden="true">
          <path d="M2 16h5l3-10 5 20 5-17 5 13 5-19 5 24 5-14 5 5h8" />
        </svg>
        <p>HUMAN: load a file or capture knocks / objects / voice, then raise HUMAN</p>
        <p>
          MIDI: Bloom note / CC, Freeze CC (Experimental = MIDI), Sidechain input = HUMAN capture.
        </p>
        <button aria-label="Expand interface">↗</button>
      </footer>
    </main>
  );
}
