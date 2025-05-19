document.addEventListener("DOMContentLoaded", function () {
    // Khởi tạo giá trị ngày cho bộ lọc
    initializeDateFilters();
    
    // Tải danh sách đơn hàng
    loadOrders();
    const socket = io();
    socket.on('connect', function() {
        console.log('Kết nối thành công với server socket:', socket.id);
        socket.on('tao-don-hang', function(data) {
            const { donHang } = data;
            themDonHang(donHang);
        });
    });

    // Thêm sự kiện cho nút tìm kiếm
    document.getElementById('btnSearch')?.addEventListener('click', function() {
        loadOrders();
    });
    
    // Thêm sự kiện cho nút làm mới (reset)
    document.getElementById('btnReset')?.addEventListener('click', function() {
        resetFilters();
        loadOrders();
    });

    // Xử lý sự kiện khi modal bị ẩn
    const orderDetailModal = document.getElementById('orderDetailModal');
    if (orderDetailModal) {
        orderDetailModal.addEventListener('hidden.bs.modal', function() {
            // Xóa tất cả các backdrop còn sót lại
            document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
                backdrop.remove();
            });
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
        });
    }
});
function themDonHang(donHang) {
    const tableBody = document.getElementById('orderTableBody');
    const row = document.createElement('tr');
    console.log("Thêm đơn hàng vào bảng", donHang);
    // Hiển thị loại đơn hàng
    let orderTypeText = '';
    switch (parseInt(donHang.hinhThuc)) {
        case 0: orderTypeText = '<span class="badge bg-info">Tại quán</span>'; break;
        case 1: orderTypeText = '<span class="badge bg-primary">Trực tuyến</span>'; break;
        default: orderTypeText = '<span class="badge bg-light text-dark">Không xác định</span>';
    }
        
    // Hiển thị trạng thái đơn hàng
    let statusBadge = '';
    switch (parseInt(donHang.trangThai)) {
        case 0: statusBadge = '<span class="badge bg-warning">Đã hủy</span>'; break;
        case 1: statusBadge = '<span class="badge bg-primary">Đặt thành công</span>'; break;
        case 2: statusBadge = '<span class="badge bg-info">Đã thanh toán</span>'; break;
        case 3: statusBadge = '<span class="badge bg-success">Đang chế biến</span>'; break;
        case 4: statusBadge = '<span class="badge bg-success">Đã chế biến</span>'; break;
        case 5: statusBadge = '<span class="badge bg-danger">Đang giao hàng</span>'; break;
        case 6: statusBadge = '<span class="badge bg-secondary">Đã giao hàng</span>'; break;
        case 7: statusBadge = '<span class="badge bg-warning">Chờ thanh toán</span>'; break;
        default: statusBadge = '<span class="badge bg-secondary">Không xác định</span>';
    }
        
    // Hiển thị phương thức thanh toán
    let paymentMethod = '';
    switch (parseInt(donHang.thanhToan)) {
        case 0: paymentMethod = 'Tiền mặt'; break;
        case 1: paymentMethod = 'Chuyển khoản'; break;
        default: paymentMethod = 'Không xác định';
    }
        
    // Format ngày đặt hàng
    const orderDate = new Date(donHang.thoiGianGhi);
    const formattedDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()} ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;
        
    // Lấy thông tin khách hàng
    const customerName = donHang.KhachHang ? donHang.KhachHang.ten || 'Khách vãng lai' : 'Khách vãng lai';
    const customerPhone = donHang.KhachHang ? donHang.soDienThoaiNhan || '' : '';
        
    row.innerHTML = `
        <td>#${donHang.id}</td>
        <td>${customerName} ${customerPhone ? `<br><small class="text-muted">${customerPhone}</small>` : ''}</td>
        <td>${formattedDate}</td>
        <td>${orderTypeText}</td>
        <td>${donHang.tongTien?.toLocaleString('vi-VN')}đ</td>
        <td>${statusBadge}</td>
        <td>${paymentMethod}</td>
        <td>
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#orderDetailModal" onclick="viewOrderDetails(${donHang.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </td>
    `;
        
    tableBody.insertBefore(row, tableBody.firstChild);
}
/**
 * Khởi tạo giá trị mặc định cho bộ lọc ngày
 * - Từ ngày: 7 ngày trước
 * - Đến ngày: ngày hiện tại
 */
