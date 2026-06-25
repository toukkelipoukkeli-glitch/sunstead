# Lets the whole app deploy to Aiven Apps (aiven_application_deploy) once the account
# is enabled — app on Aiven, data on Aiven PG, realtime on Aiven Kafka. 100% Aiven.
FROM node:22-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
# Aiven Apps injects DATABASE_URL + PROJECT_CA_CERT and the KAFKA_* cert vars.
EXPOSE 8787
CMD ["npm", "run", "start"]
