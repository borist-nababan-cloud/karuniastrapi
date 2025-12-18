/**
 * spk controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::spk.spk', ({ strapi }) => ({
  async find(ctx) {
    const { query } = ctx;

    // Default populate parameters
    const defaultPopulate = {
      salesProfile: true,
      ktpPaspor: true,
      kartuKeluarga: true,
      selfie: true,
      detailInfo: true,
      paymentInfo: true,
      unitInfo: {
        populate: {
          vehicleType: true,
          color: true,
        },
      },
    };

    // If query.populate is '*', we still need to explicitly populate component relations
    if (query.populate === '*') {
      query.populate = defaultPopulate;
    } else if (typeof query.populate === 'object') {
      // Merge with existing populate object
      query.populate = {
        ...defaultPopulate,
        ...query.populate,
      };
    }

    const response = await strapi.entityService.findMany('api::spk.spk', query);

    const sanitizedResults = await this.sanitizeOutput(response, ctx);

    return this.transformResponse(sanitizedResults);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const { query } = ctx;

    // Default populate parameters
    const defaultPopulate = {
      salesProfile: true,
      ktpPaspor: true,
      kartuKeluarga: true,
      selfie: true,
      detailInfo: true,
      paymentInfo: true,
      unitInfo: {
        populate: {
          vehicleType: true,
          color: true,
        },
      },
    };

    // If query.populate is '*', we still need to explicitly populate component relations
    if (query.populate === '*') {
      query.populate = defaultPopulate;
    } else if (typeof query.populate === 'object') {
      // Merge with existing populate object
      query.populate = {
        ...defaultPopulate,
        ...query.populate,
      };
    }

    const entity = await strapi.entityService.findOne('api::spk.spk', id, query);

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    return this.transformResponse(sanitizedEntity);
  },
}));