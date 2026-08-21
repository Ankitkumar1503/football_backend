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
    footPreference: {
      type: DataTypes.ENUM('left', 'right'),
      allowNull: false,
    },
  },
  {
    tableName: 'registrations',
    timestamps: true,
  }
);
