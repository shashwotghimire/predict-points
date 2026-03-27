# Predict Points

Monorepo with:
- `app/api/v1`: NestJS + Prisma API
- `app/web`: Next.js web app

## Production readiness checklist

1. Configure environment files:
   - API: `app/api/v1/.env` from `app/api/v1/.env.example`
   - Web: `app/web/.env.local` from `app/web/.env.example`
2. Use strong unique secrets:
   - `JWT_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 characters.
3. Set production origins:
   - `FRONTEND_URL`
   - `CORS_ORIGIN` (comma-separated trusted origins)
4. Use HTTPS in production:
   - Set `COOKIE_SECURE=true`
   - Set `COOKIE_SAMESITE=lax` unless the frontend and API are on different sites
   - If the frontend and API are on different sites, set `COOKIE_SAMESITE=none` and `COOKIE_PARTITIONED=true`
5. Keep auth tokens in `HttpOnly` cookies only; do not expose session credentials to browser JavaScript.
6. Keep `ENABLE_SAMPLE_DATA=false` in production.
7. Only use `BOOTSTRAP_ADMIN=true` for controlled initial setup.

## Local development

### API
```bash
cd app/api/v1
pnpm install
pnpm run start:dev
```

### Web
```bash
cd app/web
pnpm install
pnpm run dev
```
