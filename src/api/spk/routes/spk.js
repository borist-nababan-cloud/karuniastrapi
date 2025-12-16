'use strict';

/**
 * spk router
 */

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/spks',
      handler: 'spk.find',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/spks/:id',
      handler: 'spk.findOne',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/spks',
      handler: 'spk.create',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'PUT',
      path: '/spks/:id',
      handler: 'spk.update',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'DELETE',
      path: '/spks/:id',
      handler: 'spk.delete',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};