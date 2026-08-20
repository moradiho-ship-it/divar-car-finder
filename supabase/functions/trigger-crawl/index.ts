const jsonHeaders = { "content-type": "application/json" };

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ detail: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  const backendUrl = Deno.env.get("BACKEND_URL");
  const cronSecret = Deno.env.get("CRON_SECRET");
  const scheduleSecret = Deno.env.get("SCHEDULE_SECRET");
  const suppliedScheduleSecret = request.headers.get("x-schedule-secret") ?? "";

  if (!backendUrl || !cronSecret || !scheduleSecret) {
    console.error("trigger_crawl_missing_configuration");
    return new Response(JSON.stringify({ detail: "Function is not configured" }), { status: 500, headers: jsonHeaders });
  }
  if (suppliedScheduleSecret !== scheduleSecret) {
    return new Response(JSON.stringify({ detail: "Forbidden" }), { status: 403, headers: jsonHeaders });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/internal/crawl-due/`, {
      method: "POST",
      headers: { "x-cron-secret": cronSecret, "content-type": "application/json" },
      body: JSON.stringify({ source: "supabase-cron", triggered_at: new Date().toISOString() }),
    });
    const body = await response.text();
    console.log(JSON.stringify({ event: "render_crawl_triggered", status: response.status }));
    return new Response(body, { status: response.status, headers: jsonHeaders });
  } catch (error) {
    console.error(JSON.stringify({ event: "render_crawl_failed", error: error instanceof Error ? error.message : "unknown" }));
    return new Response(JSON.stringify({ detail: "Backend request failed" }), { status: 502, headers: jsonHeaders });
  }
});

