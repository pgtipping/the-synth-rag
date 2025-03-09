import { NextRequest } from "next/server";

/**
 * CORS middleware for API routes
 * @param req The incoming request
 * @param handler The API route handler
 * @returns The response with CORS headers
 */
export async function withCors(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  // Call the handler
  const response = await handler(req);

  // Create a new response with CORS headers
  const corsResponse = new Response(response.body, response);

  // Add CORS headers to the response
  Object.entries(getCorsHeaders()).forEach(([key, value]) => {
    corsResponse.headers.set(key, value);
  });

  return corsResponse;
}

/**
 * Get CORS headers
 * @returns CORS headers
 */
function getCorsHeaders() {
  // Use environment variable for allowed origins or default to all
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}
