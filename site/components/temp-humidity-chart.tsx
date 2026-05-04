"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Reading = {
  capturedAtMs: number; // epoch ms (server-prepared so server/client agree)
  airTempC: number | null;
  airHumidityPct: number | null;
};

type Props = {
  readings: Reading[]; // expected oldest → newest
};

const TICK_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  month: "short",
  day: "numeric",
});

const TOOLTIP_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function TempHumidityChart({ readings }: Props) {
  // ResponsiveContainer measures DOM, which doesn't exist during SSR. Gate
  // until after mount so the server renders a sized placeholder and the
  // client takes over without the "width(-1) height(-1)" warning.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (readings.length < 2) return null;

  const points = readings
    .filter((r) => r.airTempC != null || r.airHumidityPct != null)
    .map((r) => ({
      ts: r.capturedAtMs,
      temp: r.airTempC,
      humidity: r.airHumidityPct,
    }));

  if (points.length < 2) return null;

  const TEMP_COLOR = "#8aaf8a"; // matches --color-leaf
  const HUMID_COLOR = "#94a3b8"; // slate-400
  const GRID_COLOR = "#334155"; // slate-700
  const AXIS_COLOR = "#64748b"; // slate-500

  return (
    <section className="mt-12 border-t border-slate-700">
      <div className="mx-auto max-w-[68ch] px-6 pt-10 pb-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          Air · Last 14 Days
        </p>
      </div>
      <div className="mx-auto max-w-[68ch] px-6 pb-2">
        <div className="h-[200px] w-full sm:h-[240px]">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} strokeDasharray="2 4" vertical={false} />
                <XAxis
                  dataKey="ts"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v: number) => TICK_FMT.format(new Date(v))}
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                />
                <YAxis
                  yAxisId="temp"
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v: number) => `${v}°`}
                />
                <YAxis
                  yAxisId="humid"
                  orientation="right"
                  stroke={AXIS_COLOR}
                  tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b", // slate-800
                    border: "1px solid #334155", // slate-700
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "#e2e8f0", // slate-200
                  }}
                  labelStyle={{ color: "#94a3b8" /* slate-400 */ }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelFormatter={(v) => TOOLTIP_FMT.format(new Date(Number(v)))}
                  formatter={(value, name) => {
                    const n = typeof value === "number" ? value : Number(value);
                    if (Number.isNaN(n)) return ["—", String(name)];
                    return name === "Temp"
                      ? [`${n.toFixed(1)}°C`, "Temp"]
                      : [`${Math.round(n)}%`, "Humidity"];
                  }}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temp"
                  name="Temp"
                  stroke={TEMP_COLOR}
                  strokeWidth={1.75}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="humid"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity"
                  stroke={HUMID_COLOR}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-500">
          <span className="mr-3">
            <span
              className="inline-block h-[2px] w-3 align-middle"
              style={{ background: TEMP_COLOR }}
            />{" "}
            Temp °C
          </span>
          <span>
            <span
              className="inline-block h-[2px] w-3 align-middle"
              style={{ background: HUMID_COLOR }}
            />{" "}
            Humidity %
          </span>
        </p>
      </div>
    </section>
  );
}
