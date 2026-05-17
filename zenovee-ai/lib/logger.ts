type LogLevel = "info" | "warn" | "error";

type LogInput = {
  level: LogLevel;
  route: string;
  message: string;
  error?: unknown;
};

function sanitizeError(error: unknown) {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return { message: "Unknown error" };
}

export function serverLog({ level, route, message, error }: LogInput) {
  const payload = {
    level,
    route,
    message,
    timestamp: new Date().toISOString(),
    error: sanitizeError(error),
  };

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.info(payload);
}
