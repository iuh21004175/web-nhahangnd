const Redis = require("ioredis");

// Cấu hình kết nối Redis chính
const redis = new Redis({ 
    host: "localhost", // Địa chỉ Redis server
    port: 6379, 
    retryStrategy: (times) => {
        // Thử kết nối lại sau mỗi 1 giây, tối đa là 3 giây.
        return Math.min(times * 1000, 3000);
    },
    reconnectOnError: (err) => {
        // Log lỗi khi có sự cố kết nối
        console.log('Redis error:', err);
        console.log('Redis connection lost. Attempting to reconnect...');
        return true; // Trả về true để tự động kết nối lại
    }
});

// Cấu hình Redis Subscriber để lắng nghe tin nhắn
const subscriber = new Redis({
    host: "localhost", // Địa chỉ Redis server
    port: 6379,
    retryStrategy: (times) => {
        // Tương tự như trên, thử kết nối lại với Redis Subscriber
        return Math.min(times * 1000, 3000);
    },
    reconnectOnError: (err) => {
        // Log lỗi khi Redis Subscriber gặp sự cố kết nối
        console.log('Redis subscriber error:', err);
        console.log('Redis subscriber connection lost. Attempting to reconnect...');
        return true;
    }
});

console.log("✅ Redis đã kết nối");

module.exports = { redis, subscriber };
