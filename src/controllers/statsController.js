import { Stats } from '../models/Stats.js';

let inMemoryStats = {
  total: 342891,
  left: 131670,
  right: 211221,
  downloads: 312000,
  countries: 142,
};

export const getStats = async (req, res, next) => {
  try {
    let statsRecord;
    try {
      statsRecord = await Stats.findByPk(1);
    } catch (e) {
      // Database not available, use in-memory state
    }

    if (statsRecord) {
      return res.json({
        success: true,
        data: {
          total: statsRecord.total,
          left: statsRecord.leftCount,
          right: statsRecord.rightCount,
          downloads: statsRecord.downloads,
          countries: statsRecord.countries,
        },
      });
    }

    return res.json({
      success: true,
      data: inMemoryStats,
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
