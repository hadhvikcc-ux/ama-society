# API image for Cloud Run / docker-compose. Build from the repo root so the
# pnpm workspace lockfile is used:
#   docker build -f packages/api/Dockerfile -t ama-api .
# node:20 (not -slim) already ships openssl for Prisma and a toolchain for bcrypt.
FROM node:20 AS base
RUN corepack enable
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/api/package.json packages/api/
COPY packages/shared/package.json packages/shared/

FROM base AS build
RUN pnpm install --frozen-lockfile --filter @ama/api...
COPY packages/api packages/api
WORKDIR /repo/packages/api
RUN npx prisma generate && npx nest build

FROM base AS deps
RUN pnpm install --frozen-lockfile --prod --filter @ama/api...
COPY packages/api/prisma packages/api/prisma
RUN cd packages/api && npx prisma generate

FROM node:20
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --from=deps --chown=node:node /repo/node_modules ./node_modules
COPY --chown=node:node packages/api/package.json ./
COPY --chown=node:node packages/api/prisma ./prisma
COPY --from=build --chown=node:node /repo/packages/api/dist ./dist
USER node
EXPOSE 8080
# Apply pending migrations, then start. Cloud Run sets PORT.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
