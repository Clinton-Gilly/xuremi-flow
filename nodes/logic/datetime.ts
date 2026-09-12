import { z } from "zod";
import { ConnectorError, defineNode } from "../define";

export const datetimeFormatNode = defineNode({
  type: "datetime.format",
  name: "Date & time format",
  description: "Format, parse, or add offsets to dates and timestamps.",
  category: "logic",
  guide: {
    summary:
      "Parse a date or use current time, apply an optional minute offset, and format as ISO, timestamp, or readable string.",
  },
  icon: "Clock",
  credential: null,
  requiresFeature: null,
  version: "v1",
  inputs: z.object({
    date: z
      .string()
      .optional()
      .describe("Date string or ISO timestamp (e.g. '2026-09-12T12:00:00Z'). Defaults to current time if omitted.")
      .meta({ label: "Input date" }),
    offsetMinutes: z
      .number()
      .optional()
      .default(0)
      .describe("Minutes to add (positive) or subtract (negative). E.g. 60 for +1 hour.")
      .meta({ label: "Offset (minutes)" }),
    format: z
      .enum(["iso", "date_only", "time_only", "utc_string", "timestamp_ms", "timestamp_seconds"])
      .default("iso")
      .describe("Output format: iso (ISO 8601), date_only (YYYY-MM-DD), time_only (HH:mm:ss), utc_string, timestamp_ms, timestamp_seconds.")
      .meta({ label: "Format" }),
  }),
  outputs: z.object({
    formatted: z.string(),
    iso: z.string(),
    timestamp: z.number(),
  }),
  async run({ inputs }) {
    let d: Date;
    if (inputs.date && inputs.date.trim()) {
      d = new Date(inputs.date.trim());
      if (Number.isNaN(d.getTime())) {
        throw new ConnectorError(`Invalid date string: "${inputs.date}"`, 400);
      }
    } else {
      d = new Date();
    }

    if (inputs.offsetMinutes) {
      d = new Date(d.getTime() + inputs.offsetMinutes * 60 * 1000);
    }

    const timestamp = d.getTime();
    const iso = d.toISOString();
    let formatted: string;

    switch (inputs.format) {
      case "date_only":
        formatted = iso.slice(0, 10);
        break;
      case "time_only":
        formatted = iso.slice(11, 19);
        break;
      case "utc_string":
        formatted = d.toUTCString();
        break;
      case "timestamp_ms":
        formatted = String(timestamp);
        break;
      case "timestamp_seconds":
        formatted = String(Math.floor(timestamp / 1000));
        break;
      case "iso":
      default:
        formatted = iso;
        break;
    }

    return {
      formatted,
      iso,
      timestamp,
    };
  },
});
