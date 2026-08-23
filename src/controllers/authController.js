import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Registration } from '../models/Registration.js';
import { Op } from 'sequelize';

// In-memory token cache fallback for offline/test DB environments
const inMemoryTokenCache = new Map();

export const userLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    let user = null;
    try {
      user = await Registration.findOne({ where: { email: trimmedEmail } });
    } catch (dbErr) {
      console.warn('⚠️ DB read error during user login:', dbErr.message);
    }

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Player';

    const tokenPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      footPreference: user.footPreference,
      paymentStatus: user.paymentStatus,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'touches_secret_key_jwt_2026_secure',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        footPreference: user.footPreference,
        country: user.country,
        paymentStatus: user.paymentStatus || 'unpaid',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const generateLoginToken = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const loginToken = crypto.randomBytes(24).toString('hex');
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let updated = false;
    try {
      await Registration.update(
        { loginToken, loginTokenExpiry: expiry },
        { where: { id: userId } }
      );
      updated = true;
    } catch (err) {
      console.warn('⚠️ DB update for loginToken failed, falling back to memory cache:', err.message);
    }

    // Save in memory cache as backup
    inMemoryTokenCache.set(loginToken, { userId, expiry });

    const externalAppUrl = process.env.EXTERNAL_APP_URL || 'http://localhost:5175';
    const targetUrl = `${externalAppUrl}?login_token=${loginToken}`;

    return res.json({
      success: true,
      token: loginToken,
      url: targetUrl,
      expiresAt: expiry.toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const verifyLoginToken = async (req, res, next) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid or missing token' });
    }

    let user = null;

    // Check DB first
    try {
      user = await Registration.findOne({
        where: {
          loginToken: token,
          loginTokenExpiry: { [Op.gt]: new Date() },
        },
      });
    } catch (err) {
      console.warn('⚠️ DB search for loginToken error:', err.message);
    }

    // Fallback to memory cache
    if (!user && inMemoryTokenCache.has(token)) {
      const cached = inMemoryTokenCache.get(token);
      if (cached && cached.expiry > new Date()) {
        try {
          user = await Registration.findByPk(cached.userId);
        } catch {
          user = null;
        }
      }
      inMemoryTokenCache.delete(token); // One-time use
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired login token',
      });
    }

    // Clear DB token (one-time use)
    try {
      user.loginToken = null;
      user.loginTokenExpiry = null;
      await user.save();
    } catch (err) {
      console.warn('⚠️ Could not clear loginToken in DB:', err.message);
    }

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Player';

    const tokenPayload = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      footPreference: user.footPreference,
      paymentStatus: user.paymentStatus,
    };

    const sessionToken = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'touches_secret_key_jwt_2026_secure',
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token: sessionToken,
      user: {
        id: user.id,
        name: fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        footPreference: user.footPreference,
        country: user.country,
        paymentStatus: user.paymentStatus || 'unpaid',
      },
    });
  } catch (error) {
    next(error);
  }
};
