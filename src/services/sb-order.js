module.exports = (subscriber) => {
    subscriber.subscribe("sepay-gui-webhook", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    });
}    