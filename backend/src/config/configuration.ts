export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  webOrigin: process.env.WEB_ORIGIN?.split(',') ?? ['http://localhost:3000'],
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: parseInt(process.env.ACCESS_TOKEN_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.REFRESH_TOKEN_TTL ?? '604800', 10),
  },
  evolution: {
    url: process.env.EVOLUTION_API_URL,
    token: process.env.EVOLUTION_API_TOKEN,
  },
  suitpay: {
    url: process.env.SUITPAY_API_URL,
    token: process.env.SUITPAY_API_TOKEN,
    webhookSecret: process.env.SUITPAY_WEBHOOK_SECRET,
  },
});
