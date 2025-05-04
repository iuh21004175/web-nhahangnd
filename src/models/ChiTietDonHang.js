const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const DonHang = require('./DonHang');
const MonAn = require('./MonAn');

const ChiTietDonHang = sequelize.define('ChiTietDonHang', {
    idDonHang: {
        field: 'id_don_hang',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    idMonAn: {
        field: 'id_mon_an',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
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
