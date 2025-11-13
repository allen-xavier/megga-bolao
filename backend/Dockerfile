ARG NODE_IMAGE=node:20-alpine3.19
FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache openssl1.1-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i

FROM ${NODE_IMAGE} AS build
RUN apk add --no-cache openssl1.1-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM ${NODE_IMAGE}
RUN apk add --no-cache openssl1.1-compat
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN mkdir -p /app/storage
RUN chmod +x docker-entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
