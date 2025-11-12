FROM node:20-alpine AS deps
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i

FROM node:20-alpine AS build
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
RUN mkdir -p /app/storage
EXPOSE 3001
CMD ["node", "dist/main.js"]
