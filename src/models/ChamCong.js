const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NhanVien = require('./NhanVien');

const ChamCong = sequelize.define('ChamCong', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idNhanVien: {
        field: 'id_nhan_vien',
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ngay: {
        field: 'ngay',
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tuan: {
        field: 'tuan',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    caLamViec: {
        field: 'ca_lam_viec',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    checkIn: {
        field: 'check_in',
        type: DataTypes.DATE,
        allowNull: true
    },
    checkOut: {
        field: 'check_out',
        type: DataTypes.DATE,
        allowNull: true
    },
    trangThai: {
        field: 'trang_thai',
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'cham_cong',
    timestamps: true,
    underscored: true
});


ChamCong.belongsTo(NhanVien, { foreignKey: 'idNhanVien' });
NhanVien.hasMany(ChamCong, { foreignKey: 'idNhanVien' });

module.exports = ChamCong;