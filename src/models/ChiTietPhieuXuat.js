const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PhieuXuat = require('./PhieuXuat');
const ChiTietPhieuNhap = require('./ChiTietPhieuNhap');
const ChiTietPhieuXuat = sequelize.define('ChiTietPhieuXuat', {
    idPhieuNhap: {
        field: 'id_phieu_nhap',
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    idPhieuXuat: {
        field: 'id_phieu_xuat',
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    idNguyenLieu: {
        field: 'id_nguyen_lieu',
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    soLuong: {
        field: 'so_luong',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ghiChu: {
        field: 'ghi_chu',
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'chi_tiet_phieu_xuat',
    timestamps: false
});

ChiTietPhieuXuat.belongsTo(PhieuXuat, { foreignKey: 'idPhieuXuat' });
PhieuXuat.hasMany(ChiTietPhieuXuat, { foreignKey: 'idPhieuXuat' });

ChiTietPhieuXuat.belongsTo(ChiTietPhieuNhap, { foreignKey: 'idPhieuNhap' });
ChiTietPhieuNhap.hasMany(ChiTietPhieuXuat, { foreignKey: 'idPhieuNhap' });

ChiTietPhieuXuat.belongsTo(ChiTietPhieuNhap, { foreignKey: 'idNguyenLieu' });
ChiTietPhieuNhap.hasMany(ChiTietPhieuXuat, { foreignKey: 'idNguyenLieu' });

module.exports = ChiTietPhieuXuat;