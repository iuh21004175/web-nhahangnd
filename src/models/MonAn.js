const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const DanhMucMonAn = require('./DanhMucMonAn');

const MonAn = sequelize.define('MonAn', {
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
    gia: {
        field: 'gia',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    moTa: {
        field: 'mo_ta',
        type: DataTypes.TEXT,
        allowNull: false
    },
    hinhAnh: {
        field: 'hinh_anh',
        type: DataTypes.TEXT,
        allowNull: true
    },
    idDanhMuc: {
        field: 'id_danh_muc',
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    tableName: 'mon_an',
    timestamps: false
});
MonAn.belongsTo(DanhMucMonAn, { foreignKey: 'idDanhMuc' });
DanhMucMonAn.hasMany(MonAn, { foreignKey: 'idDanhMuc' });



module.exports = MonAn;