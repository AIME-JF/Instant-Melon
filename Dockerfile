# Stage 1: Build Frontend
FROM node:18-alpine as frontend-builder
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .
# Build the React app (outputs to /app/dist)
RUN npm run build

# Stage 2: Setup Backend
FROM node:18-alpine
WORKDIR /app

# Copy backend dependency definitions
COPY package.json package-lock.json ./
# Install production dependencies only
RUN npm ci --only=production

# Copy backend code
COPY server.js ./

# Copy built frontend assets from Stage 1 to 'dist' folder
COPY --from=frontend-builder /app/dist ./dist

# Expose the API port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
