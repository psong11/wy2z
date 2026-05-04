// Simplified architecture / data-flow diagram. Four phases of the
// capture loop, each rendered as a small card with the devices or
// services that participate. CSS grid; horizontal on desktop with
// connector chevrons between cards, vertical stack on mobile.

type Phase = {
  step: string;
  title: string;
  body: string;
};

// The four-step temporal flow, surfaced as a single tight ordered list rather
// than four cards — the system map above conveys the topology, this just
// names the phases in time order so the section reads well end-to-end.
const PHASES: Phase[] = [
  {
    step: "01",
    title: "Capture",
    body: "Cron fires. The Pi reads the air sensor, paints the OLED with the timestamp, and asks the Jetson for one sharp photo.",
  },
  {
    step: "02",
    title: "Upload",
    body: "The photo and the air reading land in Supabase — JPEG into Storage, a row into Postgres.",
  },
  {
    step: "03",
    title: "Analyze",
    body: "Claude reads the photo against a structured prompt and returns a JSON verdict — health color, soil-moisture guess, and an action per plant.",
  },
  {
    step: "04",
    title: "Dispense",
    body: "If a plant is flagged for water, the Pi pings the ESP32 over Wi-Fi. The board switches a 5V pump that pushes Brita water through a vinyl tube into the soil.",
  },
];

// Simplified system map. Vertical flow that scales cleanly to mobile widths
// via SVG viewBox. Three bands: hardware in the room → cloud → this page.
// Arrows convey data flow rather than control flow.
function SystemDiagram() {
  // Color tokens duplicated as hex because SVG attributes can't read CSS
  // custom properties reliably across all browsers without `currentColor`.
  const SLATE_700 = "#334155";
  const SLATE_500 = "#64748b";
  const SLATE_400 = "#94a3b8";
  const SLATE_200 = "#e2e8f0";
  const LEAF = "#8aaf8a";

  // Box helper styles applied as raw attributes inside JSX below.
  return (
    <figure className="mt-6 -mx-2 sm:mx-0">
      <svg
        viewBox="0 0 480 600"
        role="img"
        aria-label="System map: Pi 5 orchestrates DHT11, Jetson camera, and ESP32 pump, which act on the plants. Photos and telemetry flow to Supabase, where Claude returns a verdict, which this page reads."
        className="mx-auto block w-full max-w-[480px]"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={SLATE_500} />
          </marker>
          <marker
            id="arrow-leaf"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={LEAF} />
          </marker>
        </defs>

        {/* === BAND 1 — In the Room ============================================ */}
        <text
          x="12"
          y="14"
          fill={SLATE_500}
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="2"
        >
          IN THE ROOM
        </text>

        {/* Pi 5 — orchestrator */}
        <g>
          <rect
            x="170"
            y="28"
            width="140"
            height="48"
            rx="4"
            fill="none"
            stroke={LEAF}
            strokeWidth="1.5"
          />
          <text
            x="240"
            y="48"
            fill={SLATE_200}
            fontFamily="var(--font-serif)"
            fontSize="14"
            textAnchor="middle"
          >
            Raspberry Pi 5
          </text>
          <text
            x="240"
            y="64"
            fill={SLATE_400}
            fontFamily="var(--font-mono)"
            fontSize="9"
            letterSpacing="1.5"
            textAnchor="middle"
          >
            ORCHESTRATOR
          </text>
        </g>

        {/* Three peripheral nodes: DHT11, Jetson, ESP32 */}
        {/* DHT11 */}
        <g>
          <rect x="20" y="140" width="120" height="48" rx="4" fill="none" stroke={SLATE_700} />
          <text x="80" y="160" fill={SLATE_200} fontFamily="var(--font-serif)" fontSize="13" textAnchor="middle">
            DHT11
          </text>
          <text x="80" y="176" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
            air temp + humidity
          </text>
        </g>
        {/* Jetson */}
        <g>
          <rect x="180" y="140" width="120" height="48" rx="4" fill="none" stroke={SLATE_700} />
          <text x="240" y="160" fill={SLATE_200} fontFamily="var(--font-serif)" fontSize="13" textAnchor="middle">
            Jetson Orin
          </text>
          <text x="240" y="176" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
            16MP camera
          </text>
        </g>
        {/* ESP32 */}
        <g>
          <rect x="340" y="140" width="120" height="48" rx="4" fill="none" stroke={SLATE_700} />
          <text x="400" y="160" fill={SLATE_200} fontFamily="var(--font-serif)" fontSize="13" textAnchor="middle">
            ESP32
          </text>
          <text x="400" y="176" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
            Wi-Fi → 5V pump
          </text>
        </g>

        {/* Pi → peripheral connectors */}
        <line x1="200" y1="78" x2="80" y2="138" stroke={SLATE_500} strokeWidth="1" markerEnd="url(#arrow)" />
        <line x1="240" y1="78" x2="240" y2="138" stroke={SLATE_500} strokeWidth="1" markerEnd="url(#arrow)" />
        <line x1="280" y1="78" x2="400" y2="138" stroke={SLATE_500} strokeWidth="1" markerEnd="url(#arrow)" />

        {/* Connector labels (protocols) */}
        <text x="125" y="106" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
          GPIO
        </text>
        <text x="252" y="106" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9">
          SSH
        </text>
        <text x="355" y="106" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
          HTTP
        </text>

        {/* Plants */}
        <g>
          <rect
            x="120"
            y="232"
            width="240"
            height="48"
            rx="4"
            fill="none"
            stroke={LEAF}
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <text x="240" y="252" fill={SLATE_200} fontFamily="var(--font-serif)" fontSize="14" textAnchor="middle">
            Three Plants
          </text>
          <text x="240" y="268" fill={SLATE_400} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1.5" textAnchor="middle">
            ZINNIA · ZINNIA · WYCHES YELLOW
          </text>
        </g>

        {/* Camera "sees" plants, ESP32 "waters" plants */}
        <line x1="240" y1="190" x2="240" y2="230" stroke={LEAF} strokeWidth="1" markerEnd="url(#arrow-leaf)" />
        <text x="248" y="212" fill={LEAF} fontFamily="var(--font-mono)" fontSize="9">
          sees
        </text>
        <line x1="400" y1="190" x2="320" y2="230" stroke={LEAF} strokeWidth="1" markerEnd="url(#arrow-leaf)" />
        <text x="370" y="212" fill={LEAF} fontFamily="var(--font-mono)" fontSize="9">
          waters
        </text>

        {/* Band divider */}
        <line x1="20" y1="316" x2="460" y2="316" stroke={SLATE_700} strokeWidth="0.5" strokeDasharray="2 4" />

        {/* === BAND 2 — Cloud ================================================== */}
        <text
          x="12"
          y="334"
          fill={SLATE_500}
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="2"
        >
          CLOUD
        </text>

        {/* Photo + readings line from Plants band into Cloud */}
        <line x1="240" y1="280" x2="240" y2="356" stroke={SLATE_500} strokeWidth="1" markerEnd="url(#arrow)" />
        <text x="248" y="304" fill={SLATE_400} fontFamily="var(--font-mono)" fontSize="9">
          photo
        </text>
        <text x="248" y="318" fill={SLATE_400} fontFamily="var(--font-mono)" fontSize="9">
          + readings
        </text>

        {/* Supabase */}
        <g>
          <rect x="60" y="356" width="180" height="48" rx="4" fill="none" stroke={SLATE_700} />
          <text x="150" y="376" fill={SLATE_200} fontFamily="var(--font-serif)" fontSize="13" textAnchor="middle">
            Supabase
          </text>
          <text x="150" y="392" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
            Postgres + storage
          </text>
        </g>
        {/* Claude */}
        <g>
          <rect x="260" y="356" width="160" height="48" rx="4" fill="none" stroke={SLATE_700} />
          <text x="340" y="376" fill={SLATE_200} fontFamily="var(--font-serif)" fontSize="13" textAnchor="middle">
            Claude
          </text>
          <text x="340" y="392" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="9" textAnchor="middle">
            vision verdict
          </text>
        </g>

        {/* Supabase ↔ Claude */}
        <line x1="240" y1="380" x2="260" y2="380" stroke={SLATE_500} strokeWidth="1" />
        <line x1="240" y1="380" x2="260" y2="380" stroke={SLATE_500} strokeWidth="1" markerStart="url(#arrow)" markerEnd="url(#arrow)" />

        {/* Band divider */}
        <line x1="20" y1="436" x2="460" y2="436" stroke={SLATE_700} strokeWidth="0.5" strokeDasharray="2 4" />

        {/* === BAND 3 — You ==================================================== */}
        <text
          x="12"
          y="454"
          fill={SLATE_500}
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="2"
        >
          YOU
        </text>

        {/* Dashboard reads from Supabase */}
        <line x1="150" y1="404" x2="240" y2="476" stroke={SLATE_500} strokeWidth="1" markerEnd="url(#arrow)" />
        <text x="200" y="446" fill={SLATE_400} fontFamily="var(--font-mono)" fontSize="9">
          ISR · 30 min
        </text>

        {/* This dashboard */}
        <g>
          <rect
            x="160"
            y="476"
            width="160"
            height="56"
            rx="4"
            fill="none"
            stroke={LEAF}
            strokeWidth="1.5"
          />
          <text x="240" y="498" fill={SLATE_200} fontFamily="var(--font-serif)" fontSize="14" textAnchor="middle">
            This Dashboard
          </text>
          <text x="240" y="514" fill={SLATE_400} fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1.5" textAnchor="middle">
            NEXT.JS · VERCEL
          </text>
          <text x="240" y="526" fill={SLATE_500} fontFamily="var(--font-mono)" fontSize="8" textAnchor="middle">
            you are here
          </text>
        </g>
      </svg>
      <figcaption className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
        System Map
      </figcaption>
    </figure>
  );
}

