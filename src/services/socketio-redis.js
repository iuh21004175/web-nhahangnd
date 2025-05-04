const { subscriber } = require("../config/redis");
const lschatService = require('./ls-chat');
const lrchatService = require('./lr-chat')
const sbchatService = require('./sb-chat')
const lrorderService = require('./lr-order')
const sborderService = require('./sb-order')
module.exports = (io, redis) => {
    io.on("connection", (socket) => {
        lschatService(socket, redis)
    });
    // Lắng nghe redis và gửi socket
    lrchatService(io, subscriber)
    lrorderService(io, subscriber)

    
    // Đăng ký kênh Redis để nhận tin nhắn từ khách hàng
    sbchatService(subscriber)
    // Đăng ký kênh Redis để nhận tin nhắn liên quan đến đơn hàng
    sborderService(subscriber)
}