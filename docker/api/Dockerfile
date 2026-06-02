# ── Stage 1: Install dependencies ─────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ────────────────────────────────────────────────────
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm nx build api --configuration=production

# ── Stage 3: Production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache dumb-init docker-cli
WORKDIR /app

# Copy built output (Webpack generates package.json via generatePackageJson)
COPY --from=build /app/dist/apps/api ./

# Install only production dependencies from the generated package.json
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate \
    && pnpm install --prod --frozen-lockfile || pnpm install --prod

# Non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000
ENV NODE_ENV=production
CMD ["dumb-init", "node", "main.js"]
