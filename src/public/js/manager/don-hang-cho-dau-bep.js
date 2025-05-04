document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo dữ liệu mẫu và các chức năng
    loadOrders();
    
    // Gắn sự kiện cho nút làm mới
    const refreshButton = document.getElementById('refresh-orders');
    if (refreshButton) {
        refreshButton.addEventListener('click', loadOrders);
    }
    
    // Gắn sự kiện cho bộ lọc
    const filterButtons = document.querySelectorAll('.filter-status');
    filterButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const status = this.getAttribute('data-status');
            filterOrdersByStatus(status);
        });
    });
});

/**
 * Tải danh sách đơn hàng
 */
function loadOrders() {
    // Trong thực tế, đây sẽ là API call
    // Hiện tại dùng dữ liệu mẫu
    const orders = [
        {
            id: 'DH001',
            table: 'Bàn 05',
            customer: 'Khách lẻ',
            time: '10:30',
            status: 'pending',
            items: [
                { name: 'Bún bò Huế', quantity: 2, note: 'Ít ớt', status: 'pending' },
                { name: 'Cơm gà xối mỡ', quantity: 1, note: '', status: 'pending' }
            ]
        },
        {
            id: 'DH002',
            table: 'Bàn 08',
            customer: 'Nguyễn Văn A',
            time: '10:15',
            status: 'processing',
            items: [
                { name: 'Lẩu hải sản', quantity: 1, note: 'Nhiều rau', status: 'processing' },
                { name: 'Gỏi ngó sen', quantity: 1, note: '', status: 'completed' },
                { name: 'Cá lóc hấp', quantity: 1, note: '', status: 'pending' }
            ]
        },
        {
            id: 'DH003',
            table: 'Bàn 12',
            customer: 'Trần Thị B',
            time: '10:45',
            status: 'completed',
            items: [
                { name: 'Bò lúc lắc', quantity: 2, note: '', status: 'completed' },
                { name: 'Canh chua cá lóc', quantity: 1, note: 'Ít me', status: 'completed' }
            ]
        }
    ];
    
    renderOrders(orders);
}

/**
 * Hiển thị danh sách đơn hàng
 */
function renderOrders(orders) {
    const orderContainer = document.getElementById('order-cards-container');
    if (!orderContainer) return;
    
    orderContainer.innerHTML = '';
    
    if (orders.length === 0) {
        orderContainer.innerHTML = '<div class="text-center p-5"><h5>Không có đơn hàng nào</h5></div>';
        return;
    }
    
    orders.forEach(order => {
        const statusText = getStatusText(order.status);
        const statusClass = getStatusClass(order.status);
        
        const orderCard = document.createElement('div');
        orderCard.className = 'card order-card mb-4';
        orderCard.setAttribute('data-order-id', order.id);
        orderCard.setAttribute('data-status', order.status);
        
        let itemsHtml = '';
        order.items.forEach(item => {
            const itemStatusClass = getStatusClass(item.status);
            const itemStatusText = getStatusText(item.status);
            
            itemsHtml += `
                <tr data-item-id="${order.id}-${item.name}" data-status="${item.status}">
                    <td>${item.name}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td>${item.note || '-'}</td>
                    <td>
                        <span class="badge ${itemStatusClass}">${itemStatusText}</span>
                    </td>
                    <td class="text-end">
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary update-status" data-status="processing">
                                <i class="fas fa-fire"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success update-status" data-status="completed">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        orderCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                    <span class="badge ${statusClass} me-2">${statusText}</span>
                    ${order.id} - ${order.table}
                </h5>
                <div>
                    <span class="text-muted me-3"><i class="far fa-clock me-1"></i>${order.time}</span>
                    <span class="text-muted"><i class="far fa-user me-1"></i>${order.customer}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Tên món</th>
                                <th class="text-center">SL</th>
                                <th>Ghi chú</th>
                                <th>Trạng thái</th>
                                <th class="text-end">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        orderContainer.appendChild(orderCard);
    });
    
    // Gắn sự kiện cho các nút cập nhật trạng thái
    attachUpdateStatusEvents();
}

/**
 * Lọc đơn hàng theo trạng thái
 */
function filterOrdersByStatus(status) {
    const orderCards = document.querySelectorAll('.order-card');
    
    orderCards.forEach(card => {
        if (status === 'all' || card.getAttribute('data-status') === status) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

/**
 * Gắn sự kiện cho các nút cập nhật trạng thái
 */
function attachUpdateStatusEvents() {
    const updateButtons = document.querySelectorAll('.update-status');
    
    updateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const status = this.getAttribute('data-status');
            const row = this.closest('tr');
            const itemId = row.getAttribute('data-item-id');
            
            // Cập nhật trạng thái hiển thị
            row.setAttribute('data-status', status);
            
            const statusCell = row.querySelector('.badge');
            statusCell.className = `badge ${getStatusClass(status)}`;
            statusCell.textContent = getStatusText(status);
            
            // Trong thực tế, gửi API request để cập nhật trạng thái
            console.log(`Cập nhật món ${itemId} sang trạng thái: ${status}`);
            
            // Kiểm tra và cập nhật trạng thái đơn hàng
            updateOrderStatus(row.closest('.order-card'));
        });
    });
}

/**
 * Cập nhật trạng thái tổng thể của đơn hàng
 */
function updateOrderStatus(orderCard) {
    const items = orderCard.querySelectorAll('tbody tr');
    let allCompleted = true;
    let anyProcessing = false;
    
    items.forEach(item => {
        const status = item.getAttribute('data-status');
        if (status !== 'completed') {
            allCompleted = false;
        }
        if (status === 'processing') {
            anyProcessing = true;
        }
    });
    
    let newStatus = 'pending';
    if (allCompleted) {
        newStatus = 'completed';
    } else if (anyProcessing) {
        newStatus = 'processing';
    }
    
    // Cập nhật trạng thái đơn hàng
    orderCard.setAttribute('data-status', newStatus);
    
    const statusBadge = orderCard.querySelector('.card-header .badge');
    statusBadge.className = `badge ${getStatusClass(newStatus)} me-2`;
    statusBadge.textContent = getStatusText(newStatus);
    
    // Trong thực tế, gửi API request để cập nhật trạng thái đơn hàng
    console.log(`Cập nhật đơn hàng ${orderCard.getAttribute('data-order-id')} sang trạng thái: ${newStatus}`);
}

/**
 * Lấy text hiển thị cho trạng thái
 */
function getStatusText(status) {
    switch (status) {
        case 'pending': return 'Chờ xử lý';
        case 'processing': return 'Đang chế biến';
        case 'completed': return 'Hoàn thành';
        default: return 'Không xác định';
    }
}

/**
 * Lấy class CSS cho trạng thái
 */
function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'bg-warning';
        case 'processing': return 'bg-primary';
        case 'completed': return 'bg-success';
        default: return 'bg-secondary';
    }
}