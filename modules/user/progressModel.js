import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Progress = sequelize.define('Progress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    podcastId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    currentTime: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'progresses'
});

export default Progress;