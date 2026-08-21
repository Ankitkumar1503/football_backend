import { Registration } from '../models/Registration.js';
import { Stats } from '../models/Stats.js';
import { registrationSchema } from '../utils/validators.js';
import { updateInMemoryStats } from './statsController.js';

export const createRegistration = async (req, res, next) => {
  try {
    // Validate input with Zod
    const validatedData = registrationSchema.parse(req.body);

    let newRecord = null;
    try {
      newRecord = await Registration.create(validatedData);

      // Update DB stats
      const [statsRecord] = await Stats.findOrCreate({
        where: { id: 1 },
        defaults: {
          total: 342891,
          leftCount: 131670,
          rightCount: 211221,
          downloads: 312000,
          countries: 142,
        },
      });

      statsRecord.total += 1;
      statsRecord.downloads += 1;
      if (validatedData.footPreference === 'left') {
        statsRecord.leftCount += 1;
      } else {
        statsRecord.rightCount += 1;
      }
      await statsRecord.save();
    } catch (dbErr) {
      // In-memory fallback if MySQL not running
      updateInMemoryStats(validatedData.footPreference);
    }

    return res.status(201).json({
      success: true,
      message: 'Player registered successfully!',
      data: newRecord || validatedData,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    next(error);
  }
};

export const getRegistrations = async (req, res, next) => {
  try {
    let list = [];
    try {
      list = await Registration.findAll({
        limit: 50,
        order: [['createdAt', 'DESC']],
      });
    } catch (e) {
      list = [];
    }

    return res.json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};
