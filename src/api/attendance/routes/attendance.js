'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/attendances',
      handler: 'attendance.find',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/attendances/:id',
      handler: 'attendance.findOne',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'POST',
      path: '/attendances',
      handler: 'attendance.create',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'PUT',
      path: '/attendances/:id',
      handler: 'attendance.update',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'DELETE',
      path: '/attendances/:id',
      handler: 'attendance.delete',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/attendances/user/:userId',
      handler: 'attendance.findByUser',
      config: {
        policies: [],
        middlewares: []
      }
    },
    {
      method: 'GET',
      path: '/attendances/today',
      handler: 'attendance.findToday',
      config: {
        policies: [],
        middlewares: []
      }
    }
  ]
};