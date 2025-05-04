const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DanhMucNguyenLieu = sequelize.define('DanhMucNguyenLieu', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    tenDanhMuc: {
        field: 'ten_danh_muc',
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'danh_muc_nguyen_lieu',
    timestamps: false
});

module.exports = DanhMucNguyenLieu;