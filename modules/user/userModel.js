import { DataTypes } from 'sequelize';
import sequelize from '../../config/database.js';

const User = sequelize.define(
   'User', 
   {
      id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
      },
      username: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
      },
      email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: { isEmail: true }
      },
      password: {
          type: DataTypes.STRING,
          allowNull: false
      },
      fullName: {
          type: DataTypes.STRING,
          allowNull: true
      },
      bio: {
          type: DataTypes.STRING(255),
          allowNull: true
      },
      profilePicture: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: 'default-profile.png'
      },
      isBlocked: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      },
      isAdmin: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      },
role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false
}
   },
   {
      timestamps: true, 
      tableName: 'users'
   }
);

export default User;