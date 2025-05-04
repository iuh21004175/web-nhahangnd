const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const moment = require('moment-timezone');

const KhachHang = sequelize.define('KhachHang', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ten: {
        field: 'ten',
        type: DataTypes.STRING,
        allowNull: true
    },
    gioiTinh: {
        field: 'gioi_tinh',
        type: DataTypes.INTEGER,
        allowNull: true
    },
    ngaySinh: {
        field: 'ngay_sinh',
        type: DataTypes.DATE,
        allowNull: true
    },
    soDienThoai: {
        field: 'so_dien_thoai',
        type: DataTypes.STRING
    },
    soDaXacThuc: {
        field: 'so_da_xac_thuc',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    diaChi: {
        field: 'dia_chi',
        type: DataTypes.TEXT,
        allowNull: true
    },
    tenDangNhap: {
        field: 'ten_dang_nhap',
        type: DataTypes.STRING,
        allowNull: true // Có thể null nếu đăng nhập bằng Google/Facebook
    },
    matKhau: {
        field: 'mat_khau',
        type: DataTypes.STRING,
        allowNull: true // Có thể null nếu dùng Google/Facebook
    },
    email: {
        field: 'email',
        type: DataTypes.STRING,
        allowNull: true,
    },
    emailDaXacThuc: {
        field: 'email_da_xac_thuc',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    provider: {
        field: 'provider',
        type: DataTypes.STRING,
        allowNull: true // null | 'google' | 'facebook'
    },
    providerId: {
        field: 'provider_id',
        type: DataTypes.STRING,
        allowNull: true
    },
    hoatDong: {
        field: 'hoat_dong',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    hinhAnh: {
        field: 'hinh_anh',
        type: DataTypes.STRING,
        allowNull: true
    },
    createAt: {
        field: 'create_at',
        type: DataTypes.DATE,
        defaultValue: () => moment().tz('Asia/Ho_Chi_Minh').toDate()
    }
}, {
    tableName: 'khach_hang',
    timestamps: false
});

module.exports = KhachHang;