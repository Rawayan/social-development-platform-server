
export function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;

  const isProduction = process.env.NODE_ENV === "production";

  console.error("API Error:", {
    message: error.message,
    method: req.method,
    path: req.path,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    message:
      isProduction && statusCode >= 500
        ? "Internal server error."
        : error.message || "Something went wrong.",
    ...(isProduction
      ? {}
      : { stack: error.stack }),
  });
}
