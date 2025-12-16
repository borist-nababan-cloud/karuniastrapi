/**
 * spk service
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreService('api::spk.spk', ({ strapi }) => ({
  // Helper function to convert month number to Roman numerals
  toRoman(num: number) {
    const romanNumerals = [
      '', 'I', 'II', 'III', 'IV', 'V', 'VI',
      'VII', 'VIII', 'IX', 'X', 'XI', 'XII'
    ];
    return romanNumerals[num] || '';
  },

  // Generate SPK number with format: 001/SPK/X/2023
  async generateSPKNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JavaScript months are 0-indexed
    const romanMonth = this.toRoman(month);

    try {
      // Get the entity manager service
      const entityManager = strapi.plugin('content-type').service('entity-manager');

      // Count existing SPKs for this month/year
      const spks = await entityManager.findMany('api::spk.spk', {
        filters: {
          createdAt: {
            $gte: new Date(year, month - 1, 1), // Start of current month
            $lt: new Date(year, month, 1) // Start of next month
          }
        }
      });

      const count = spks.length;

      // Increment count for new SPK
      const nextNumber = count + 1;

      // Format: 001/SPK/X/2023
      const paddedNumber = String(nextNumber).padStart(3, '0');
      const spkNumber = `${paddedNumber}/SPK/${romanMonth}/${year}`;

      return spkNumber;
    } catch (error) {
      // Fallback format with timestamp if error occurs
      const timestamp = Date.now();
      return `TMP/SPK/${romanMonth}/${year}/${timestamp}`;
    }
  }
}));