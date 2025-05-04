const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  timezone: '+07:00', // Thiết lập múi giờ Việt Nam
  port: process.env.DB_PORT || 3306,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
});

// Kiểm tra kết nối database
sequelize.authenticate()
  .then(() => console.log('✅ Kết nối MySQL thành công!'))
  .catch(err => console.error('❌ Lỗi kết nối MySQL:', err));

module.exports = sequelize;