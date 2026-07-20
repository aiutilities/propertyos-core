FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY core-contracts ./core-contracts
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/core-contracts ./core-contracts
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/core-contracts ./core-contracts
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node src/database/migrations ./src/database/migrations

RUN mkdir -p /app/uploads /app/plugins/.installed \
  && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health/ready').then(async r=>{const b=await r.json();process.exit(r.ok&&b.status==='ok'?0:1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
