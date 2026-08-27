FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

RUN apk add --no-cache openssl postgresql-client

COPY package*.json ./
RUN npm ci

COPY --from=build /app/dist ./dist
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npx prisma generate

ENV PORT=4000
EXPOSE 4000

USER node
CMD ["node", "dist/index.js"]
