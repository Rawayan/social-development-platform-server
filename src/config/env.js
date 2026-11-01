
const requiredVariables = ["MONGODB_URI", "DB_NAME"];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid port number");
}

const clientUrls = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const authBaseUrl = process.env.AUTH_BASE_URL;

const authJwksUrl = process.env.AUTH_JWKS_URL;

if (!authBaseUrl) {
  throw new Error("AUTH_BASE_URL is missing");
}

if (!authJwksUrl) {
  throw new Error("AUTH_JWKS_URL is missing");
}

export const env = {
  port,
  databaseName: process.env.DB_NAME,
  clientUrls,
  nodeEnv: process.env.NODE_ENV || "development",
  authBaseUrl,
  authJwksUrl,
};
