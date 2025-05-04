const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PhieuNhap = sequelize.define('PhieuNhap', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    thoiGianNhap: {
        field: 'thoi_gian_nhap',
        type: DataTypes.DATE,
        allowNull: false
    },
    tongTien: {
        field: 'tong_tien',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'phieu_nhap',
    timestamps: false
});

module.exports = PhieuNhap;