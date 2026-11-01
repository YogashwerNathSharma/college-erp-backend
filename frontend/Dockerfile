# ═══════════════════════════════════════════════════════
# College ERP — Frontend Dockerfile
# Multi-stage: Vite build → Nginx static serve
# ═══════════════════════════════════════════════════════

# ──── Stage 1: Build ────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build-time env (API URL for production)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build the app
RUN npm run build

# ──── Stage 2: Serve with Nginx ────
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --spider -q http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
