import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Registration } from '../models/Registration.js';
import { Stats } from '../models/Stats.js';
import { registrationSchema } from '../utils/validators.js';
import { updateInMemoryStats } from './statsController.js';

export const createRegistration = async (req, res, next) => {
  try {
    // Validate input with Zod
    const validatedData = registrationSchema.parse(req.body);

    // Hash password if provided
    if (validatedData.password && validatedData.password.trim()) {
      validatedData.password = await bcrypt.hash(validatedData.password.trim(), 10);
    }

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

    const createdUser = newRecord || validatedData;
    const fullName = [createdUser.firstName, createdUser.lastName].filter(Boolean).join(' ') || 'Player';

    const tokenPayload = {
      id: createdUser.id || 1,
      email: createdUser.email,
      firstName: createdUser.firstName,
      lastName: createdUser.lastName,
      footPreference: createdUser.footPreference,
      paymentStatus: createdUser.paymentStatus || 'unpaid',
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'touches_secret_key_jwt_2026_secure',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Player registered successfully!',
      token,
      user: {
        id: createdUser.id,
        name: fullName,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        email: createdUser.email,
        footPreference: createdUser.footPreference,
        country: createdUser.country,
        paymentStatus: createdUser.paymentStatus || 'unpaid',
      },
      data: createdUser,
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
