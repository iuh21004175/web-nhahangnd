const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const PhieuNhap = require('./PhieuNhap');
const NguyenLieu = require('./NguyenLieu');

const Kho = sequelize.define('Kho', {
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
    }
}, {
    tableName: 'kho',
    timestamps: false
});

Kho.belongsTo(PhieuNhap, { foreignKey: 'idPhieu' });
PhieuNhap.hasMany(Kho, { foreignKey: 'idPhieu' });

Kho.belongsTo(NguyenLieu, { foreignKey: 'idNguyenLieu' });
NguyenLieu.hasMany(Kho, { foreignKey: 'idNguyenLieu' });

module.exports = Kho;