function initializeDateFilters() {
    // Lấy ngày hiện tại
    const today = new Date();
    
    // Tính ngày 7 ngày trước
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Format ngày thành chuỗi YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Định dạng ngày hiện tại
    const todayFormatted = formatDate(today);
    
    // Thiết lập giá trị cho input
    const fromDateInput = document.getElementById('fromDateFilter');
    const toDateInput = document.getElementById('toDateFilter');
    
    if (fromDateInput) {
        fromDateInput.value = formatDate(sevenDaysAgo);
        // Giới hạn ngày "Từ ngày" không vượt quá ngày hiện tại
        fromDateInput.setAttribute('max', todayFormatted);
    }
    
    if (toDateInput) {
        toDateInput.value = todayFormatted;
        // Giới hạn ngày "Đến ngày" không vượt quá ngày hiện tại
        toDateInput.setAttribute('max', todayFormatted);
    }
    
    // Thêm sự kiện để đảm bảo ngày "Đến ngày" không nhỏ hơn ngày "Từ ngày"
    fromDateInput?.addEventListener('change', function() {
        if (toDateInput && fromDateInput.value > toDateInput.value) {
            toDateInput.value = fromDateInput.value;
        }
    });
    
    // Thêm sự kiện để đảm bảo ngày "Từ ngày" không lớn hơn ngày "Đến ngày"
    toDateInput?.addEventListener('change', function() {
        if (fromDateInput && toDateInput.value < fromDateInput.value) {
            fromDateInput.value = toDateInput.value;
        }
    });
}

/**
 * Reset tất cả các bộ lọc về giá trị mặc định
 */
