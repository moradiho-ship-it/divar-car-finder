const proxyPrefix = "/render-proxy";
const allowedPath = /^\/api\//;
const blockedPath = /^\/api\/internal\//;

Deno.serve(async (request: Request) => {
  const backendUrl = Deno.env.get("BACKEND_URL");
  const proxySecret = Deno.env.get("RENDER_PROXY_SECRET");
  if (!backendUrl || !proxySecret) {
    console.error("render_proxy_missing_configuration");
    return new Response("Proxy is not configured", { status: 500 });
  }
  if (request.headers.get("x-proxy-secret") !== proxySecret) {
    return new Response("Forbidden", { status: 403 });
  }

  const incomingUrl = new URL(request.url);
  const prefixAt = incomingUrl.pathname.indexOf(`${proxyPrefix}/`);
  const path = prefixAt >= 0
    ? incomingUrl.pathname.slice(prefixAt + proxyPrefix.length)
    : incomingUrl.pathname;
  if (!allowedPath.test(path) || blockedPath.test(path)) {
    return new Response("Not found", { status: 404 });
  }

  const upstreamUrl = new URL(`${path}${incomingUrl.search}`, backendUrl);
  const headers = new Headers(request.headers);
  for (const name of [
    "host", "content-length", "connection", "transfer-encoding", "accept-encoding",
    "x-proxy-secret", "apikey", "x-forwarded-host", "x-forwarded-proto",
  ]) headers.delete(name);
  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer();

  try {
    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    console.error(JSON.stringify({
      event: "render_proxy_failed",
      path,
      error: error instanceof Error ? error.message : "unknown",
    }));
    return new Response("Backend request failed", { status: 502 });
  }
});
