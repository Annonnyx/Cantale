import { env } from "@/server/env";
import { clearSessionCookie } from "@/server/session";

export const dynamic = "force-dynamic";

async function logout(request: Request) {
  await clearSessionCookie();
  const origin = env.authUrl ?? new URL(request.url).origin;
  return Response.redirect(origin, 302);
}

export async function GET(request: Request) {
  return logout(request);
}

export async function POST(request: Request) {
  return logout(request);
}