function resetFilters() {
    // Reset các input filter
    document.getElementById('orderIdFilter').value = '';
    document.getElementById('customerFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('paymentFilter').value = '';
    document.getElementById('orderTypeFilter').value = '';
    
    // Khởi tạo lại filter ngày
    initializeDateFilters();
}

/**
 * Lấy dữ liệu đơn hàng từ API với các bộ lọc
 */
async function getAPIDonHang() {
    try {
        
        // Lấy giá trị các bộ lọc
        console.log("Lấy giá trị bộ lọc đơn hàng", document.getElementById('orderIdFilter').value.trim());
        const orderId = document.getElementById('orderIdFilter').value.trim();
        const customer = document.getElementById('customerFilter').value;
        const status = document.getElementById('statusFilter').value;
        const payment = document.getElementById('paymentFilter').value;
        const fromDate = document.getElementById('fromDateFilter').value;
        const toDate = document.getElementById('toDateFilter').value;
        const orderType = document.getElementById('orderTypeFilter').value;
        
        // Tạo query string từ các bộ lọc
        let queryParams = new URLSearchParams();
        
        queryParams.append('id', orderId);
        queryParams.append('khachHang', customer);
        queryParams.append('trangThai', status);
        queryParams.append('thanhToan', payment);
        queryParams.append('batDau', fromDate);
        queryParams.append('ketThuc', toDate);
        queryParams.append('hinhThuc', orderType);
        
        // Gọi API với bộ lọc
        const response = await fetch(`/api/don-hang-cho-quan-ly?${queryParams.toString()}`);
        const data = await response.json();
        

        
        if (data.status) {
            // Hiển thị thống kê nếu có
            return data.list || [];
        } else {
            console.error("Lỗi khi tải dữ liệu đơn hàng:", data.message);
            showToastDanger("Lỗi khi tải dữ liệu đơn hàng", "danger");
            return [];
        }
    } catch (error) {
        console.error("Lỗi khi gọi API lấy đơn hàng:", error);
        showToastDanger("Không thể kết nối đến máy chủ", "danger");
        return [];
    }
}

/**
 * Tải và hiển thị danh sách đơn hàng
 */
async function loadOrders() {
    try {
        const orders = await getAPIDonHang();
        renderOrdersTable(orders);
    } catch (error) {
        console.error("Lỗi khi tải đơn hàng:", error);
    }
}

/**
 * Hiển thị danh sách đơn hàng vào bảng
 * @param {Array} orders - Danh sách đơn hàng
 */
function renderOrdersTable(orders) {
    const tableBody = document.getElementById('orderTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-3">
                    <div class="alert alert-info mb-0">
                        <i class="fas fa-info-circle me-2"></i> Không tìm thấy đơn hàng nào
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        
        // Hiển thị loại đơn hàng
        let orderTypeText = '';
        switch (parseInt(order.hinhThuc)) {
            case 0: orderTypeText = '<span class="badge bg-info">Tại quán</span>'; break;
            case 1: orderTypeText = '<span class="badge bg-primary">Trực tuyến</span>'; break;
            default: orderTypeText = '<span class="badge bg-light text-dark">Không xác định</span>';
        }
        
        // Hiển thị trạng thái đơn hàng
        let statusBadge = '';
        switch (parseInt(order.trangThai)) {
            case 0: statusBadge = '<span class="badge bg-warning">Đã hủy</span>'; break;
            case 1: statusBadge = '<span class="badge bg-primary">Đặt thành công</span>'; break;
            case 2: statusBadge = '<span class="badge bg-info">Đã thanh toán</span>'; break;
            case 3: statusBadge = '<span class="badge bg-success">Đang chế biến</span>'; break;
            case 4: statusBadge = '<span class="badge bg-success">Đã chế biến</span>'; break;
            case 5: statusBadge = '<span class="badge bg-danger">Đang giao hàng</span>'; break;
            case 6: statusBadge = '<span class="badge bg-secondary">Đã giao hàng</span>'; break;
            case 7: statusBadge = '<span class="badge bg-warning">Chờ thanh toán</span>'; break;
            default: statusBadge = '<span class="badge bg-secondary">Không xác định</span>';
        }
        
        // Hiển thị phương thức thanh toán
        let paymentMethod = '';
        switch (parseInt(order.thanhToan)) {
            case 0: paymentMethod = 'Tiền mặt'; break;
            case 1: paymentMethod = 'Chuyển khoản'; break;
            default: paymentMethod = 'Không xác định';
        }
        
        // Format ngày đặt hàng
        const orderDate = new Date(order.thoiGianGhi);
        const formattedDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()} ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;
        
        // Lấy thông tin khách hàng
        const customerName = order.KhachHang ? order.KhachHang.ten || 'Khách vãng lai' : 'Khách vãng lai';
        const customerPhone = order.KhachHang ? order.soDienThoaiNhan || '' : '';
        
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${customerName} ${customerPhone ? `<br><small class="text-muted">${customerPhone}</small>` : ''}</td>
            <td>${formattedDate}</td>
            <td>${orderTypeText}</td>
            <td>${order.tongTien?.toLocaleString('vi-VN')}đ</td>
            <td>${statusBadge}</td>
            <td>${paymentMethod}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-primary" data-bs-toggle="modal" data-bs-target="#orderDetailModal" onclick="viewOrderDetails(${order.id})">
                        <i class="fas fa-eye"></i>
                    </button>

                    <button class="btn btn-sm btn-danger" style="margin-left: 8px;" onclick="cancelOrder(${order.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Xem chi tiết đơn hàng
 * @param {number} orderId - ID đơn hàng
 */
function viewOrderDetails(orderId) {
    // Cập nhật ID đơn hàng trong modal
    document.getElementById('modalOrderId').textContent = orderId;
    // Reset nội dung trong modal
    document.getElementById('customerName').textContent = 'Đang tải...';
    document.getElementById('customerPhone').textContent = 'Đang tải...';
    document.getElementById('orderDate').textContent = 'Đang tải...';
    document.getElementById('orderType').textContent = 'Đang tải...';
    document.getElementById('paymentMethod').textContent = 'Đang tải...';
    document.getElementById('orderItemsTable').innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu...</td></tr>';
    document.getElementById('orderSubtotal').textContent = '0đ';
    document.getElementById('orderTotal').textContent = '0đ';
    
    // Xử lý tất cả các lớp backdrop còn sót lại
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.remove();
    });
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    
    // Hiển thị modal
    const orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));
    orderDetailModal.show();
    
    // Tải thông tin chi tiết đơn hàng
    loadOrderDetail(orderId);
}

/**
 * Tải thông tin chi tiết đơn hàng
 * @param {number} orderId - ID đơn hàng
 */
