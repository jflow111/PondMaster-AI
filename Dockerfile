# Stage 1 — Build React client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2 — Run Express server
FROM node:20-alpine
WORKDIR /app/server
COPY server/package.json ./
RUN npm install --production
COPY server/ ./
COPY --from=client-builder /app/client/build ../client/build

ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
