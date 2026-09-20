# Mobin frontend, Render backend

`carfinding.ir` serves the React build from Mobin. Caddy sends `/api/*` to
the Supabase `render-proxy` Edge Function, which forwards it to the Render
Django service. The crawler, Telegram sender, database access, and scheduled
jobs stay outside Iran.

The frontend must be built with `VITE_API_URL=/api` so the browser only calls
`carfinding.ir`. Use `compose.frontend.yml` for Mobin; the old
`compose.prod.yml` includes a local backend and is not the hybrid deployment.

The Mobin resolver currently returns `10.10.34.36` for the Render hostname.
Direct Mobin-to-Render HTTPS connections through public Render ingress IPs
also intermittently time out or reset. The API therefore uses the Supabase
relay. `/admin/*` and `/static/*` still use the two public Render ingress IPs
with certificate verification; these IPs can change.

## Deploy the API relay

The function is in `supabase/functions/render-proxy/`. Deploy it with JWT
verification disabled because Django validates the application's JWTs:

```sh
supabase functions deploy render-proxy --project-ref fypqnukqbxgnmpzojbna --no-verify-jwt
```

The project's `BACKEND_URL` secret must point to the Render API origin. Set a
separate random `RENDER_PROXY_SECRET` in Supabase and put the same value in the
Mobin file `/srv/shared/reverse-proxy/sites/carfinding-proxy-secret.txt`:

```text
header_up X-Proxy-Secret <same-random-secret>
```

Restrict that file to the deploy user (`chmod 600`). The file is imported by
`carfinding.caddy`, is not tracked in Git, and should never be printed in logs.
The function only forwards `/api/*` to the fixed Render origin, blocks
`/api/internal/*`, and removes the shared secret before forwarding.

## Deploy on Mobin

From `/srv/apps/carfinding`:

```sh
docker compose -f compose.frontend.yml build frontend
docker compose -f compose.frontend.yml up -d --no-deps frontend
```

Create the secret file above before copying `deploy/mobin/carfinding.caddy` to
`/srv/shared/reverse-proxy/sites/carfinding.caddy` and run
`/srv/shared/scripts/caddy-reload.sh`. Keep a copy of the previous site file
for rollback. Caddy and the frontend container must both be on the external
Docker network named `web`.

The Render backend needs `CSRF_TRUSTED_ORIGINS` to include
`https://carfinding.ir,https://www.carfinding.ir` for the proxied Django admin.
The application now defaults to these origins. The React app uses JWT bearer
tokens, so its login works through the same-origin `/api` proxy.

## Verify

```sh
curl -fsS https://carfinding.ir/api/health/
curl -I https://carfinding.ir/
curl -I https://carfinding.ir/admin/
```

The health response must report the Render release, and the admin path should
redirect to `/admin/login/`. Check login and authenticated dashboard requests
in a browser on a network where Render is otherwise unavailable.

The relay consumes one Supabase Edge Function invocation per API request.
Supabase currently includes 500,000 monthly invocations on the Free plan;
monitor usage if traffic grows.
