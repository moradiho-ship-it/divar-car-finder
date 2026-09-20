# Mobin frontend, Render backend

`carfinding.ir` serves the React build from Mobin. Caddy forwards `/api/*`,
`/admin/*`, and `/static/*` to the Render Django service. The crawler,
Telegram sender, database access, and scheduled jobs stay outside Iran.

The frontend must be built with `VITE_API_URL=/api` so the browser only calls
`carfinding.ir`. Use `compose.frontend.yml` for Mobin; the old
`compose.prod.yml` includes a local backend and is not the hybrid deployment.

The Mobin resolver currently returns `10.10.34.36` for the Render hostname.
The Caddy config therefore uses two public Render ingress IPs and verifies the
TLS certificate against `carfinding-api-free-hm.onrender.com`. These IPs are
external infrastructure and can change. If the proxy stops working, resolve
the Render hostname from a trusted network, update both addresses in
`carfinding.caddy`, validate, and reload Caddy. Do not disable TLS verification.

## Deploy on Mobin

From `/srv/apps/carfinding`:

```sh
docker compose -f compose.frontend.yml build frontend
docker compose -f compose.frontend.yml up -d --no-deps frontend
```

Copy `deploy/mobin/carfinding.caddy` to
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
