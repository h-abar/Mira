# ---- Build the client (React + Vite) ----
FROM node:20-alpine AS client-build
WORKDIR /client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ---- Build + run the server (Express), serving the built client ----
FROM node:20-alpine AS server
WORKDIR /app

COPY server/package*.json ./
# devDependencies are required for the tsc build step.
RUN npm ci --include=dev

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build && rm -rf src && npm prune --omit=dev

# Built SPA is copied into the image and served statically by Express.
COPY --from=client-build /client/dist /client/dist

RUN apk add --no-cache openssl postgresql-client

ENV NODE_ENV=production
ENV CLIENT_DIST=/client/dist
ENV PORT=4000
EXPOSE 4000

CMD ["node", "dist/index.js"]
