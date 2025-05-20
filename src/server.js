require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport'); // Import passport từ config
const cookieParser = require('cookie-parser');
const path = require('path');
const socketIo = require('socket.io');
const { redis } = require('./config/redis')
const serviceSocketRedis  = require('./services/socketio-redis')
const http = require('http');
const app = express();
const customerRouter = require('./router/customer');
const manageRouter = require('./router/manage');
const serviceRouter = require('./router/service'); // Import router service
const authRouter = require('./router/auth'); // Import router auth
const apiRouter = require('./router/api');
const authorize = require('./services/googleApiAuth'); // Import hàm authorize từ googleApiAuth.js
const cron = require('node-cron');
const KhachHang = require('./models/KhachHang');
const CtrlThucDon = require('./controllers/CtrlThucDon');

app.get('/generate-qrcode/:idMon', CtrlThucDon.taoMaQR);
// Sử dụng cookie
app.use(cookieParser());
// Cấu hình session
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Cấu hình Express để phục vụ file tĩnh trong thư mục 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*'
    }
});
let gmailClient = null;
authorize()
  .then((client) => {
    gmailClient = client;
    console.log('✅ Gmail API authorized');
  })
  .catch(console.error);
serviceSocketRedis(io, redis)
// Lưu các thông tin vào request để sử dụng trong các router
app.use((req, res, next) => {
    req.io = io; // Gán io vào request để sử dụng trong các router
    req.authGoogle = gmailClient; // Gán hàm authorize vào request để sử dụng trong các router
    req.redis = redis; // Gán redis vào request 
    next();
})
// Cấu hình EJS
app.engine('html', require('ejs').renderFile); // Cho phép sử dụng file .html
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
  
  // Khởi tạo passport
app.use(passport.initialize());
app.use(passport.session());

app.use('/service', serviceRouter); // Đường dẫn cho router service
app.use('/api', apiRouter);
app.use('/manager', manageRouter);
app.use('/auth', authRouter); // Đường dẫn cho router auth
app.use('/', customerRouter); // Đường dẫn cho router khách hàng

app.use((req, res) => {
    res.status(404).render('404.html'); // Render trang 404 nếu không tìm thấy route
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
// Thiết lập chay hàng ngày
// Chạy vào 23:59:59 mỗi ngày
cron.schedule('59 59 23 * * *', async () => {
    await xoaTatCaKhachHangVangLai();
    console.log('Đã xóa tất cả khách hàng vãng lai lúc 23:59:59');
});

async function xoaTatCaKhachHangVangLai() {
    await KhachHang.deleteMany({ ten: /Khách vãng lai/ });
}