import { getServerStatus } from "@/server/repo/server-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getServerStatus();
  if (!status) {
    return Response.json(
      { online: null },
      {
        status: 503,
        headers: { "Cache-Control": "public, max-age=10, s-maxage=10" },
      },
    );
  }
  return Response.json(status, {
    headers: { "Cache-Control": "public, max-age=15, s-maxage=15, stale-while-revalidate=30" },
  });
}
