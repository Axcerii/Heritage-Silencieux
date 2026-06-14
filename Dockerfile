# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy application source
COPY . .

# Build the SvelteKit app
RUN bun run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built output and dependency configuration
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

# Expose the default SvelteKit port
ENV PORT=3000
EXPOSE 3000

# Run the server
CMD ["node", "build/index.js"]
