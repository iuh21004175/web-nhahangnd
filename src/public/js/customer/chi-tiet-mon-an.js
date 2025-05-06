document.addEventListener('DOMContentLoaded', async function () {
    const params = new URLSearchParams(window.location.search);
    const idMon = params.get('idMon');

    if (idMon) {
        const monAn = await getThongTinMonAnAPI(idMon);
        if (monAn) {
            renderChiTietMonAn(monAn);
        }
    } else {
        showToastDanger('Không có ID món ăn');
    }
    updateCartBadge();
});

function renderChiTietMonAn(monAn) {
    const container = document.querySelector('.thongTinMonAn');
    container.innerHTML = `
        <!-- Hình ảnh món ăn -->
        <div class="col-md-6 mb-4">
            <div class="product-image">
                <img src="${monAn.hinhAnh}" alt="${monAn.ten}" class="menu-item-card img-fluid rounded shadow-sm">
            </div>
        </div>

        <!-- Thông tin món ăn -->
        <div class="menu-item-info col-md-6">
            <div class="product-info p-4 shadow-sm rounded">
                <h1 class="menu-item-title mb-3">${monAn.ten}</h1>
            </div>

            <div class="price-box mb-4">
                <span class="menu-item-price text-primary fw-bold fs-3">${Number(monAn.gia).toLocaleString()}₫</span>
            </div>

            <div class="description mb-4">
                <h5>Mô tả:</h5>
                <p class="text-muted">${monAn.moTa || 'Không có mô tả'}</p>
            </div>

            <div class="d-flex align-items-center gap-3">
                <div class="input-group" style="width: 150px;">
                    <button class="btn btn-outline-secondary btn-giam" type="button">-</button>
                    <input type="number" class="form-control text-center so-luong" value="1" min="1" max="20">
                    <button class="btn btn-outline-secondary btn-tang" type="button">+</button>
                </div>
                <button class="btn btn-primary btn-lg btn-them" value="${monAn.idMonAn}">
                    <i class="fas fa-cart-plus me-2"></i>Thêm vào giỏ
                </button>
            </div>
        </div>
    `;

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

    document.querySelectorAll('.btn-them').forEach(function(btnThem) {
        btnThem.addEventListener('click', function () {
            const parent = this.closest('.menu-item-info');
            const soLuong = parseInt(parent.querySelector('.so-luong').value);
            const tenMon = parent.querySelector('.menu-item-title').textContent;
            const giaMon = parseInt(parent.querySelector('.menu-item-price').textContent.replace(/[^\d]/g, ''), 10);
            const hinhAnh = document.querySelector('.product-image img').src;
            const item = {
                id: this.value,
                name: tenMon,              
                price: giaMon,   
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

// Hàm thao tác chi tiết món ăn
async function getThongTinMonAnAPI(idMon) {
    try {
        const response = await fetch('/api/chi-tiet-mon-an?idMon=' + idMon);
        const data = await response.json();

        if (data.status) {
            return data.data;
        } else {
            showToastDanger(data.error || "Không tìm thấy món ăn");
            return null;
        }
    } catch (err) {
        showToastDanger("Lỗi khi lấy thông tin món ăn");
        console.error(err);
        return null;
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