export function HowItWorks() {
  return (
    <section className="mt-12 border-t border-slate-700">
      <div className="mx-auto max-w-[68ch] px-6 pt-10 pb-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          How It Works
        </p>
        <SystemDiagram />
        <p className="mt-6 font-serif text-base leading-relaxed text-slate-300">
          One Raspberry Pi orchestrates four moving parts on a 12-hour clock:
          a camera that&rsquo;s a separate computer, a sensor on a GPIO pin,
          a vision model in a datacenter somewhere, and a Wi-Fi microcontroller
          that pushes water on command.
        </p>
      </div>

      <ol className="mx-auto mt-6 max-w-[68ch] divide-y divide-slate-800 px-6 pb-2">
        {PHASES.map((phase) => (
          <li
            key={phase.step}
            className="grid grid-cols-[3rem_1fr] items-baseline gap-x-5 py-4 sm:grid-cols-[4rem_8rem_1fr]"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
              {phase.step}
            </span>
            <span className="col-span-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-leaf)] sm:col-span-1">
              {phase.title}
            </span>
            <p className="col-span-2 mt-1 font-serif text-base leading-relaxed text-slate-200 sm:col-span-1 sm:mt-0">
              {phase.body}
            </p>
          </li>
        ))}
      </ol>

      <p className="mx-auto mt-4 max-w-[68ch] px-6 pb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">
        Cron · 07:30 + 19:30 CT · daily until the owner returns
      </p>
    </section>
  );
}
