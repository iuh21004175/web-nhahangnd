const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const HoiThoai = require('./HoiThoai');

const TinNhan = sequelize.define('TinNhan', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idHoiThoai: {
        field: 'id_hoi_thoai',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nguoiGui: {
        field: 'nguoi_gui',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    noiDung: {
        field: 'noi_dung',
        type: DataTypes.STRING,
        allowNull: false
    },
    thoiGianGui: {
        field: 'thoi_gian_gui',
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'tin_nhan',
    timestamps: false
});

TinNhan.belongsTo(HoiThoai, { foreignKey: 'idHoiThoai' });
HoiThoai.hasMany(TinNhan, { foreignKey: 'idHoiThoai' });

module.exports = TinNhan;