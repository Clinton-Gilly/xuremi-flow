"use client";

import { useState } from "react";
import { TelemetryPoint } from "@/types/admin";
import { ActivityIcon, TrendingUpIcon } from "lucide-react";

interface TelemetryChartProps {
  data: TelemetryPoint[];
}

export function TelemetryChart({ data }: TelemetryChartProps) {
  const [range, setRange] = useState<"1h" | "6h" | "24h" | "7d">("24h");

  // Calculate scales
  const maxThroughput = Math.max(...data.map((d) => d.throughputRunsPerMin), 400);
  const maxLatency = Math.max(...data.map((d) => d.p95LatencyMs), 300);

  const chartWidth = 760;
  const chartHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Generate SVG points
  const pointsThroughput = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - (d.throughputRunsPerMin / maxThroughput) * innerHeight;
    return { x, y, raw: d };
  });

  const pointsLatencyP95 = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - (d.p95LatencyMs / maxLatency) * innerHeight;
    return { x, y, raw: d };
  });

  const pointsLatencyP50 = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - (d.p50LatencyMs / maxLatency) * innerHeight;
    return { x, y, raw: d };
  });

  const pathThroughput = pointsThroughput.reduce((acc, curr, i) => {
    return `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.y}`;
  }, "");

  const areaThroughput = `${pathThroughput} L ${pointsThroughput[pointsThroughput.length - 1].x} ${
    chartHeight - paddingY
  } L ${pointsThroughput[0].x} ${chartHeight - paddingY} Z`;

  const pathP95 = pointsLatencyP95.reduce((acc, curr, i) => {
    return `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.y}`;
  }, "");

  const pathP50 = pointsLatencyP50.reduce((acc, curr, i) => {
    return `${acc} ${i === 0 ? "M" : "L"} ${curr.x} ${curr.y}`;
  }, "");

  return (
    <div className="rounded-xl border border-[#1E222B] bg-[#14161B] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1E222B] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-tight text-white">Engine Telemetry & Latency Profiler</h2>
          </div>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Real-time throughput (runs/min) alongside p50 & p95 execution latency across active workers.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[#94A3B8]">Throughput (runs/m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-400" />
              <span className="text-[#94A3B8]">p95 Latency (ms)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-sky-400" />
              <span className="text-[#94A3B8]">p50 Latency (ms)</span>
            </div>
          </div>

          <div className="flex items-center rounded-lg border border-[#1E222B] bg-[#0B0C0E] p-0.5">
            {(["1h", "6h", "24h", "7d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  range === r ? "bg-[#1E222B] text-white" : "text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-56 select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((tick) => {
            const y = chartHeight - paddingY - tick * innerHeight;
            return (
              <line
                key={tick}
                x1={paddingX}
                y1={y}
                x2={chartWidth - paddingX}
                y2={y}
                stroke="#1E222B"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            );
          })}

          {/* Throughput Area & Path */}
          <path d={areaThroughput} fill="url(#throughputGrad)" />
          <path d={pathThroughput} fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

          {/* p95 Latency Path */}
          <path d={pathP95} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" />

          {/* p50 Latency Path */}
          <path d={pathP50} fill="none" stroke="#38BDF8" strokeWidth="2" />

          {/* Data points */}
          {pointsThroughput.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill="#10B981" className="hover:r-5 transition-all" />
          ))}

          {/* X axis labels */}
          {data.map((d, i) => {
            if (i % 2 !== 0 && i !== data.length - 1) return null;
            const x = paddingX + (i / (data.length - 1)) * innerWidth;
            return (
              <text
                key={i}
                x={x}
                y={chartHeight - 8}
                textAnchor="middle"
                fill="#64748B"
                fontSize="10"
                fontFamily="monospace"
              >
                {d.timestamp}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#1E222B] pt-3 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-1.5 font-mono">
          <TrendingUpIcon className="size-3.5 text-emerald-400" />
          <span>Peak Throughput: 345 runs/min</span>
        </div>
        <div className="font-mono text-[#64748B]">p50: 42ms • p95: 124ms • p99: 310ms</div>
      </div>
    </div>
  );
}
