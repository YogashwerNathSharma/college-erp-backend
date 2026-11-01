# ═══════════════════════════════════════════════════════
# College ERP — Backend Dockerfile
# Multi-stage build: compile TypeScript → slim prod image
# ═══════════════════════════════════════════════════════

# ──── Stage 1: Build ────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies (bcrypt needs python + make)
RUN apk add --no-cache python3 make g++

# Copy package files and install ALL deps (need devDeps for tsc)
COPY package*.json ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src ./src/
COPY scripts ./scripts/
RUN npm run build

# ──── Stage 2: Production ────
FROM node:20-alpine

WORKDIR /app

# Install runtime-only native deps (bcrypt, canvas)
RUN apk add --no-cache python3 make g++ \
    cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev

# Copy package files and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy prisma schema + generated client from builder
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma/

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist/

# Copy scripts (needed for prestart/postinstall ensure scripts)
COPY --from=builder /app/scripts ./scripts/

# Create uploads directory
RUN mkdir -p uploads && chown -R node:node /app

# Switch to non-root user
USER node

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "dist/server.js"]
