# Docker / Render: set the service **Root Directory** to `backend` (or keep Dockerfile here and context = backend).
# There is no package-lock.json inside `backend/` (lockfile lives at monorepo root), so we use `npm install`.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig.json ./

RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p uploads/screenshots

EXPOSE 4000

CMD ["node", "dist/server.js"]
