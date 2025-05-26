document.addEventListener('DOMContentLoaded', async function () {
    const listLoaiMon = await getAPIDanhMucMonAn();
    const listMonAn = await getAPIMonAn();
    const idBan = new URLSearchParams(window.location.search).get('idBan');
    const ban = await getAPIBan(idBan);
    const donHang = await getAPIDonHang(idBan);
    const socket = io();
    thaoTacLoaiMon(listLoaiMon);
    thaoTacThucDon(listMonAn);
    thaoTacBan(ban);
    thaoTacDonHang(donHang);
    initGuiButtons();
    // Lắng nghe sự kiện socket từ server
    socket.on('connect', () => {
        console.log('Kết nối thành công với server socket: ', socket.id);
        socket.on(`don-hang-${donHang ? donHang.id: ''}-dau-bep-nhan-mon`, (message) => {
            const { id } = message;
            console.log('Nhận thông báo món đã được đầu bếp nhận:', 1);
            capNhatChiTietDonHang(id, 1);
        });
        socket.on(`don-hang-${donHang ? donHang.id: ''}-dau-bep-hoan-thanh-mon`, (message) => {
            const { id } = message;
            console.log('Nhận thông báo món đã hoàn thành:', 2);
            capNhatChiTietDonHang(id, 2);
        });
    });

    // Bấm nút lưu đơn hàng (saveDraft)
    document.getElementById('saveDraft').addEventListener('click', async function (e) {
        e.preventDefault();

        const orderItems = document.querySelectorAll('.order-item');
        if (orderItems.length === 0) {
            alert('Vui lòng chọn món!');
            return;
        }

        const idBan = new URLSearchParams(window.location.search).get('idBan');
        if (!idBan) {
            alert('Không tìm thấy ID bàn!');
            return;
        }

        const chiTietDonHang = [];
        let tongTien = 0;

        orderItems.forEach(item => {
            const id = item.dataset.id ? item.dataset.id : null;
            const idMonAn = item.dataset.idMonAn;
            const soLuong = parseInt(item.querySelector('.so-luong').value) || 0;
            const giaText = item.querySelector('.price').textContent.trim();
            const gia = parseInt(giaText.replace(/[^\d]/g, '')) || 0;
            const ghiChu = item.querySelector('.txt-ghiChu').value.trim();

            if (soLuong > 0 && gia > 0) {
                chiTietDonHang.push({
                    id,
                    idMonAn,
                    soLuong,
                    gia,
                    ghiChu // Ghi chú nếu cần
                });
                tongTien += gia * soLuong;
            }
        });

        if (chiTietDonHang.length === 0) {
            alert('Không có món hợp lệ để ghi đơn!');
            return;
        }

        try {
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value
            // Thêm idDonHang vào body request
            const response = await fetch(`/api/ghi-don-hang?idBan=${idBan}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idDonHang: donHang?.id || null, // Nếu donHang có id thì truyền vào, nếu không thì truyền null
                    hinhThuc: 0,
                    thanhToan: paymentMethod,
                    trangThai: 7,
                    tongTien,
                    chiTietDonHang
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Server returned HTTP error: ' + response.status);
            }

            const data = await response.json();
            console.log('API response data:', data);

            if (data.status) {
                alert('Ghi đơn hàng thành công!');

                // Cập nhật trạng thái bàn
                try {
                    const response = await fetch('/api/cap-nhat-trang-thai-ban', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idBan: idBan,
                            newStatus: 1
                        })
                    });

                    const statusUpdate = await response.json();
                    if (statusUpdate.status) {
                        console.log('Cập nhật trạng thái bàn thành công');
                        window.location.href = '/manager/danh-sach-ban';
                    } else {
                        console.error('Lỗi cập nhật trạng thái bàn:', statusUpdate.error);
                    }
                } catch (error) {
                    console.error('Lỗi khi gọi API cập nhật trạng thái bàn:', error);
                }
            } else {
                alert('Ghi đơn thất bại: ' + (data.error || 'Không rõ nguyên nhân'));
            }

        } catch (error) {
            console.error('Lỗi ghi đơn hàng:', error);
            alert('Đã xảy ra lỗi: ' + error.message);
        }
    });

    // Bấm nút thanh toán (checkout)
    document.getElementById('checkout').addEventListener('click', async function(e) {
        e.preventDefault();

        const orderItems = document.querySelectorAll('.order-item');
        if (orderItems.length === 0) {
            alert('Vui lòng chọn món!');
            return;
        }

        // Kiểm tra nếu tất cả món đều có trạng thái là 3
        const allItemsReady = Array.from(orderItems).every(item => {
            const trangThai = item.dataset.trangThai;
            console.log('Trạng thái món:', trangThai);
            return trangThai == 3;
        });

        if (!allItemsReady) {
            alert('Chỉ có thể thanh toán khi tất cả món đã được gửi!');
            return;
        }

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
        
        const chiTietDonHang = [];
        let tongTien = 0;
    
        orderItems.forEach(item => {
            const id = item.dataset.id ? item.dataset.id : null;
            const idMonAn = item.dataset.idMonAn;
            const soLuong = parseInt(item.querySelector('.so-luong').value) || 0;
            const giaText = item.querySelector('.price').textContent.trim();
            const gia = parseInt(giaText.replace(/[^\d]/g, '')) || 0;
            const ghiChu = item.querySelector('.txt-ghiChu').value.trim();
            if (soLuong > 0 && gia > 0) {
                chiTietDonHang.push({
                    id,
                    idMonAn,
                    soLuong,
                    gia,
                    ghiChu: ghiChu || ''
                });
                tongTien += gia * soLuong;
            }
        });
    
        if (chiTietDonHang.length === 0) {
            alert('Không có món hợp lệ để ghi đơn!');
            return;
        }
    
        if (paymentMethod === '0') { // Thanh toán tiền mặt
            try {
                const orderResponse = await fetch(`/api/ghi-don-hang?idBan=${idBan}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idDonHang: donHang?.id || null,
                        hinhThuc: 0,
                        thanhToan: paymentMethod,
                        trangThai: 2,
                        tongTien,
                        chiTietDonHang
                    })
                });
    
                const orderData = await orderResponse.json();
                console.log('Dữ liệu trả về từ API ghi đơn hàng:', orderData); 
    
                if (orderData.status) {
                    const tableStatusResponse = await fetch('/api/cap-nhat-trang-thai-ban', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idBan: idBan,
                            newStatus: 0
                        })
                    });
    
                    const tableStatusData = await tableStatusResponse.json();
                    if (tableStatusData.status) {
                        alert('Thanh toán đơn hàng thành công!');
                        window.location.href = `/manager/danh-sach-ban`;
                    } else {
                        alert('Thanh toán đơn hàng thất bại!');
                    }
                } else {
                    alert('Thanh toán đơn hàng thất bại! Vui lòng thử lại.');
                }
    
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi xảy ra, vui lòng thử lại sau.');
            }
    
        } else if (paymentMethod === '1') {
            const trangThai = 7;
            try {
                const response = await fetch(`/api/ghi-don-hang?idBan=${idBan}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idDonHang: donHang?.id || null,
                        hinhThuc: 0,
                        thanhToan: paymentMethod,
                        trangThai: trangThai,
                        tongTien,
                        chiTietDonHang
                    })
                });
                
                const data = await response.json();
                if (data.status) {
                    // Redirect sang trang hiển thị QR với id đơn hàng
                    //localStorage.removeItem('gioHang');
                    window.location.href = `/manager/thanh-toan-online?id=${data.idDonHang}`;

                    
                } else {
                    alert('Tạo đơn hàng thất bại! Vui lòng thử lại.');
                }
                
            }catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi xảy ra, vui lòng thử lại sau.');
            }
        }
    });  

});

function initGuiButtons() {
    const donHangContainer = document.querySelector('.order-items');

    // Delegate the event to the container
    donHangContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('btn-da-gui')) {
            const btn = event.target;
            const chiTietId = btn.dataset.idchitiet;

            if (!chiTietId) {
                alert('Không tìm thấy ID chi tiết đơn hàng.');
                return;
            }

            const idBan = new URLSearchParams(window.location.search).get('idBan');
            if (!idBan) {
                alert('Không tìm thấy ID bàn trên URL.');
                return;
            }

            btn.disabled = true;
            btn.textContent = 'Đang gửi...';

            try {
                const response = await fetch('/api/mon-da-gui', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id: chiTietId })
                });

                const data = await response.json();

                if (data.status) {
                    const res = await fetch(`/api/don-hang-theo-ban?idBan=${idBan}`);
                    const newDonHang = await res.json();
                    // Cập nhật giao diện sau khi gửi món thành công
                    thaoTacDonHang(newDonHang.obj); // Đảm bảo thaoTacDonHang cập nhật danh sách đơn hàng
                } else {
                    alert('Không thể cập nhật trạng thái: ' + (data.error || 'Lỗi không xác định'));
                }
            } catch (err) {
                console.error('Lỗi gửi món:', err);
                alert('Lỗi gửi món: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Gửi';
            }
        }
    });
}
function thaoTacLoaiMon(list) {
    const danhSachLoaiMon = document.querySelector('#category-filters');
    danhSachLoaiMon.innerHTML = "";

    // Thêm nút "Tất cả"
    const tatCaBtn = document.createElement('button');
    tatCaBtn.className = "btn btn-outline-primary active";
    tatCaBtn.textContent = "Tất cả";
    tatCaBtn.dataset.id = "";
    danhSachLoaiMon.appendChild(tatCaBtn);

    // Thêm các nút còn lại
    list.forEach(loaiMon => {
        const btn = document.createElement('button');
        btn.className = "btn btn-outline-primary";
        btn.textContent = loaiMon.tenDanhMuc;
        btn.dataset.id = loaiMon.id;
        danhSachLoaiMon.appendChild(btn);
    });

    // Xử lý sự kiện click để lọc
    danhSachLoaiMon.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', async function () {
            // Active trạng thái nút
            danhSachLoaiMon.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const loaiId = this.dataset.id;
            const monAn = await getAPIMonAn(loaiId);
            thaoTacThucDon(monAn);
        });
    });
}
function capNhatChiTietDonHang(id, trangThai) {
    const orderItem = document.querySelector(`.order-item[data-id="${id}"]`);
    if (orderItem) {
        if(trangThai == 1){
            orderItem.dataset.trangThai = trangThai;
            orderItem.querySelector('.trang-thai').textContent = 'Đang chế biến';
            orderItem.querySelector('.txt-ghiChu').setAttribute('readonly', true);
            orderItem.querySelector('.btn-xoa').style.display = 'none';
            orderItem.querySelector('.btn-giam').style.display = 'none';
            orderItem.querySelector('.btn-tang').style.display = 'none';
        }
        else if(trangThai == 2){
            orderItem.dataset.trangThai = trangThai;
            orderItem.querySelector('.trang-thai').textContent = 'Đã hoàn thành';
            orderItem.querySelector('.txt-ghiChu').setAttribute('readonly', true);
            orderItem.querySelector('.btn-xoa').style.display = 'none';
            orderItem.querySelector('.btn-giam').style.display = 'none';
            orderItem.querySelector('.btn-tang').style.display = 'none';
            orderItem.querySelector('.btn-xoa').insertAdjacentHTML('afterend', `<button class="btn btn-sm btn-success ms-2 btn-da-gui" data-idchitiet="${id}" >Gửi</button>`);

        }
    }
}
function thaoTacThucDon(list) {
    const danhSachMonAn = document.querySelector('#danhSachMonAn');
    danhSachMonAn.innerHTML = "";

    if (list.length === 0) {
        danhSachMonAn.innerHTML = `<p class="text-center text-danger">Không có món trong loại này.</p>`;
        return;
    }
    list.forEach(monAn => {
        const card = `
            <div class="col">
                <div class="menu-item card h-100"
                    data-id="${monAn.id}">
                    <img src="${monAn.hinhAnh}" class="card-img-top" style="height: 160px; object-fit: cover;" alt="${monAn.ten}">
                    <div class="card-body d-flex flex-column justify-content-between h-100">
                        <div>
                            <h6 class="card-title">${monAn.ten}</h6>
                            <p class="card-text text-primary">${monAn.gia.toLocaleString('vi-VN')}₫</p>
                        </div>
                    </div>                    
                </div>
            </div>`;
            danhSachMonAn.innerHTML += card;
    });

    // Sự kiện click
    document.querySelectorAll('.menu-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const id = this.dataset.id;
            const monAn = list.find(mon => mon.id == id);
            const name = monAn.ten;
            const price = monAn.gia;
            const img = monAn.hinhAnh;

            themVaoGioHang(id, name, price, img);
        });
    });
}



function thaoTacBan(banList) {
    const banContainer = document.querySelector('.table-selection'); // Selector chứa danh sách bàn
    banContainer.innerHTML = ""; // Xóa nội dung cũ trước khi thêm bàn mới

    if (banList.length === 0) {
        banContainer.innerHTML = "<p>Không có bàn nào để hiển thị.</p>";
        return;
    }

    banList.forEach(ban => {
        // Tạo một phần tử mới cho mỗi bàn
        const banElement = document.createElement('div'); 
        banElement.className = 'table-item'; // Thêm class để style nếu cần

        // Cập nhật nội dung của phần tử
        banElement.innerHTML = `
            <h5 class="mb-3 text-primary text-center">Lập Hóa Đơn</h5>

            <div class="d-flex justify-content-between mb-2">
                <span class="fw-bold">Bàn:</span>
                <span id="selectedTable">${ban.ten}</span> 
            </div>
            <div class="d-flex justify-content-between mb-3">
                <span class="fw-bold">Khu vực:</span>
                <span id="selectedArea">${ban.KhuVuc.tenKhuVuc}</span>
            </div>
        `;

        // Thêm phần tử vào container
        banContainer.appendChild(banElement);
    });
}

function themVaoGioHang(id, name, price, img) {
    const orderItems = document.querySelectorAll('.order-item');

    let orderItem = Array.from(orderItems).find(item => item.dataset.idMonAn == id && (item.dataset.trangThai == 0 || !item.dataset.trangThai)); // Tìm món ăn theo id và trạng thái
    console.log(orderItem);
    // Kiểm tra xem món ăn đã có trong giỏ chưa (phân biệt theo trạng thái)
    if (orderItem) {
        const quantityInput = orderItem.querySelector('.so-luong');
        quantityInput.value = parseInt(quantityInput.value) + 1;
        updateTotal();
        return;
    }

    orderItem = document.createElement('div');
    orderItem.dataset.idMonAn = id;
    orderItem.className = 'order-item';
    orderItem.innerHTML = `
        <div class="d-flex justify-content-between mb-2">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center">
                    <img src="${img}" alt="${name}" style="height: 50px; width: 50px; object-fit: cover; margin-right: 15px;">
                </div>
                <div class="d-flex flex-column">
                    <span class="fw-bold">${name}</span>
                    <span class="price text-primary">${price.toLocaleString('vi-VN')}₫</span>
                </div>
            </div>

            <div class="d-flex align-items-center mb-2">
                <div class="input-group input-group-sm" style="max-width: 130px;">
                    <button class="btn btn-outline-secondary btn-giam" type="button">-</button>
                    <input type="number" class="form-control text-center so-luong" value="1" min="1" style="width: 50px;">
                    <button class="btn btn-outline-secondary btn-tang" type="button">+</button>
                </div>
                <button class="btn btn-sm btn-danger ms-2 btn-xoa">Xóa</button>
            </div>
        </div>
        <div class="row">
            <label class="form-label d-inline w-auto m-0">Ghi chú:</label>
            <input type="text" class="w-auto border-0 flex-grow-1 p-0 txt-ghiChu" style="outline: none;">
        </div>
    `;

    document.querySelector('.order-items').appendChild(orderItem);

    // Cập nhật tổng giá trị
    updateTotal();

    // Thêm sự kiện cho nút xóa
    orderItem.querySelector('.btn-xoa').addEventListener('click', function() {
        orderItem.remove();
        updateTotal();
    });

    // Thêm sự kiện cho nút tăng/giảm số lượng
    orderItem.querySelector('.btn-tang').addEventListener('click', function () {
        const input = orderItem.querySelector('.so-luong');
        let currentValue = parseInt(input.value) || 0;
    
        if (currentValue < 20) {
            input.value = currentValue + 1;
            updateTotal(); // Cập nhật lại tổng giá trị
        }
    });
    

    orderItem.querySelector('.btn-giam').addEventListener('click', function () {
        const input = orderItem.querySelector('.so-luong');
        if (input.value > 1) input.value = parseInt(input.value) - 1;
        updateTotal(); // Cập nhật lại tổng giá trị
    });

    const inputSoLuong = orderItem.querySelector('.so-luong');
        inputSoLuong.addEventListener('change', function () {
            let value = parseInt(this.value);
            
            if (isNaN(value) || value < 1) {
                alert('Số lượng phải lớn hơn 0!');
                this.value = 1;
            } else if (value > 20) {
                alert('Không được đặt quá 20 món cho mỗi loại!');
                this.value = 20;
            }

            updateTotal();
        });

}

function updateTotal() {
    const orderItems = document.querySelectorAll('.order-item');
    let total = 0;

    orderItems.forEach(item => {
        // Remove non-numeric characters from price text (₫ and commas)
        const price = parseInt(item.querySelector('.price').textContent.replace('₫', '').replace('.', '').trim());
        const quantity = parseInt(item.querySelector('.so-luong').value);
        total += price * quantity;
    });

    document.querySelector('#total').textContent = `${total.toLocaleString('vi-VN')}₫`;
}


async function getAPIDanhMucMonAn() {
    try {
        const response = await fetch('/api/danh-muc-mon-an');
        const data = await response.json();
        return data.status ? data.list : [];
    } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
        return [];
    }
}

async function getAPIMonAn(idDanhMuc = null) {
    let url = '/api/mon-an';
    if (idDanhMuc) url += `/${idDanhMuc}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.status ? data.list : [];
    } catch (error) {
        console.error('Lỗi khi lấy món ăn:', error);
        return [];
    }
}

async function getAPIBan(idBan = null) {
    try {
        let url = '/api/ban'; // Đường dẫn API cơ bản

        // Nếu có idBan, truyền thêm vào query string
        if (idBan) {
            url += `?idBan=${idBan}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        // Kiểm tra trạng thái của API
        if (data.status) {
            // console.log("Dữ liệu trả về từ API:", data); 
            return data.list || [data.obj]; 
        } else {
            showToastDanger(data.error);
            console.log("Lỗi từ API:", data.error); // Log lỗi nếu có
            return [];
        }
    } catch (error) {
        showToastDanger();
        console.log("Lỗi trong khi gọi API:", error); // Log lỗi nếu có lỗi trong quá trình gọi API
        return [];
    }
}

async function getAPIDonHang(idBan) {
    try {
        if (!idBan) {
            const listMonAn = await getAPIMonAn();
            thaoTacThucDon(listMonAn);
            return null;
        }

        const url = `/api/don-hang-theo-ban?idBan=${idBan}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status) {
            if (data.obj && data.obj.ChiTietDonHangs?.length > 0) {
                return data.obj;
            } else {
                const listMonAn = await getAPIMonAn();
                thaoTacThucDon(listMonAn);
                return null;
            }
        } else {
            // Nếu là không có đơn hàng chờ thanh toán thì hiển thị món ăn
            if (data.message === 'Không có đơn hàng chờ thanh toán cho bàn này') {
                const listMonAn = await getAPIMonAn();
                thaoTacThucDon(listMonAn);
                return null;
            }

            // Còn lại là lỗi khác thì thông báo
            showToastDanger(data.error || data.message);
            console.error('Lỗi từ API:', data.error || data.message);
        }
    } catch (error) {
        showToastDanger('Lỗi khi lấy đơn hàng!');
        console.error('Lỗi khi lấy đơn hàng:', error);
    }
}


function thaoTacDonHang(donHang) {
    const donHangContainer = document.querySelector('.order-items');
    donHangContainer.innerHTML = '';

    if (!donHang || !donHang.ChiTietDonHangs || donHang.ChiTietDonHangs.length === 0) {
        console.log('Không có đơn hàng đã lưu.');
        return;
    }

    const trangThaiChiTiet = {
        0: 'Chờ đầu bếp',
        1: 'Đang chế biến',
        2: 'Đã hoàn thành',
        3: 'Đã gửi'
    };
    // console.log('Đơn hàng:', donHang.ChiTietDonHangs);
    donHang.ChiTietDonHangs.forEach((ct) => {
        const mon = ct.MonAn;
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.dataset.trangThai = ct.trangThai;
        orderItem.dataset.id = ct.id;
        orderItem.dataset.idMonAn = ct.MonAn.id;

        orderItem.innerHTML = `
            <div class="d-flex justify-content-between mb-2">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <div class="d-flex align-items-center">
                        <img src="${mon?.hinhAnh || '/default.jpg'}" alt="${mon?.ten || 'Món ăn'}" style="height: 50px; width: 50px; object-fit: cover; margin-right: 15px;">
                    </div>
                    <div class="d-flex flex-column">
                        <span class="fw-bold">${mon?.ten || 'Không rõ món'}</span>
                        <span class="price text-primary">${(mon?.gia || 0).toLocaleString('vi-VN')}₫</span>
                        <span class="badge bg-info mt-1 trang-thai" style="display: inline-block; width: fit-content; white-space: nowrap;">
                            ${trangThaiChiTiet[ct.trangThai] || 'Không rõ trạng thái'}
                        </span>
                    </div>
                </div>

                <div class="d-flex align-items-center mb-2">
                    <div class="input-group input-group-sm" style="max-width: 130px;">
                        <button class="btn btn-outline-secondary btn-giam" type="button" style="${[1,2,3].includes(ct.trangThai) ? 'display: none;' : ''}">-</button>
                        <input type="number" class="form-control text-center so-luong" value="${ct.soLuong}" min="1" style="width: 50px;" ${[1,2,3].includes(ct.trangThai) ? 'readonly' : ''}>
                        <button class="btn btn-outline-secondary btn-tang" type="button" style="${[1,2,3].includes(ct.trangThai) ? 'display: none;' : ''}">+</button>
                    </div>
                    <button class="btn btn-sm btn-danger ms-2 btn-xoa" style="${[1,2,3].includes(ct.trangThai) ? 'display: none;' : ''}">Xóa</button>
                    ${ct.trangThai == 2 ? `<button class="btn btn-sm btn-success ms-2 btn-da-gui" data-idchitiet="${ct.id}" >Gửi</button>` : ''}
                </div>
            </div>
            <div class="row">
                <label class="form-label d-inline w-auto m-0">Ghi chú:</label>
                <input type="text" class="w-auto border-0 flex-grow-1 p-0 txt-ghiChu" style="outline: none;" value="${ct.ghiChu || ''}" ${[1,2,3].includes(ct.trangThai) ? 'readonly' : ''}>
            </div>
        `;
        
        donHangContainer.appendChild(orderItem);

        // Event listeners
        const btnTang = orderItem.querySelector('.btn-tang');
        const btnGiam = orderItem.querySelector('.btn-giam');
        const btnXoa = orderItem.querySelector('.btn-xoa');
        
        const inputSoLuong = orderItem.querySelector('.so-luong');

        if (btnTang) {
            btnTang.addEventListener('click', () => {
                inputSoLuong.value = parseInt(inputSoLuong.value) + 1;
                updateTotal();
            });
        }

        if (btnGiam) {
            btnGiam.addEventListener('click', () => {
                if (parseInt(inputSoLuong.value) > 1) {
                    inputSoLuong.value = parseInt(inputSoLuong.value) - 1;
                    updateTotal();
                }
            });
        }

        if (btnXoa) {
            btnXoa.addEventListener('click', () => {
                orderItem.remove();
                updateTotal();
            });
        }

    });

    updateTotal();

}
function showToastDanger(content = null) {//showErrorToast()
    if (content) {
        document.querySelector('#dangerToast .toastMessage').textContent = content;
    }
    else{
        document.querySelector('#dangerToast .toastMessage').textContent = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
    }
    const toastElement = document.getElementById('dangerToast');
    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000 // Tự động ẩn sau 3 giây
    });
    
    // Hiển thị toast
    toast.show();
}
function showToastSuccess(content = null) {//showSuccessToastThem()
    if (content) {
        document.querySelector('#successToast .toastMessage').textContent = content;
    }
    else{
        document.querySelector('#successToast .toastMessage').textContent = 'Thêm thành công.';
    }
    const toastElement = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000 // Tự động ẩn sau 3 giây
    });
    
    // Hiển thị toast
    toast.show();
}
function showToastPrimary(content = null) { //showSuccessToastSua
    if (content) {
        document.querySelector('#primaryToast .toastMessage').textContent = content;
    }
    else{
        document.querySelector('#primaryToast .toastMessage').textContent = 'Chỉnh sửa thành công.';
    }
    const toastElement = document.getElementById('primaryToast');
    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000 // Tự động ẩn sau 3 giây
    });
    
    // Hiển thị toast
    toast.show();
}