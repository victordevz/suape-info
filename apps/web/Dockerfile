FROM node:22-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://api:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

RUN npm run build:web

FROM node:22-alpine AS runner

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=http://api:3000/api
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY --from=builder /app/apps/web/.next apps/web/.next
COPY --from=builder /app/apps/web/src apps/web/src
COPY --from=builder /app/apps/web/next.config.ts apps/web/next.config.ts
COPY --from=builder /app/apps/web/package.json apps/web/package.json
COPY --from=builder /app/apps/web/tsconfig.json apps/web/tsconfig.json
COPY --from=builder /app/apps/web/next-env.d.ts apps/web/next-env.d.ts

EXPOSE 3001

CMD ["npm", "run", "start:web"]
