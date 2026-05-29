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
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm nx build web --configuration=production

# ── Stage 3: Serve with Nginx ─────────────────────────────────────────
FROM nginx:alpine AS runner
COPY docker/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/apps/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
