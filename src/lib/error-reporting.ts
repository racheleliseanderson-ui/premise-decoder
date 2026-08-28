/**
 * Runtime error reporting for the desk.
 *
 * Previously this forwarded React error-boundary failures into a hosted editor's
 * telemetry global. That hook only ever existed inside that editor's preview, so
 * in production it was dead code shipping a third-party contract. It is now a first-party seam: errors are normalised here and logged,
 * and a single optional sink can be attached if we ever want real telemetry.
 *
 * Nothing is transmitted anywhere by default — the desk's promise is that work
 * stays in the browser, and that includes its crash reports.
 */

export type RuntimeErrorReport = {
  message: string;
  stack?: string;
  route?: string;
  context?: Record<string, unknown>;
};

type Sink = (report: RuntimeErrorReport) => void;

let sink: Sink | null = null;

/** Attach a reporting sink. Call once, from the client entry, if ever needed. */
export function setErrorSink(next: Sink | null) {
  sink = next;
}

function describe(error: unknown): { message: string; stack?: string } {
  // Loaders and server functions commonly throw a raw Response; String(it) is
  // the opaque "[object Response]", so pull out the status and URL instead.
  if (error instanceof Response) {
    return {
      message: `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`,
    };
  }
  if (error instanceof Error) {
    return { message: error.message, ...(error.stack ? { stack: error.stack } : {}) };
  }
  return { message: String(error) };
}

export function reportRuntimeError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  const report: RuntimeErrorReport = {
    ...describe(error),
    route: window.location.pathname,
    context,
  };

  // Production React does not rethrow boundary-caught errors to window.onerror,
  // so without this the failure is invisible in the console too.
  console.error("[desk] runtime error", report);

  try {
    sink?.(report);
  } catch {
    // A broken sink must never take down the error boundary that called it.
  }
}
