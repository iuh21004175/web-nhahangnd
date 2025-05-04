const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaXacThuc = sequelize.define('MaXacThuc', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    soDienThoai: {
        field: 'so_dien_thoai',
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    maXacThuc: {
        field: 'ma_xac_thuc',
        type: DataTypes.STRING,
        allowNull: false
    },
    thoiGianHetHan: {
        field: 'thoi_gian_het_han',
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'ma_xac_thuc',
    timestamps: false
})

module.exports = MaXacThuc;