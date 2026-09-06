# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked npm ci

FROM ${NODE_IMAGE} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run lint && npm test

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

LABEL org.opencontainers.image.title="DrishtiGuard Live Demo" \
      org.opencontainers.image.description="Interactive privacy-boundary evidence lab and extension download" \
      org.opencontainers.image.source="https://github.com/AtharvaSamant4/DrishtiGuard"

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home-dir /app --shell /usr/sbin/nologin nextjs

# Next.js standalone output deliberately omits these two static directories.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000
STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
