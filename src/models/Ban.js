const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const KhuVuc = require('./KhuVuc');

const Ban = sequelize.define('Ban', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    ten: {
        field: 'ten',
        type: DataTypes.STRING,
        allowNull: false,
    },
    sucChua: {
        field: 'suc_chua',
        type: DataTypes.STRING,
        allowNull: false,
    },
    trangThai: {
        field: 'trang_thai',
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: '0',
    },
    idKhuVuc: {
        field: 'id_khu_vuc',
        type: DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    tableName: 'ban',
    timestamps: false,
})

Ban.belongsTo(KhuVuc, {foreignKey: 'idKhuVuc'})
KhuVuc.hasMany(Ban, {foreignKey: 'idKhuVuc', as: 'Bans'});

module.exports = Ban;