import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Registration = sequelize.define(
  'Registration',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    footPreference: {
      type: DataTypes.ENUM('left', 'right'),
      allowNull: false,
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'paid'),
      allowNull: false,
      defaultValue: 'unpaid',
    },
    paymentAmount: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    stripeSessionId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loginToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loginTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'registrations',
    timestamps: true,
  }
);