async function loadOrderDetail(orderId) {
    try {
        const response = await fetch(`/api/don-hang-chi-tiet?id=${orderId}`);
        const data = await response.json();
        
        if (data.status) {
            renderOrderDetail(data.order);
        } else {
            document.getElementById('orderItemsTable').innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        ${data.message || 'Không thể tải thông tin đơn hàng'}
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Lỗi khi tải chi tiết đơn hàng:', error);
        document.getElementById('orderItemsTable').innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Đã xảy ra lỗi khi tải thông tin đơn hàng
                </td>
            </tr>
        `;
    }
}

/**
 * Hiển thị chi tiết đơn hàng
 * @param {Object} order - Thông tin đơn hàng
 */
function renderOrderDetail(order) {
    // Format ngày đặt hàng
    const orderDate = new Date(order.thoiGianGhi);
    const formattedDate = `${orderDate.getDate()}/${orderDate.getMonth() + 1}/${orderDate.getFullYear()} ${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;
    
    // Hiển thị thông tin khách hàng
    if (order.KhachHang) {
        document.getElementById('customerName').textContent = order.KhachHang.ten || 'Không có thông tin';
        document.getElementById('customerPhone').textContent = order.soDienThoaiNhan || 'Không có thông tin';
    } else {
        document.getElementById('customerName').textContent = 'Khách vãng lai';
        document.getElementById('customerPhone').textContent = 'Không có thông tin';
    }
    
    // Hiển thị thông tin đơn hàng
    document.getElementById('orderDate').textContent = formattedDate;
    
    // Hiển thị loại đơn hàng
    let orderTypeText = '';
    switch (parseInt(order.hinhThuc)) {
        case 0: orderTypeText = 'Tại quán'; break;
        case 1: orderTypeText = 'Trực tuyến'; break;
        default: orderTypeText = 'Không xác định';
    }
    document.getElementById('orderType').textContent = orderTypeText;
    
    // Hiển thị phương thức thanh toán
    let paymentMethod = '';
    switch (parseInt(order.thanhToan)) {
        case 0: paymentMethod = 'Tiền mặt'; break;
        case 1: paymentMethod = 'Chuyển khoản'; break;
        default: paymentMethod = 'Không xác định';
    }
    document.getElementById('paymentMethod').textContent = paymentMethod;
    document.getElementById('addressOrder').textContent = JSON.parse(order.diaChi) ? JSON.parse(order.diaChi).address : 'Không có thông tin';
    
    // Hiển thị chi tiết các món
    const orderItemsTable = document.getElementById('orderItemsTable');
    orderItemsTable.innerHTML = '';
    
    let subtotal = 0;
    
    if (order.ChiTietDonHangs && order.ChiTietDonHangs.length > 0) {
        order.ChiTietDonHangs.forEach((item) => {
            const monAn = item.MonAn;
            const price = parseFloat(item.gia);
            const quantity = parseInt(item.soLuong);
            const itemTotal = price * quantity;
            subtotal += itemTotal;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${monAn ? monAn.ten : 'Không xác định'}</td>
                <td class="text-center">${quantity}</td>
                <td class="text-end">${price.toLocaleString('vi-VN')}đ</td>
                <td class="text-end">${itemTotal.toLocaleString('vi-VN')}đ</td>
            `;
            orderItemsTable.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">Không có thông tin chi tiết món ăn</td>';
        orderItemsTable.appendChild(row);
    }
    
    // Cập nhật thông tin tổng tiền
    const deliveryFee = order.hinhThuc === 1 ? 20000 : 0; // Nếu đơn trực tuyến có phí ship
    const total = parseFloat(order.tongTien);
    
    document.getElementById('orderSubtotal').textContent = subtotal.toLocaleString('vi-VN') + 'đ';
    document.getElementById('deliveryFee').textContent = deliveryFee.toLocaleString('vi-VN') + 'đ';
    document.getElementById('orderTotal').textContent = total.toLocaleString('vi-VN') + 'đ';

    // Hiển thị lịch sử đơn hàng
    document.getElementById('historyOrderId').textContent = order.id;
    const orderHistoryTable = document.getElementById('orderHistoryTableBody');
    orderHistoryTable.innerHTML = '';
    if(order.LichSu){
        order.LichSu.LichSuChiTiets.forEach((history) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(history.thoiGian).toLocaleString('vi-VN')}</td>
                <td>${history.NhanVien.ten} (ID: ${history.NhanVien.id})</td>
                <td>${history.thaoTac}</td>
            `;
            orderHistoryTable.appendChild(row);
        });
    }
    
}

async function cancelOrder(orderId) {
  if (!orderId) {
    alert("Không có ID đơn hàng để hủy");
    return;
  }

  const confirmCancel = confirm("Bạn có chắc muốn hủy đơn hàng này?");
  if (!confirmCancel) return;
console.log("ID gửi đi:", orderId);

  try {
    const response = await fetch(`/api/phuc-vu-huy-don-hang?id=${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('Response từ server:', data); // thêm dòng này để debug

    if (data.status) {
        
      alert(data.message || "Hủy đơn hàng thành công!");
      loadOrders();
    } else {
      alert(data.message || "Không thể hủy đơn hàng.");
    }
  } catch (error) {
    console.error('Lỗi khi hủy đơn:', error);
    alert("Đã xảy ra lỗi khi hủy đơn hàng.");
  }
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