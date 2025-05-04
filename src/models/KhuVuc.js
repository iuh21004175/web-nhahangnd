const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhuVuc = sequelize.define('KhuVuc', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    tenKhuVuc: {
        field: 'ten_khu_vuc',
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'khu_vuc',
    timestamps: false
})

module.exports = KhuVuc