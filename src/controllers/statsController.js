import { Stats } from '../models/Stats.js';
import { Registration } from '../models/Registration.js';

let inMemoryStats = {
  total: 0,
  left: 0,
  right: 0,
  downloads: 312000,
  countries: 142,
};

export const getStats = async (req, res, next) => {
  try {
    let total = 0;
    let left = 0;
    let right = 0;
    let downloads = 312000;
    let countries = 142;

    try {
      // Calculate real counts directly from registrations table
      total = await Registration.count();
      left = await Registration.count({ where: { footPreference: 'left' } });
      right = await Registration.count({ where: { footPreference: 'right' } });

      const [statsRecord] = await Stats.findOrCreate({
        where: { id: 1 },
        defaults: {
          total: 0,
          leftCount: 0,
          rightCount: 0,
          downloads: 312000,
          countries: 142,
        },
      });

      if (statsRecord) {
        if (statsRecord.downloads) downloads = statsRecord.downloads;
        if (statsRecord.countries) countries = statsRecord.countries;
      }
    } catch (e) {
      console.warn('⚠️ DB query error in getStats, using in-memory registration count fallback:', e.message);
      total = inMemoryStats.total;
      left = inMemoryStats.left;
      right = inMemoryStats.right;
      downloads = inMemoryStats.downloads;
      countries = inMemoryStats.countries;
    }

    return res.json({
      success: true,
      data: {
        total,
        left,
        right,
        downloads,
        countries,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInMemoryStats = (footPreference) => {
  inMemoryStats.total += 1;
  inMemoryStats.downloads += 1;
  if (footPreference === 'left') {
    inMemoryStats.left += 1;
  } else {
    inMemoryStats.right += 1;
  }
};

