const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const NhaCungCap = sequelize.define('NhaCungCap', {
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
    soDienThoai: {
        field: 'so_dien_thoai',
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        field: 'email',
        type: DataTypes.STRING,
        allowNull: true
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
}, {
    tableName: 'nha_cung_cap',
    timestamps: false
});

module.exports = NhaCungCap;