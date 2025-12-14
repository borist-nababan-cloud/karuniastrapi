'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/vehicle-groups',
      handler: 'vehicle-group.find',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/vehicle-groups/:id',
      handler: 'vehicle-group.findOne',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/vehicle-groups',
      handler: 'vehicle-group.create',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'PUT',
      path: '/vehicle-groups/:id',
      handler: 'vehicle-group.update',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'DELETE',
      path: '/vehicle-groups/:id',
      handler: 'vehicle-group.delete',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};