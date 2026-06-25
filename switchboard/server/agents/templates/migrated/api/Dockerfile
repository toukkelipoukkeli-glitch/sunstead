# Deploy target: Aiven Apps. Aiven injects DATABASE_URL + PROJECT_CA_CERT from
# the linked Postgres service, and KAFKA_* from a linked Kafka service.
FROM node:20-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
ENV PORT=8089
EXPOSE 8089
CMD ["npm", "start"]
