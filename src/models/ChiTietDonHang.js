const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const DonHang = require('./DonHang');
const MonAn = require('./MonAn');

const ChiTietDonHang = sequelize.define('ChiTietDonHang', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    idDonHang: {
        field: 'id_don_hang',
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    idMonAn: {
        field: 'id_mon_an',
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    soLuong: {
        field: 'so_luong',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gia: {
        field: 'gia',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ghiChu: {
        field: 'ghi_chu',
        type: DataTypes.TEXT,
        allowNull: true
    },
    trangThai: {
        field: 'trang_thai',
        type: DataTypes.INTEGER, // 0: Chờ đầu bếp nhận món, 1: Đang chế biến, 2: Đã hoàn thành, 3: Đã mang lên
        allowNull: false,
        defaultValue: 0
    },
    thoiGianCapNhat: {
        field: 'thoi_gian_cap_nhat',
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    idNhanVien: {
        field: 'id_nhan_vien',
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'chi_tiet_don_hang',
    timestamps: false
});

ChiTietDonHang.belongsTo(DonHang, { foreignKey: 'idDonHang' });
ChiTietDonHang.belongsTo(MonAn, { foreignKey: 'idMonAn' });
DonHang.hasMany(ChiTietDonHang, { foreignKey: 'idDonHang' });
MonAn.hasMany(ChiTietDonHang, { foreignKey: 'idMonAn' });

module.exports = ChiTietDonHang;
