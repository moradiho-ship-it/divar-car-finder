export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(trigger(env));
  },
  async fetch(_request, env) {
    return trigger(env);
  },
};

async function trigger(env) {
  const response = await fetch(`${env.BACKEND_URL}/api/internal/crawl-due/`, {
    method: "POST",
    headers: { "X-Cron-Secret": env.CRON_SECRET },
  });
  return new Response(await response.text(), { status: response.status, headers: { "content-type": "application/json" } });
}
