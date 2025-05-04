const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NhanVien = require('./NhanVien');

const PhieuXuat = sequelize.define('PhieuXuat', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    thoiGianXuat: {
        field: 'thoi_gian_xuat',
        type: DataTypes.DATE,
        allowNull: false
    },
    lyDo:{
        field: 'ly_do',
        type: DataTypes.STRING,
        allowNull: false
    },
    tongTien: {
        field: 'tong_tien',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    idNhanVien: {
        field: 'id_nhan_vien',
        type: DataTypes.INTEGER,
        allowNull: true
    },
}, {
    tableName: 'phieu_xuat',
    timestamps: false
});

PhieuXuat.belongsTo(NhanVien, { foreignKey: 'idNhanVien' });
NhanVien.hasMany(PhieuXuat, { foreignKey: 'idNhanVien' });

module.exports = PhieuXuat;