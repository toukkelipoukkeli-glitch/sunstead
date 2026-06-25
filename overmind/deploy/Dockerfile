# Overmind — generated-backend Dockerfile (the "100% on Aiven" finale).
#
# This is the image Aiven Apps builds and runs for a tenant's migrated backend. Once Aiven Apps
# is enabled for the account, `aiven_application_deploy` pulls the generated repo, builds this
# Dockerfile, and runs it — app on Aiven, data on Aiven PG, realtime on Aiven Kafka. 100% Aiven.
#
# Aiven Apps injects connection creds as env vars via service_integrations (see deploy-aiven-apps.ts):
#   - Postgres → DATABASE_URL  (+ PROJECT_CA_CERT, a base64 Aiven CA cert, for proper TLS)
#   - Kafka    → KAFKA_BROKERS / KAFKA_USERNAME / KAFKA_PASSWORD / KAFKA_SSL (SASL_SSL)
# The app must STRIP `sslmode` from DATABASE_URL (pg v8 ignores the `ssl` option when sslmode is in
# the URL) and use PROJECT_CA_CERT for TLS — exactly the pattern in the generated server's db module.
#
# Modeled on demo/pulsewall-aiven/Dockerfile, which is the backend shape the Surgeon generates toward.

FROM node:22-slim
WORKDIR /app

# Install deps first for layer caching. `npm ci` when a lockfile exists, else fall back to install.
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source and build the web bundle (vite → web/dist, served by the Hono server in prod).
COPY . .
RUN npm run build

ENV NODE_ENV=production

# The generated server binds 0.0.0.0 on PORT (default 8788). Aiven Apps routes its public URL here.
# Keep this in sync with the `port` passed to aiven_application_deploy and the app's listen() call.
ENV PORT=8788
EXPOSE 8788

# `npm run start` runs the generated Hono server (tsx server/index.ts) in production mode.
CMD ["npm", "run", "start"]
