# Multi-stage Dockerfile for Nexo / EduBharat Full-Stack Application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests for workspace installation
COPY package.json package-lock.json* bun.lock* tsconfig.base.json tsconfig.json ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/edubharat/package.json ./artifacts/edubharat/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY scripts/package.json ./scripts/

# Install dependencies
RUN npm install

# Copy full repository source
COPY . .

# Build frontend and backend
RUN npm run build

# Stage 2: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy root package files
COPY package.json package-lock.json* bun.lock* ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/edubharat/package.json ./artifacts/edubharat/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY scripts/package.json ./scripts/

# Install production dependencies
RUN npm install --only=production

# Copy compiled build artifacts
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/edubharat/dist ./artifacts/edubharat/dist
COPY --from=builder /app/lib ./lib

EXPOSE 3000

CMD ["npm", "run", "start"]
