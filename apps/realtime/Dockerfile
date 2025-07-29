# Install dependencies only when needed
FROM node:22.17.0-alpine AS deps
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
COPY apps/realtime/package.json ./apps/realtime/

# Install dependencies for the entire workspace
RUN corepack enable && pnpm install --frozen-lockfile

# Production image, run with tsx  
FROM node:22.17.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy entire workspace structure to maintain dependencies and source files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy source files separately to ensure they exist
COPY apps/realtime ./apps/realtime

USER nodejs

EXPOSE 3001

CMD ["./node_modules/.pnpm/node_modules/.bin/tsx", "apps/realtime/src/index.ts"]