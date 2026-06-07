FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable pnpm

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Next.js standalone server (app runtime)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts          ./scripts

# Migration tooling for startup. The Next.js standalone bundle excludes drizzle-kit
# (a devDependency), so copy the full node_modules plus the self-hosted migration
# lineage (drizzle/) and its config. `drizzle-kit migrate` applies the versioned,
# forward-only SQL in drizzle/ — no destructive DDL is generated at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules                  ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/drizzle                       ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.selfhosted.ts  ./drizzle.config.selfhosted.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db                    ./src/lib/db
COPY --from=builder --chown=nextjs:nodejs /app/package.json                  ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json                 ./tsconfig.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "scripts/start.sh"]
