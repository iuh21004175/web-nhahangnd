module.exports = (subscriber) => {
    subscriber.subscribe("tin-nhan-khach-hang", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    });
    subscriber.subscribe("tin-nhan-nha-hang", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    });
    subscriber.subscribe("phuc-vu-chon-hop-thoai", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    });
    subscriber.subscribe("khach-hang-online", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    })
    subscriber.subscribe("khach-hang-offline", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    })
    subscriber.subscribe("dang-cap-nhat-du-lieu-chat", (err, count) => {
        if (err) {
            console.error("Lỗi khi đăng ký kênh Redis:", err);
        } else {
            console.log(`Đã đăng ký kênh Redis: ${count}`);
        }
    });
}