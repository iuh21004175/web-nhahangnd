const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LichSu = sequelize.define('LichSu', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    doiTuong: {
        field: 'doi_tuong',
        type: DataTypes.TEXT,
        allowNull: true
    },
}, {
    tableName: 'lich_su',
    timestamps: false
});

module.exports = LichSu;