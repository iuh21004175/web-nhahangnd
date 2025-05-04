document.addEventListener('DOMContentLoaded', async function () {
    let listMonAn = await getAPIMonAn();  // Lấy tất cả món ăn 
    thaoTacThucDon(listMonAn);  // Hiển thị món ăn 
    updateCartBadge(); // Cập nhật số lượng giỏ hàng
    
});

function thaoTacThucDon(list) {
    const danhSachMonAn = document.querySelector('#danhSachMonAn');
    danhSachMonAn.innerHTML = '';
    list.forEach(function(monAn) {
        const card = `
        <div class="col-md-6 col-lg-4">
            <div class="menu-item-card shadow-sm">
                <div class="menu-item-image">
                    <img src="${monAn.MonAn.hinhAnh}" alt="Món ăn" class="img-fluid">
                    <div class="menu-item-badge">Bán chạy</div>
                </div>
                <div class="menu-item-info p-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="menu-item-title mb-0">${monAn.MonAn.ten}</h5>
                        <span class="menu-item-price text-primary fw-bold">${monAn.MonAn.gia.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <p class="menu-item-desc text-muted mb-3">${monAn.MonAn.moTa}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="input-group input-group-sm w-50">
                            <button class="btn btn-outline-secondary btn-giam" type="button">-</button>
                            <input type="number" class="form-control text-center so-luong" value="1" min="1" max="20">
                            <button class="btn btn-outline-secondary btn-tang" type="button">+</button>
                        </div>
                        <button class="btn-them btn btn-primary" value="${monAn.idMonAn}">
                            <i class="fas fa-cart-plus me-2"></i>Thêm vào giỏ
                        </button>
                    </div>
                </div>
            </div>
        </div>`;


        // Gán vào DOM
        danhSachMonAn.innerHTML += card;
        document.querySelectorAll('.btn-them').forEach(function(btnThem) {
            btnThem.addEventListener('click', function() {
                console.log('Thêm món ăn vào giỏ hàng:', this.value);
            });
        });
        // Sự kiện tăng số lượng
        document.querySelectorAll('.btn-tang').forEach(function(btnTang) {
            btnTang.addEventListener('click', function () {
                const input = this.closest('.menu-item-info').querySelector('.so-luong');
                let value = parseInt(input.value);
                if(value < 20) input.value = value + 1;
            });
        });

        // Sự kiện giảm số lượng
        document.querySelectorAll('.btn-giam').forEach(function(btnGiam) {
            btnGiam.addEventListener('click', function () {
                const input = this.closest('.menu-item-info').querySelector('.so-luong');
                let value = parseInt(input.value);
                if (value > 1) input.value = value - 1;
            });
        });
    });

    document.querySelectorAll('.btn-them').forEach(function(btnThem) {
        btnThem.addEventListener('click', function () {
            const parent = this.closest('.menu-item-info');
            const soLuong = parseInt(parent.querySelector('.so-luong').value);
            const tenMon = parent.querySelector('.menu-item-title').textContent;
            const giaMon = parent.querySelector('.menu-item-price').textContent.replace(/[^\d]/g, '');
            const hinhAnh = parent.closest('.menu-item-card').querySelector('img').src;
        
            const item = {
                id: this.value,
                name: tenMon,              
                price: parseInt(giaMon),   
                quantity: soLuong,
                image: hinhAnh
            };
        
            // Lấy giỏ hàng từ localStorage
            let cart = JSON.parse(localStorage.getItem('gioHang')) || [];
        
            // Kiểm tra xem món ăn đã có trong giỏ chưa
            const index = cart.findIndex(i => i.id === item.id);
            if (index >= 0) {
                // Nếu món ăn đã có, cập nhật số lượng
                cart[index].quantity += item.quantity;
            } else {
                // Nếu món ăn chưa có, thêm vào giỏ
                cart.push(item);
            }
        
            // Lưu lại giỏ hàng vào localStorage
            localStorage.setItem('gioHang', JSON.stringify(cart));
            updateCartBadge();
            console.log('Đã thêm vào giỏ hàng:', cart);
        });
    });
}



async function getAPIMonAn() {
    const reponse = await fetch('/api/mon-an/ban-chay');    
    try {
        const data = await reponse.json();
        if (data.status) {
            return data.list;  // Trả về danh sách loại món ăn
        } else {
            console.error('Lỗi server:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


function getCartItemCount() {
    const cart = JSON.parse(localStorage.getItem('gioHang')) || [];
    return cart.length; // lấy số món khác nhau
}

function updateCartBadge() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = getCartItemCount();
    }
}

