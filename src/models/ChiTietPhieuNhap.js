const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PhieuNhap = require('./PhieuNhap');
const NguyenLieu = require('./NguyenLieu');

const ChiTietPhieuNhap = sequelize.define('ChiTietPhieuNhap', {
    idPhieu: {
        field: 'id_phieu',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    idNguyenLieu: {
        field: 'id_nguyen_lieu',
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
    hanSuDung: {
        field: 'han_su_dung',
        type: DataTypes.DATE,
        allowNull: false
    },
    ghiChu: {
        field: 'ghi_chu',
        type: DataTypes.TEXT,
        allowNull: true
    },
}, {
    tableName: 'chi_tiet_phieu_nhap',
    timestamps: false
});

ChiTietPhieuNhap.belongsTo(PhieuNhap, { foreignKey: 'idPhieu' });
PhieuNhap.hasMany(ChiTietPhieuNhap, { foreignKey: 'idPhieu' });

ChiTietPhieuNhap.belongsTo(NguyenLieu, { foreignKey: 'idNguyenLieu' });
NguyenLieu.hasMany(ChiTietPhieuNhap, { foreignKey: 'idNguyenLieu' });

module.exports = ChiTietPhieuNhap;