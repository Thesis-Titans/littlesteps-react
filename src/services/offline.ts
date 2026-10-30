import { ApiError, UnauthorizedError } from "./api";

/** The one offline rule: only the browser saying it is offline counts. Any other failure to reach the API (TypeError, CORS, API down) is a plain error. */
export function failureKind(error: unknown, online: boolean): "offline" | "error" | "unauthorized" {
  if (error instanceof UnauthorizedError || (error instanceof ApiError && error.status === 401)) return "unauthorized";
  return online ? "error" : "offline";
}
