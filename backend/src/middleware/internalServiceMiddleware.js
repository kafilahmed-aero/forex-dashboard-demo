import crypto from "crypto";
import { config } from "../config/env.js";

/**
 * Dedicated internal service-to-service authentication middleware.
 * Authenticates internal callers via the 'x-service-key' HTTP header using constant-time comparison.
 * Rejects missing or invalid service keys with HTTP 401 Unauthorized.
 * Does NOT create sessions, use JWTs, or fall back to user authentication.
 */
export function requireInternalService(request, response, next) {
  const serviceKeyHeader = request.headers["x-service-key"];
  const expectedKey = config.internalServiceKey || process.env.INTERNAL_SERVICE_KEY;

  if (!serviceKeyHeader) {
    return response.status(401).json({ error: "Internal service key required." });
  }

  if (!expectedKey) {
    return response.status(401).json({ error: "Internal service key not configured on server." });
  }

  const keyBuf = Buffer.from(String(serviceKeyHeader));
  const expectedBuf = Buffer.from(String(expectedKey));

  if (keyBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(keyBuf, expectedBuf)) {
    return response.status(401).json({ error: "Invalid internal service key." });
  }

  return next();
}
