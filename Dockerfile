FROM node:22-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3857

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
RUN pnpm rebuild better-sqlite3
RUN test -f /app/node_modules/.pnpm/better-sqlite3@12.8.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY scripts/docker-start.sh ./scripts/docker-start.sh

RUN mkdir -p /app/data \
  && chmod +x /app/scripts/docker-start.sh

EXPOSE 3857

CMD ["./scripts/docker-start.sh"]
