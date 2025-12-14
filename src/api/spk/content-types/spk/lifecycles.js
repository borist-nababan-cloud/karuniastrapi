'use strict';

// Helper function to convert month number to Roman numerals
const toRoman = (num) => {
  const romanNumerals = [
    '', 'I', 'II', 'III', 'IV', 'V', 'VI',
    'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
  ];
  return romanNumerals[num] || '';
};

// Helper function to generate SPK number
const generateSPKNumber = async (strapi) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const romanMonth = toRoman(month);

  try {
    // Count existing SPKs for this month/year
    const count = await strapi.query('api::spk.spk').count({
      where: {
        createdAt: {
          $gte: new Date(year, month - 1, 1), // Start of current month
          $lt: new Date(year, month, 1) // Start of next month
        }
      }
    });

    // Increment count for new SPK
    const nextNumber = count + 1;

    // Format: 001/SPK/X/2023
    const paddedNumber = String(nextNumber).padStart(3, '0');
    return `${paddedNumber}/SPK/${romanMonth}/${year}`;
  } catch (error) {
    console.error('Error generating SPK number:', error);
    // Fallback format with timestamp if error occurs
    const timestamp = Date.now();
    return `TMP/SPK/${romanMonth}/${year}`;
  }
};

module.exports = {
  beforeCreate: async (event) => {
    // Auto-generate SPK number if not provided
    if (!event.params.data.spkNumber) {
      const spkNumber = await generateSPKNumber(strapi);
      event.params.data.spkNumber = spkNumber;
    }
  },

  afterCreate: async (event) => {
    // Log successful creation
    console.log('SPK created:', event.result.spkNumber);
  },

  beforeUpdate: async (event) => {
    // Prevent SPK number modification
    if (event.params.data.spkNumber && event.params.data.spkNumber !== event.result.spkNumber) {
      throw new Error('SPK number cannot be modified after creation');
    }

    // Set isEditable to false if status is FINISH
    if (event.params.data.status === 'FINISH') {
      event.params.data.isEditable = false;
    }
  },

  afterUpdate: async (event) => {
    // Log status changes
    if (event.params.data.status) {
      console.log(`SPK ${event.result.spkNumber} status changed to: ${event.params.data.status}`);
    }
  },

  beforeDelete: async (event) => {
    // Add any pre-deletion logic if needed
  },

  afterDelete: async (event) => {
    // Log deletion
    console.log('SPK deleted:', event.result.spkNumber);
  }
};