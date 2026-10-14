FROM node:22.22.0-bookworm-slim AS backend-deps
WORKDIR /app/BE
COPY BE/package.json BE/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:22.22.0-bookworm-slim AS frontend-deps
WORKDIR /app/FE
COPY FE/package.json FE/package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

FROM frontend-deps AS build
WORKDIR /app
COPY FE ./FE
COPY BE ./BE
COPY deploy ./deploy
COPY package.json package-lock.json README.md render.yaml .gitignore Dockerfile .dockerignore ./
ENV VITE_DEMO_MODE=false VITE_API_URL=/api
RUN npm run build --prefix FE

FROM node:22.22.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=10000 \
    SERVE_FRONTEND=true \
    TRUST_PROXY=1 \
    FILE_STORAGE=mysql \
    UPLOAD_MAX_MB=5 \
    CORS_ORIGINS=""
COPY --from=backend-deps --chown=node:node /app/BE/node_modules ./BE/node_modules
COPY --chown=node:node BE/package.json ./BE/package.json
COPY --chown=node:node BE/src ./BE/src
COPY --chown=node:node BE/migrations ./BE/migrations
COPY --chown=node:node BE/scripts/migrate.js BE/scripts/start-cloud.js ./BE/scripts/
COPY --chown=node:node deploy/start.mjs ./deploy/start.mjs
COPY --from=build --chown=node:node /app/FE/dist ./FE/dist
USER node
EXPOSE 10000
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/health', { signal: AbortSignal.timeout(4000) }).then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "deploy/start.mjs"]
