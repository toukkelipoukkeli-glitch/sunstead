# Single-service deploy artifact for the migrated app: one container that builds
# the Vite front-end and serves it from the same Express process that exposes the
# thin Aiven API (/auth, /api, /realtime). Host-agnostic — runs on Render, Fly,
# Aiven Apps, or `docker run` locally. The platform injects DATABASE_URL (Aiven
# Postgres) and PORT; the app reads both.

# 1) Build the front-end (needs dev deps like vite) and install API deps.
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN cd api && npm install --omit=dev

# 2) Slim runtime: the built SPA + the API, nothing else.
FROM node:20-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/api ./api
ENV STATIC_DIR=/app/dist
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080
WORKDIR /app/api
CMD ["npm", "start"]
