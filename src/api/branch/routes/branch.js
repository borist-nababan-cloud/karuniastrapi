'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/branches',
      handler: 'branch.find',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/branches/:id',
      handler: 'branch.findOne',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/branches',
      handler: 'branch.create',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'PUT',
      path: '/branches/:id',
      handler: 'branch.update',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'DELETE',
      path: '/branches/:id',
      handler: 'branch.delete',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};