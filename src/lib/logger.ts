// OwnState — minimal structured logger (production observability)
//
// Emits single-line JSON in production (easy to ingest by Vercel/Datadog/etc.)
// and readable lines in development. Use this instead of bare console.* so logs
// are searchable and carry consistent context. Never log secrets or full PII.

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const isProd = process.env.NODE_ENV === "production";

function emit(level: Level, event: string, fields: Fields = {}) {
  const entry = { level, event, ts: new Date().toISOString(), ...fields };
  const line = isProd ? JSON.stringify(entry) : `[${level}] ${event}`;
  if (level === "error") console.error(line, isProd ? "" : fields);
  else if (level === "warn") console.warn(line, isProd ? "" : fields);
  else console.log(line, isProd ? "" : fields);
}

export const log = {
  debug: (event: string, fields?: Fields) => emit("debug", event, fields),
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};

/** Dedicated channel for security-relevant events (auth, payment, abuse). */
export const securityLog = (event: string, fields?: Fields) =>
  emit("warn", `security.${event}`, fields);
