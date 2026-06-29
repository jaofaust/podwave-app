import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const Podcast = sequelize.define('Podcast', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // Ajustado para mapear corretamente a coluna existente no banco
    coverUrl: { 
        type: DataTypes.STRING, 
        field: 'cover_image' // Mapeia para a coluna 'cover_image' que já existe no seu MariaDB
    },
    audioUrl: { 
        type: DataTypes.STRING, 
        allowNull: false,
        field: 'audio_url' // Mapeia para a coluna 'audio_url' que já existe no seu MariaDB
    }
}, {
    timestamps: true,
    tableName: 'podcasts'
});

export default Podcast;