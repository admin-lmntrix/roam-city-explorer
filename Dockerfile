FROM node:22-slim
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Pages are rendered on demand, so the build does not need a live database.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm run build
ENV NODE_ENV=production
EXPOSE 3000
# Creates/updates tables from prisma/schema.prisma, then starts the server.
CMD ["npm", "run", "start:docker"]
