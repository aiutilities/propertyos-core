FROM node:22-alpine AS deps

WORKDIR /workspace/backend

COPY backend/package*.json ./
COPY backend/core-contracts ./core-contracts
COPY forgeos ../forgeos

RUN npm ci

FROM node:22-alpine AS build

WORKDIR /workspace/backend

COPY --from=deps /workspace/backend/node_modules ./node_modules
COPY --from=deps /workspace/backend/core-contracts ./core-contracts
COPY --from=deps /workspace/forgeos ../forgeos

COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/src ./src

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /workspace/backend

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY --from=build --chown=node:node /workspace/backend/package*.json ./
COPY --from=build --chown=node:node /workspace/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/backend/core-contracts ./core-contracts
COPY --from=build --chown=node:node /workspace/backend/dist ./dist
COPY --from=build --chown=node:node /workspace/forgeos ../forgeos
COPY --chown=node:node backend/src/database/migrations ./src/database/migrations

RUN mkdir -p /workspace/backend/uploads /workspace/backend/plugins/.installed \
  && chown -R node:node /workspace

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health/ready').then(async r=>{const b=await r.json();process.exit(r.ok&&b.status==='ok'?0:1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
