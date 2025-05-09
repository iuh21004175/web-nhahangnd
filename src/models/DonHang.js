const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const KhachHang = require('./KhachHang');
const NhanVien = require('./NhanVien');
const Ban = require('./Ban');

const DonHang = sequelize.define('DonHang', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    idKhachHang: {
        field: 'id_khach_hang',
        type: DataTypes.INTEGER,
        allowNull: true
    },
    idNhanVien: {
        field: 'id_nhan_vien',
        type: DataTypes.INTEGER,
        allowNull: true
    },
    idBan: {
        field: 'id_ban',
        type: DataTypes.INTEGER,
        allowNull: true
    },
    thoiGianGhi: {
        field: 'thoi_gian_ghi',
        type: DataTypes.STRING,
        allowNull: false,
    },
    hinhThuc: {
        field: 'hinh_thuc',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    diaChi: {
        field: 'dia_chi',
        type: DataTypes.TEXT,
        allowNull: true
    },
    trangThai: {
        field: 'trang_thai',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tongTien: {
        field: 'tong_tien',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    thanhToan: {
        field: 'thanh_toan',
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'don_hang',
    timestamps: false
});

DonHang.belongsTo(KhachHang, { foreignKey: 'idKhachHang' });
DonHang.belongsTo(NhanVien, { foreignKey: 'idNhanVien' });
DonHang.belongsTo(Ban, { foreignKey: 'idBan' });
KhachHang.hasMany(DonHang, { foreignKey: 'idKhachHang' });
NhanVien.hasMany(DonHang, { foreignKey: 'idNhanVien' });
Ban.hasMany(DonHang, { foreignKey: 'idBan' });

module.exports = DonHang;
