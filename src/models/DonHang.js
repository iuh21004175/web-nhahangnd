const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const KhachHang = require('./KhachHang');
const NhanVien = require('./NhanVien');
const Ban = require('./Ban');
const LichSu = require('./LichSu');

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
    soDienThoaiNhan: {
        field: 'so_dien_thoai_nhan',
        type: DataTypes.STRING,
        allowNull: true
    },
    idLichSu: {
        field: 'id_lich_su',
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
    phiVanChuyen: {
        field: 'phi_van_chuyen',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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

DonHang.belongsTo(Ban, { foreignKey: 'idBan' });
DonHang.belongsTo(LichSu, { foreignKey: 'idLichSu' });

KhachHang.hasMany(DonHang, { foreignKey: 'idKhachHang' });
Ban.hasMany(DonHang, { foreignKey: 'idBan' });
LichSu.hasMany(DonHang, { foreignKey: 'idLichSu' });

module.exports = DonHang;
