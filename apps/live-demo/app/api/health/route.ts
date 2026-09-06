export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "drishtiguard-live-demo",
      version: "0.1.0",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
