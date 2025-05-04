const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DanhMucMonAn = sequelize.define('DanhMucMonAn', {
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
    tableName: 'danh_muc_mon_an',
    timestamps: false
});

module.exports = DanhMucMonAn;