type ErrorContext = {
  action?: string;
  source?: "ai" | "auth" | "backup" | "database" | "export" | "storage" | "validation";
};

const genericMessages = {
  ai: "AI analysis failed. Check your provider settings and try again.",
  auth: "Please login again to access your trading journal.",
  backup: "Backup action failed. Check the file and try again.",
  database: "Supabase data request failed. Please try again.",
  export: "Export failed. Check browser download permissions and try again.",
  storage: "We could not load this screenshot. Please check storage permission or upload again.",
  validation: "Some fields need attention before continuing.",
} satisfies Record<NonNullable<ErrorContext["source"]>, string>;

export class FriendlyError extends Error {
  constructor(
    message: string,
    readonly context: ErrorContext = {},
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FriendlyError";
  }
}

export function createFriendlyError(error: unknown, context: ErrorContext = {}) {
  logTechnicalError(error, context);
  return new FriendlyError(toFriendlyMessage(error, context), context, error);
}

export function getFriendlyErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof FriendlyError) {
    return error.message;
  }

  return toFriendlyMessage(error, {}, fallback);
}

export function logTechnicalError(error: unknown, context: ErrorContext = {}) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.error("[TradeJournal]", context, error);
}

function toFriendlyMessage(error: unknown, context: ErrorContext, fallback?: string) {
  const message = getRawMessage(error).toLowerCase();

  if (message.includes("supabase") && message.includes("configured")) {
    return getRawMessage(error);
  }

  if (message.includes("supabase url") || message.includes("supabase anon key")) {
    return getRawMessage(error);
  }

  if (message.includes("please login first")) {
    return "Please login again to access your trading journal.";
  }

  if (
    message.includes("locally stored trades") ||
    message.includes("another account") ||
    message.includes("permission denied for this user data")
  ) {
    return "You can only access your own trading journal data.";
  }

  if (message.includes("permission blocked by database policy")) {
    return context.source === "storage"
      ? genericMessages.storage
      : "We could not access this data because your account permission check failed.";
  }

  if (message.includes("jwt") || message.includes("session") || message.includes("refresh token")) {
    return "Please login again to access your trading journal.";
  }

  if (
    context.source === "storage" &&
    (message.includes("permission") ||
      message.includes("row-level security") ||
      message.includes("rls") ||
      message.includes("unauthorized") ||
      message.includes("403"))
  ) {
    return genericMessages.storage;
  }

  if (message.includes("permission") || message.includes("row-level security") || message.includes("rls")) {
    return "We could not access this data because your account permission check failed.";
  }

  if (message.includes("not authenticated") || message.includes("sign in") || message.includes("login")) {
    return "Please login again to access your trading journal.";
  }

  if (message.includes("api key") || message.includes("unauthorized") || message.includes("401")) {
    return "The provider credentials are not configured correctly.";
  }

  if (message.includes("storage")) {
    return genericMessages.storage;
  }

  if (message.includes("network") || message.includes("fetch failed") || message.includes("failed to fetch")) {
    return "Network request failed. Check your connection and try again.";
  }

  if (context.source) {
    return genericMessages[context.source];
  }

  return fallback ?? "Something went wrong. Please try again.";
}

function getRawMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }

  return String(error ?? "");
}
