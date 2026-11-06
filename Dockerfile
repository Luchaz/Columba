FROM node:22-bookworm-slim

# Install native FFmpeg and CA certificates for high-stability Discord Voice streaming
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY scripts ./scripts
RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-http-header-size=65536"
EXPOSE 3000

CMD ["npm", "start"]
