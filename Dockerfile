# =========================
# Build Stage
# =========================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Prisma needs DATABASE_URL during generate
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN npm run build

# =========================
# Production Stage
# =========================
FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy prisma files
COPY --from=builder /app/prisma ./prisma

# Copy generated prisma client
COPY --from=builder /app/src/generated ./src/generated

# Copy startup script
COPY start.sh .

RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]