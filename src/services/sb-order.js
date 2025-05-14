module.exports = (subscriber) => {
    subscriber.subscribe("sepay-gui-webhook", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    });
    subscriber.subscribe("don-hang-tao-mon", (err, message) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${message}`);
        }
    });
    subscriber.subscribe("don-hang-cap-nhat-mon",  (err, message) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${message}`);
        }
    });
    subscriber.subscribe("don-hang-xoa-mon",  (err, message) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${message}`);
        }
    });
    subscriber.subscribe("dau-bep-nhan-mon",  (err, message) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${message}`);
        }
    });
    subscriber.subscribe("dau-bep-hoan-thanh-mon", (err, message) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${message}`);
        }
    });
    subscriber.subscribe("cap-nhat-trang-thai-ban", (err, message) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${message}`);
        }
    });
    subscriber.subscribe("phuc-vu-tao-don-hang", (err, message) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${message}`);
        }
    });
}    