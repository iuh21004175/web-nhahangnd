const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const ChamCong = require('./ChamCong'); 

const HeSoLuong = sequelize.define('HeSoLuong', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    ngay: {
        field: 'ngay',
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    heSo: {
        field: 'he_so',
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 1.00
    },
    ghiChu: {
        field: 'ghi_chu',
        type: DataTypes.STRING(255),
        allowNull: true
    },
    idChamCong: {
        field: 'id_cham_cong',
        type: DataTypes.BIGINT,
        allowNull: true
    }
}, {
    tableName: 'he_so_luong',
    timestamps: false,  
    underscored: true   
});

HeSoLuong.hasMany(ChamCong, { foreignKey: 'id' });
ChamCong.belongsTo(HeSoLuong, { foreignKey: 'id' });

module.exports = HeSoLuong;
