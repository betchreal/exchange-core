FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/common/package.json ./packages/common/

RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npm run build -- --filter=@exchange-core/api # --filter=@exchange-core/cpmmon

RUN cd apps/api && node dist/scripts/build-host.js

FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/common/package.json ./packages/common/

RUN npm ci --omit=dev

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/common/dist ./packages/common/dist

COPY --from=builder /app/apps/api/dist/src/plugin-core/host/plugin.host.bundle.js ./apps/api/plugin.host.bundle.js

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

RUN mkdir -p /app/plugins/tmp /app/plugins/parser /app/plugins/payout /app/plugins/merchant /app/plugins/aml && \
    chown -R nestjs:nodejs /app/plugins

USER nestjs

EXPOSE 3000

CMD ["node", "apps/api/dist/src/main.js"]
