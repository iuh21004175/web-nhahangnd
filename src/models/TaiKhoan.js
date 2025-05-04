const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NhanVien = require('./NhanVien');

const TaiKhoan = sequelize.define('TaiKhoan', {
    tenDangNhap: {
        field: 'ten_dang_nhap',
        type: DataTypes.STRING,
        primaryKey: true
    },
    matKhau: {
        field: 'mat_khau',
        type: DataTypes.TEXT,
        allowNull: false
    },
    trangThai: {
        field: 'trang_thai',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    idNhanVien: {
        field: 'id_nhan_vien',
        type: DataTypes.INTEGER,
        allowNull: true
    }
 
}, {
    tableName: 'tai_khoan',
    timestamps: false
});

// Thiết lập mối quan hệ
TaiKhoan.belongsTo(NhanVien, { foreignKey: 'idNhanVien' });
NhanVien.hasOne(TaiKhoan, { foreignKey: 'idNhanVien' });

module.exports = TaiKhoan;