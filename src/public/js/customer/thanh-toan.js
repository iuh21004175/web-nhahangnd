document.addEventListener('DOMContentLoaded', async function () {
    
    let thongTinKhachHang = await getAPIThongTinKhachHang();
    thaoTacThongTinKhachHang(thongTinKhachHang);

    const cartItemsContainer = document.getElementById('cartSummary');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    let cart = JSON.parse(localStorage.getItem('gioHang')) || [];

    // Xóa nội dung cũ
    cartItemsContainer.innerHTML = '';

    if (cart.length > 0) {
        let tongTien = 0;
        const phiDichVu = 0;

        // 1. Hiển thị từng món ăn
        cart.forEach(item => {
            const tongGia = item.price * item.quantity;
            tongTien += tongGia;

            const itemHTML = `
                <div class="cart-item d-flex align-items-center mb-3">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image me-3 rounded" width="60" height="60">
                    <div class="cart-item-details flex-grow-1">
                        <h6 class="cart-item-title mb-1">${item.name}</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted">${item.quantity} x ${item.price.toLocaleString('vi-VN')}₫</span>
                            <span class="cart-item-price text-primary">${tongGia.toLocaleString('vi-VN')}₫</span>
                        </div>
                    </div>
                </div>
            `;

            cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        // 2. Hiển thị phần tổng kết đơn hàng
        const htmlTongKet = `
            <div class="cart-summary border-top pt-3 mt-2">
                <div class="d-flex justify-content-between mb-2">
                    <span>Tạm tính:</span>
                    <span id="subTotal">${tongTien.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Phí dịch vụ:</span>
                    <span id="serviceCharge">${phiDichVu.toLocaleString('vi-VN')} ₫</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between mb-0 fw-bold fs-5">
                    <span>Tổng cộng:</span>
                    <span class="text-primary" id="totalAmount">${(tongTien+phiDichVu).toLocaleString('vi-VN')} ₫</span>
                </div>
            </div>
        `;

        cartItemsContainer.insertAdjacentHTML('beforeend', htmlTongKet);
        emptyCartMessage.style.display = 'none';
    } else {
        emptyCartMessage.style.display = 'block';
    }
    const phoneRegex = /^(0[3-9][0-9]{8})$/;


    document.getElementById('addOrder').addEventListener('click', async function (e) {
        e.preventDefault();

        const fullName = document.getElementById('fullNameTT').value.trim();
        const phone = document.getElementById('phoneTT').value.trim();
        const profileStreet = document.getElementById('profileStreet');
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const gioHang = JSON.parse(localStorage.getItem('gioHang')) || [];
        const trangThai = 1; // Đặt thành công
        const tongTien = document.getElementById('totalAmount').innerText.replace(/\./g, '').replace('₫', '').trim();
        const hinhThuc = 1; // Đặt hàng online
        const phiVanChuyen = document.getElementById('serviceCharge').innerText.replace(/\./g, '').replace('₫', '').trim();

        // Kiểm tra các trường bắt buộc
        if (!fullName || !phone || !profileStreet.value.trim()) {
            alert('Vui lòng nhập đầy đủ thông tin: Họ tên, Số điện thoại và Địa chỉ!');
            return;
        }
        
        // Kiểm tra số điện thoại có hợp lệ không
        if (phone === '') {
            // Nếu số điện thoại trống
            document.getElementById('phoneTT').classList.add('is-invalid');  // Thêm class 'is-invalid'
            document.querySelector('#phoneTT + .invalid-feedback').innerText = 'Vui lòng nhập số điện thoại!';
            return;
        } else if (!phoneRegex.test(phone)) {
            // Nếu số điện thoại không hợp lệ
            document.getElementById('phoneTT').classList.add('is-invalid');  // Thêm class 'is-invalid'
            document.querySelector('#phoneTT + .invalid-feedback').innerText = 'Số điện thoại không hợp lệ! Vui lòng nhập lại.';
            return;
        } else {
            document.getElementById('phoneTT').classList.remove('is-invalid');  // Xóa class 'is-invalid' nếu hợp lệ
        }

        // Kiểm tra rỗng giỏ hàng
        if(gioHang.length === 0){
            alert('Giỏ hàng trống! Vui lòng chọn món ăn trước khi đặt hàng.');
            return;
        }
        // Kiểm tra địa chỉ
        if (profileStreet.value.trim() === '') {
            alert('Vui lòng nhập địa chỉ!');
            return;
        }
        // Kiểm tra tọa độ
        if (profileStreet.dataset.lat === '' || profileStreet.dataset.lng === '') {
            alert('Vui lòng chọn địa chỉ từ danh sách gợi ý!');
            return;
        }
        // Kiểm tra khoản cách phải dưới 10 km
        const toaDoCuaHang = {
            lat: 10.8218176127217,
            lng: 106.687322712388
        }
        const diaChi = {
            address: profileStreet.value,
            level_2: profileStreet.dataset.level2,
            level_3: profileStreet.dataset.level3,
            level_4: profileStreet.dataset.level4,
            location: {
                lat: profileStreet.dataset.lat,
                lng: profileStreet.dataset.lng
            }

        }
        const khoangCach = tinhKhoangCach(
            parseFloat(toaDoCuaHang.lat), 
            parseFloat(toaDoCuaHang.lng), 
            parseFloat(profileStreet.dataset.lat), 
            parseFloat(profileStreet.dataset.lng)
        );
        if (khoangCach > 10) {
            alert('Khoảng cách giao hàng không được vượt quá 10 km!');
            return;
        }
        // Thanh toán bằng tiền mặt
        if (paymentMethod === '0') {
            try {
                const response = await fetch('/api/them-don-hang', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // gửi cookie chứa JWT
                    body: JSON.stringify({
                        hinhThuc: hinhThuc,
                        diaChi: diaChi,
                        trangThai,
                        tongTien: parseInt(tongTien) - parseInt(phiVanChuyen),
                        phiVanChuyen,
                        soDienThoaiNhan: phone,
                        thanhToan: paymentMethod,
                        gioHang
                    })
                });
        
                const data = await response.json();
                if (data.status) {
                    alert('Đặt hàng thành công!');
                    localStorage.removeItem('gioHang'); // Xóa giỏ hàng sau khi đặt hàng thành công
                    window.location.href = '/';
                } else {
                    alert('Đặt hàng thất bại! Vui lòng thử lại sau.');
                }
        
            } catch (error) {
                console.error('Lỗi:', error);
            }
        // Thanh toán bằng chuyển khoản
        } else if (paymentMethod === '1') {
            const trangThai = 7; // Chờ thanh toán
            try {
                const response = await fetch('/api/them-don-hang', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        hinhThuc: hinhThuc,
                        diaChi: diaChi,
                        trangThai: trangThai,
                        tongTien: parseInt(tongTien) - parseInt(phiVanChuyen),
                        phiVanChuyen,
                        soDienThoaiNhan: phone,
                        thanhToan: paymentMethod,
                        gioHang
                    })
                });
        
                const data = await response.json();
                if (data.status) {
                    // Redirect sang trang hiển thị QR với id đơn hàng
                    //localStorage.removeItem('gioHang');
                    window.location.href = `/thanh-toan-online?id=${data.idDonHang}`;
                } else {
                    alert('Tạo đơn hàng thất bại! Vui lòng thử lại.');
                }
        
            } catch (error) {
                console.error('Lỗi khi tạo đơn hàng:', error);
                alert('Đã có lỗi xảy ra!');
            }
        }   
    
    
    });

    // Cập nhật sự kiện input cho trường số nhà/đường
    const streetInput = document.getElementById('profileStreet');
    const streetDropdown = document.getElementById('streetDropdown');
    let streets = [];
    streetInput.addEventListener('input', async () => {
        const searchText = streetInput.value.toLowerCase().trim();
        // Chỉ hiện dropdown khi người dùng đã nhập ít nhất 2 ký tự
        if (searchText.length >= 1) {
            streets = await loadStreet(streetInput);
            
            // Hiển thị dropdown với thông tin chi tiết hơn
            showStreetDropdown(streetInput, streetDropdown, streets);
        } else {
            streetDropdown.classList.remove('show');
        }
    });
});
function tinhKhoangCach(lat1, lng1, lat2, lng2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) *
              Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Khoảng cách (km)
}
function layDiaChi(addressComponents){
    let level4 = '';
    let level3 = '';
    let level2 = '';
    addressComponents.forEach((item, index) => {
        if(item.types[0] == 'admin_level_4'){
            level4 = item.name;
        }
        if(item.types[0] == 'admin_level_3'){
            level3 = item.name;
        }
        if(item.types[0] == 'admin_level_2'){
            level2 = item.name;
        }
    })
    return {
        level4: level4,
        level3: level3,
        level2: level2
    }
}
async function loadStreet(streetInput) {
    const street = streetInput.value.trim() + ', Thành phố Hồ Chí Minh';
    
    try {
        // Gửi yêu cầu đến API Map4D
        const url = `https://api-app.map4d.vn/map/v2/search/place?text=${encodeURIComponent(street)}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Không thể tải danh sách đường');
        }
        
        const data = await response.json();
        
        if (data.code === 'ok' && data.result && data.result.data) {
            // Chuyển đổi kết quả từ API thành định dạng phù hợp để hiển thị trong dropdown
            const streets = data.result.data.map(item => {
                const {level2, level3, level4} = layDiaChi(item.addressComponents);
                return{
                    name: item.name,
                    address: item.address
                        .replace(/Phường\s+Phường/g, 'Phường')
                        .replace(/Xã\s+Xã/g, 'Xã'),
                    location: item.location,
                    level_4: level4,
                    level_3: level3,
                    level_2: level2,
                }
            });
            
            return streets;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách đường:', error);
        return [];
    }
}
// Hàm hiển thị dropdown riêng cho đường/số nhà
function showStreetDropdown(input, dropdown, items) {
    dropdown.innerHTML = '';
        
    if (items.length === 0) {
        dropdown.classList.remove('show');
        return;
    }
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'dropdown-item';
            
        // Hiển thị địa chỉ đầy đủ trong dropdown
        div.innerHTML = `
            <div class="d-flex flex-column">
                <span class="fw-bold">${item.address}</span>
                <small class="text-muted">${item.name}</small>
            </div>
        `;
            
        div.onclick = () => {
            // Khi chọn một item, đặt giá trị vào input là tên (name)
            input.value = item.address;
            input.dataset.lat = item.location.lat;
            input.dataset.lng = item.location.lng;
            input.dataset.level4 = item.level_4;
            input.dataset.level3 = item.level_3;
            input.dataset.level2 = item.level_2;
            dropdown.classList.remove('show');

            capNhatChiPhiVanChuyen(item);

        };
            
        dropdown.appendChild(div);
    });
        
    dropdown.classList.add('show');
}
async function capNhatChiPhiVanChuyen(address){
    const gioHang = JSON.parse(localStorage.getItem('gioHang')) || [];
    items = gioHang.map(item => ({
        ten: item.name,
        soLuong: item.quantity,
        gia: item.price,
    }))
    try {
        const response = await fetch('/api/lay-phi-van-chuyen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                diaChi: address,
                tongTien: document.getElementById('subTotal').innerText.replace(/\./g, '').replace('₫', '').trim(),
                gioHang: items
            })
        });
        const data = await response.json();
        if(data.status){
            const phiVanChuyen = data.phiVanChuyen;
            document.getElementById('serviceCharge').innerText = parseInt(phiVanChuyen).toLocaleString('vi-VN') + '₫';
            const tongTien = document.getElementById('subTotal').innerText.replace(/\./g, '').replace('₫', '').trim();
            document.getElementById('totalAmount').innerText = (parseInt(tongTien) + parseInt(phiVanChuyen)).toLocaleString('vi-VN') + '₫';
        }
    } catch (error) {
        console.error('Lỗi khi cập nhật phí vận chuyển:', error);
        
    }
}
function thaoTacThongTinKhachHang(khachHang) {
    document.getElementById('fullNameTT').value = khachHang?.ten || '';
    document.getElementById('phoneTT').value = khachHang?.soDienThoai || '';
}

async function getAPIThongTinKhachHang() {
    try {
        const response = await fetch('/api/lay-thong-tin-khach-hang', {
            method: 'GET',
            credentials: 'include' // gửi cookie chứa JWT
        });

        const data = await response.json();
        if (data.status) {
            return data.khachHang;
        } else {
            console.error('Lỗi server:', data.error);
            return {};
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        return {};
    }
}


