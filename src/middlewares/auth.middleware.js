
import {
  createRemoteJWKSet,
  jwtVerify,
} from "jose";

import { env } from "../config/env.js";

const JWKS = createRemoteJWKSet(
  new URL(env.authJwksUrl)
);

export async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.authBaseUrl,
      audience: env.authBaseUrl,
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token payload",
      });
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      name:
        typeof payload.name === "string"
          ? payload.name
          : "",
    };

    next();
  } catch (error) {
    console.warn("JWT verification failed:", error.code || error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}
