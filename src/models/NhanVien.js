const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NhanVien = sequelize.define('NhanVien', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ten: {
        field: 'ten',
        type: DataTypes.STRING,
        allowNull: false
    },
    gioiTinh:{
        field: 'gioi_tinh',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ngaySinh:{
        field: 'ngay_sinh',
        type: DataTypes.DATE,
        allowNull: false
    },
    soDienThoai: {
        field: 'so_dien_thoai',
        type: DataTypes.STRING,
        allowNull: false
    },
    diaChi: {
        field: 'dia_chi',
        type: DataTypes.TEXT,
        allowNull: false
    },
    hinhAnh: {
        field: 'hinh_anh',
        type: DataTypes.TEXT,
        allowNull: true
    },
    chucVu: {
        field: 'chuc_vu',
        type: DataTypes.STRING,
        allowNull: false
    },
    trangThai: {
        field: 'trang_thai',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    ngayBatDau: {
        field: 'ngay_bat_dau',
        type: DataTypes.DATE,
        allowNull: false
    },
}, {
    tableName: 'nhan_vien',
    timestamps: false
});
module.exports = NhanVien;