# ─────────────────────────────────────────────
# Stage 1 — Dependências
# ─────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# ─────────────────────────────────────────────
# Stage 2 — Migrator (prisma db push)
# ─────────────────────────────────────────────
FROM node:22-alpine AS migrator
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

CMD ["npx", "prisma", "db", "push"]

# ─────────────────────────────────────────────
# Stage 3 — Build
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gera o Prisma Client antes do build
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─────────────────────────────────────────────
# Stage 4 — Runner (imagem mínima)
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Standalone output — server.js + dependências mínimas
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# ⚠️  Gotcha Prisma v7 + standalone: o client é gerado em lib/generated/prisma
#     (não em node_modules/.prisma como nas versões anteriores). Copiar explicitamente
#     pois o tracing do Next.js não inclui arquivos gerados dinamicamente.
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated/prisma ./lib/generated/prisma

# ⚠️  Gotcha standalone + fs.readFile em runtime: o Studio lê docs/cs-board.json
#     (Kanban) e DOCUMENTATION.md (aba Documentação) via readFile com caminho
#     computado. O tracing do Next.js não detecta essas leituras, então os
#     arquivos não entram no standalone e a página crasha com ENOENT em prod.
#     Copiar explicitamente.
COPY --from=builder --chown=nextjs:nodejs /app/docs/cs-board.json ./docs/cs-board.json
COPY --from=builder --chown=nextjs:nodejs /app/DOCUMENTATION.md ./DOCUMENTATION.md

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
