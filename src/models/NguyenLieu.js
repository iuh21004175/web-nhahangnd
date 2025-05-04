const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NhaCungCap = require('./NhaCungCap');
const DanhMucNguyenLieu = require('./DanhMucNguyenLieu');

const NguyenLieu = sequelize.define('NguyenLieu', {
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
    donVi: {
        field: 'don_vi',
        type: DataTypes.STRING,
        allowNull: false
    },
    tonKho: {
        field: 'ton_kho',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    toiThieu: {
        field: 'toi_thieu',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    hinhAnh: {
        field: 'hinh_anh',
        type: DataTypes.TEXT,
        allowNull: true
    },
    idNhaCungCap: {
        field: 'id_nha_cung_cap',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    idDanhMuc: {
        field: 'id_danh_muc',
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    tableName: 'nguyen_lieu',
    timestamps: false
});

NguyenLieu.belongsTo(NhaCungCap, { foreignKey: 'idNhaCungCap' });
NhaCungCap.hasMany(NguyenLieu, { foreignKey: 'idNhaCungCap' });
NguyenLieu.belongsTo(DanhMucNguyenLieu, { foreignKey: 'idDanhMuc' });
DanhMucNguyenLieu.hasMany(NguyenLieu, { foreignKey: 'idDanhMuc' });
module.exports = NguyenLieu;