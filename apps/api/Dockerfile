FROM node:22-alpine
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo structure (workspace config + package.json files only)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# Dummy pcs-service package.json to satisfy pnpm workspace
RUN mkdir -p apps/pcs-service && echo '{"name":"pcs-service","private":true,"version":"0.0.0"}' > apps/pcs-service/package.json

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Build shared then API
RUN pnpm --filter "@bcf/shared" build
RUN pnpm --filter api exec node ace build

ENV NODE_ENV=production
EXPOSE 3333

WORKDIR /app/apps/api/build
CMD ["sh", "-c", "node ace migration:run --force && node bin/server.js"]
