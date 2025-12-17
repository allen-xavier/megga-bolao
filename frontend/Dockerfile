FROM ghcr.io/nodejs/node:20-alpine AS deps
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i

FROM ghcr.io/nodejs/node:20-alpine AS build
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Instala apenas as dependências necessárias para execução
FROM ghcr.io/nodejs/node:20-alpine AS prod-deps
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev

FROM ghcr.io/nodejs/node:20-alpine
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.js ./next.config.js
EXPOSE 3000
CMD ["npm", "run", "start"]
