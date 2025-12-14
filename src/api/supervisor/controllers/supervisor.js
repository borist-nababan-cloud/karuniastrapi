'use strict';

/**
 * supervisor controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::supervisor.supervisor');