/**
 * Được tạo bởi duongdx vào ngày 30/4/18.
 * Module này được sử dụng để gửi tin nhắn SMS bằng API SpeedSMS.
 */

let http = require('http'); // Import module HTTP (không được sử dụng trong đoạn mã này).
let https = require('https'); // Import module HTTPS để thực hiện các yêu cầu bảo mật.
const ACCESS_TOKEN = "MkKdIyCXfGgvNL0kNGVwgKdv8Rn_RpV4"; // Mã truy cập API để xác thực.

/**
 * Hàm gửi tin nhắn SMS.
 * @param {Array} phones - Mảng số điện thoại để gửi tin nhắn SMS.
 * @param {string} content - Nội dung tin nhắn SMS.
 * @param {number} type - Loại tin nhắn SMS (ví dụ: 2 là SMS thương hiệu).
 * @param {string} sender - Tên hoặc số điện thoại người gửi (nếu có).
 * sms_type có các giá trị như sau:
    2: tin nhắn gửi bằng đầu số ngẫu nhiên
    3: tin nhắn gửi bằng brandname
    4: tin nhắn gửi bằng brandname mặc định (Verify hoặc Notify)
    5: tin nhắn gửi bằng app android
 */
const sendSMS = function(phones, content, type = 5, sender = 'a9aaf5adf1d1cda0') {
    let url = 'api.speedsms.vn'; // URL cơ bản của API SpeedSMS.

    // Chuẩn bị payload yêu cầu dưới dạng chuỗi JSON.
    let params = JSON.stringify({
        to: phones,
        content: content,
        sms_type: type,
        sender: sender
    });

    // Mã hóa mã truy cập để sử dụng Basic Authentication.
    let buf = Buffer.from(ACCESS_TOKEN + ':x');
    let auth = "Basic " + buf.toString('base64');

    // Định nghĩa các tùy chọn cho yêu cầu HTTPS.
    const options = {
        hostname: url,
        port: 443, // Cổng HTTPS.
        path: '/index.php/sms/send', // Endpoint API để gửi tin nhắn SMS.
        method: 'POST', // Phương thức HTTP.
        headers: {
            'Content-Type': 'application/json', // Xác định kiểu nội dung là JSON.
            'Authorization': auth // Bao gồm header Basic Authentication.
        }
    };

    // Tạo yêu cầu HTTPS.
    const req = https.request(options, function(res) {
        res.setEncoding('utf8'); // Đặt mã hóa phản hồi là UTF-8.
        let body = ''; // Biến để tích lũy nội dung phản hồi.

        // Lắng nghe các đoạn dữ liệu trong phản hồi.
        res.on('data', function(d) {
            body += d;
        });

        // Xử lý khi phản hồi kết thúc.
        res.on('end', function() {
            try {
                let json = JSON.parse(body); // Phân tích phản hồi JSON.
                if (json.status == 'success') {
                    console.log("Gửi SMS thành công");
                } else {
                    console.error("Gửi SMS thất bại: " + body);
                }
            } catch (error) {
                console.error("Phân tích phản hồi thất bại: " + error.message);
            }
        });
    });

    // Xử lý lỗi trong yêu cầu.
    req.on('error', function(e) {
        console.error("Gửi SMS thất bại: " + e.message);
    });

    // Ghi payload yêu cầu và kết thúc yêu cầu.
    req.write(params);
    req.end();
};
module.exports = sendSMS; // Xuất hàm sendSMS để sử dụng ở nơi khác trong ứng dụng.
// Ví dụ sử dụng: Bỏ comment dòng dưới để kiểm tra hàm.
// sendSMS(['số điện thoại của bạn'], "Nội dung SMS kiểm tra", 2, '');