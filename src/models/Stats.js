import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Stats = sequelize.define(
  'Stats',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    total: {
      type: DataTypes.INTEGER,
      defaultValue: 342891,
    },
    leftCount: {
      type: DataTypes.INTEGER,
      defaultValue: 131670,
    },
    rightCount: {
      type: DataTypes.INTEGER,
      defaultValue: 211221,
    },
    downloads: {
      type: DataTypes.INTEGER,
      defaultValue: 312000,
    },
    countries: {
      type: DataTypes.INTEGER,
      defaultValue: 142,
    },
  },
  {
    tableName: 'stats',
    timestamps: true,
  }
);
