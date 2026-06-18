FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

RUN npm run prisma:generate
RUN npm run build:api

FROM node:22-alpine AS runner

WORKDIR /app
ENV DATABASE_URL=postgresql://poketeam:poketeam@postgres:5432/poketeam?schema=public

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts

RUN npm ci
RUN npm run prisma:generate

COPY --from=builder /app/apps/api/dist apps/api/dist

EXPOSE 3000

CMD ["sh", "-c", "npm run db:deploy && npm run start:api"]
