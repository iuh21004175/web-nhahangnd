document.addEventListener('DOMContentLoaded', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    const socket = io(); // Địa chỉ server Socket.io
    socket.on('connect', () => {
        console.log('Kết nối thành công với Socket.io!');
        socket.on(`don-hang-${orderId}-da-thanh-toan`, (data) => {
          // Ẩn khung thanh toán, hiện thông báo thành công
            document.getElementById('checkout_box').style.display = 'none';
            document.getElementById('success_pay_box').style.display = 'block';
            document.getElementById('btnBlack').href = '/';
            document.getElementById('btnBlack').innerHTML = 'Về trang chủ';
        });
    });
    setInterval(updateCountdown, 1000);
    let cart = JSON.parse(localStorage.getItem('gioHang')) || [];
    if (cart.length > 0) {
        let tongGia = 0;
        const phiDichVu = 0;

        cart.forEach(item => {
            tongGia += item.price * item.quantity;
        });

        let tongTien = tongGia + phiDichVu;

        // Cập nhật nội dung số tiền
        const soTienDiv = document.getElementById('soTien');
        if (soTienDiv) {
            soTienDiv.textContent = tongTien.toLocaleString('vi-VN') + 'đ';
        }

        // Lấy id đơn hàng từ URL
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id'); // Lấy giá trị của tham số 'id' trong URL

        // Kiểm tra xem có id không, nếu không thì dùng mặc định '12345'
        const orderDescription = orderId ? `DH${orderId}` : 'DH12345';

        // Tạo URL QR mới có amount và id đơn hàng
        const qrImg = document.getElementById('qrImage');
        if (qrImg) {
            const amountParam = tongTien;
            const newQRUrl = `https://qr.sepay.vn/img?bank=TPBank&acc=10001198354&template=compact&amount=${amountParam}&des=${orderDescription}`;
            qrImg.src = newQRUrl;
        }
    }
    
});
function updateCountdown() {
    let secondsLeft = 300;
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = secondsLeft % 60;
      countdownEl.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    secondsLeft--;

    if (secondsLeft < 0) {
      //alert('Đã hết thời gian chờ thanh toán. Bạn sẽ được chuyển về trang chủ.');
      window.location.href = '/';
    }
}