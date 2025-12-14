'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/vehicle-types',
      handler: 'vehicle-type.find',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/vehicle-types/:id',
      handler: 'vehicle-type.findOne',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/vehicle-types',
      handler: 'vehicle-type.create',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'PUT',
      path: '/vehicle-types/:id',
      handler: 'vehicle-type.update',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'DELETE',
      path: '/vehicle-types/:id',
      handler: 'vehicle-type.delete',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};