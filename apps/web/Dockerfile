# Install dependencies only when needed
# Install dependencies only when needed
FROM node:22.17.0-alpine AS deps
WORKDIR /app

# Copy the entire monorepo context
COPY . .

# Install ALL dependencies for the entire monorepo
RUN corepack enable && pnpm install --frozen-lockfile --prod=false

# Rebuild the source code only when needed
FROM node:22.17.0-alpine AS builder
WORKDIR /app
RUN corepack enable

# Copy the installed dependencies and the entire source code
COPY --from=deps /app .

# Next.js collects telemetry data by default.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry.
# ENV NEXT_TELEMETRY_DISABLED 1

# We are installing devDependencies via the --prod=false flag, so this is not needed
# ENV NODE_ENV=development

# Build with development env to ensure Tailwind v4 processes correctly
RUN cd apps/web && pnpm build

# Reset NODE_ENV for production runtime
ENV NODE_ENV=production

# Production image, copy all the files and run next
FROM node:22.17.0-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder /app/apps/web/.next/standalone .
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Start the server
CMD ["node", "apps/web/server.js"]