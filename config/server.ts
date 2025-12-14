export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: true,
  },
  http: {
    middleware: {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:1337', 'http://localhost:8080'],
        credentials: true,
      },
    },
  },
});
