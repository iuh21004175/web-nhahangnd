const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaXacThucEmail = sequelize.define('MaXacThucEmail', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        field: 'email',
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    maXacThuc: {
        field: 'ma_xac_thuc',
        type: DataTypes.STRING,
        allowNull: false
    },
    thoiGianHetHan: {
        field: 'thoi_gian_het_han',
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'ma_xac_thuc_email',
    timestamps: false
})

module.exports = MaXacThucEmail;