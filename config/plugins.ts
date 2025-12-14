export default () => ({
  documentation: {
    enabled: true,
    config: {
      openapi: '3.0.0',
      info: {
        version: '1.0.0',
        title: 'Karunia Motor API',
        description: 'API documentation for Karunia Motor CMS',
        contact: {
          name: 'API Support',
          email: 'support@karunia-motor.com',
        },
      },
      servers: [
        {
          url: 'http://localhost:1337',
          description: 'Development server',
        },
        {
          url: 'http://localhost:1337/api',
          description: 'API endpoint server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      paths: {},
      tags: [
        {
          name: 'Article',
          description: 'Article management API',
        },
        {
          name: 'Category',
          description: 'Category management API',
        },
        {
          name: 'Author',
          description: 'Author management API',
        },
        {
          name: 'Global',
          description: 'Global settings API',
        },
        {
          name: 'About',
          description: 'About page API',
        },
      ],
    },
  },
});
