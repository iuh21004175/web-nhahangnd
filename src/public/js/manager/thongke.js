// Hiển thị/ẩn nút Xem chi tiết tùy thuộc vào trạng thái bàn
function updateTableActionButtons() {
    // Lấy tất cả các card bàn
    document.querySelectorAll('.table-card').forEach(tableCard => {
        const statusElement = tableCard.querySelector('.table-status');
        const viewOrderBtn = tableCard.querySelector('.view-order-btn');
        
        // Kiểm tra xem bàn có đang sử dụng không
        const isOccupied = statusElement.classList.contains('occupied');
        
        // Hiển thị nút xem chi tiết nếu bàn đang sử dụng
        if (viewOrderBtn) {
            viewOrderBtn.style.display = isOccupied ? 'inline-block' : 'none';
        }
    });
}

let firstOrderTime = {}; // Biến toàn cục lưu thời gian bắt đầu có đơn hàng

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo ứng dụng
    initializeApp();
    const viewOrderModal = document.getElementById('viewOrderModal');
    if (viewOrderModal) {
        viewOrderModal.addEventListener('show.bs.modal', function(event) {
            // Lấy nút đã kích hoạt modal
            const button = event.relatedTarget;
            
            // Lấy thông tin bàn từ thuộc tính data
            const tableId = button.getAttribute('data-table-id');
            
            // Lấy tên bàn từ card bàn
            const tableCard = button.closest('.table-card');
            const tableName = tableCard.querySelector('.table-name').textContent;
            
            // Cập nhật tiêu đề modal
            document.getElementById('orderTableName').textContent = tableName;
            
            // Trong thực tế, bạn sẽ gọi API để lấy thông tin đơn hàng dựa trên tableId
            // fetchOrderDetails(tableId).then(data => updateOrderModal(data));
            
            // Mã giả để mô phỏng việc lấy dữ liệu
            console.log(`Lấy thông tin đơn hàng cho bàn ${tableId}: ${tableName}`);
        });
    }
    
    // Khởi tạo tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-tooltip="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Cập nhật trạng thái các nút khi trang được tải
    updateTableActionButtons();

    // --- Thêm đoạn này vào ---
    const topDishes = [
        { name: "Cơm gà", sold: 120 },
        { name: "Lẩu thái", sold: 95 },
        { name: "Bò lúc lắc", sold: 80 }
    ];
    const topDishesList = document.getElementById('topDishesList');
    if (topDishesList) {
        topDishes.forEach(dish => {
            const li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.innerHTML = `${dish.name} <span class="badge bg-primary rounded-pill">${dish.sold}</span>`;
            topDishesList.appendChild(li);
        });
    }
    // --- Kết thúc đoạn thêm ---

    // Gọi hàm cập nhật label kỳ khi trang vừa load
    updateSummaryDataByFilter();

    // Nếu muốn cập nhật lại khi người dùng thay đổi bộ lọc thời gian:
    document.getElementById('timeFilter').addEventListener('change', updateSummaryDataByFilter);
    document.getElementById('dayFilter').addEventListener('change', updateSummaryDataByFilter);
    document.getElementById('monthFilter').addEventListener('change', updateSummaryDataByFilter);
    document.getElementById('yearFilter').addEventListener('change', updateSummaryDataByFilter);
    document.getElementById('weekFilter').addEventListener('change', updateSummaryDataByFilter);

    // Giới hạn chọn ngày, tuần, tháng, năm theo thời gian có đơn hàng đầu tiên
    fetch('/api/thoi-gian-bat-dau-co-don-hang')
        .then(res => res.json())
        .then(data => {
            if (data.status) {
                // Lưu lại để so sánh sau này
                firstOrderTime = data;
                // Ngày
                const dayFilter = document.getElementById('dayFilter');
                if (dayFilter && data.day) {
                    dayFilter.min = data.day;
                    const today = new Date().toISOString().slice(0, 10);
                    dayFilter.max = today;
                }

                // Tuần
                const weekFilter = document.getElementById('weekFilter');
                if (weekFilter && data.week) {
                    weekFilter.min = data.week;
                    // Tuần hiện tại
                    const now = new Date();
                    const year = now.getFullYear();
                    const firstDayOfYear = new Date(year, 0, 1);
                    const pastDaysOfYear = (now - firstDayOfYear) / 86400000;
                    const week = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
                    weekFilter.max = `${year}-W${week.toString().padStart(2, '0')}`;
                }

                // Tháng
                const monthFilter = document.getElementById('monthFilter');
                if (monthFilter && data.month) {
                    monthFilter.min = data.month;
                    const now = new Date();
                    const month = (now.getMonth() + 1).toString().padStart(2, '0');
                    const year = now.getFullYear();
                    monthFilter.max = `${year}-${month}`;
                }

                // Năm
                const yearFilter = document.getElementById('yearFilter');
                if (yearFilter && data.year) {
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    // Disable các option không hợp lệ
                    Array.from(yearFilter.options).forEach(opt => {
                        if (parseInt(opt.value) < parseInt(data.year) || parseInt(opt.value) > currentYear) {
                            opt.disabled = true;
                        } else {
                            opt.disabled = false;
                        }
                    });
                }
            }
        });

    updateSummaryDataByFilter();

    updateRevenueByTimeChart();

    document.getElementById('timeFilter').addEventListener('change', updateRevenueByTimeChart);
    document.getElementById('dayFilter').addEventListener('change', updateRevenueByTimeChart);
    document.getElementById('weekFilter').addEventListener('change', updateRevenueByTimeChart);
    document.getElementById('monthFilter').addEventListener('change', updateRevenueByTimeChart);
    document.getElementById('yearFilter').addEventListener('change', updateRevenueByTimeChart);

    updateRevenueByTimeSlotChart();

    document.getElementById('timeFilter').addEventListener('change', updateRevenueByTimeSlotChart);
    document.getElementById('dayFilter').addEventListener('change', updateRevenueByTimeSlotChart);
    document.getElementById('weekFilter').addEventListener('change', updateRevenueByTimeSlotChart);
    document.getElementById('monthFilter').addEventListener('change', updateRevenueByTimeSlotChart);
    document.getElementById('yearFilter').addEventListener('change', updateRevenueByTimeSlotChart);

    // Thêm code mới để cập nhật biểu đồ doanh thu theo danh mục
    updateCategoryRevenueChart();

    // Thêm event listeners để cập nhật biểu đồ khi thay đổi bộ lọc
    document.getElementById('timeFilter').addEventListener('change', updateCategoryRevenueChart);
    document.getElementById('dayFilter').addEventListener('change', updateCategoryRevenueChart);
    document.getElementById('weekFilter').addEventListener('change', updateCategoryRevenueChart);
    document.getElementById('monthFilter').addEventListener('change', updateCategoryRevenueChart);
    document.getElementById('yearFilter').addEventListener('change', updateCategoryRevenueChart);

    // Thêm event listeners để cập nhật danh sách top 5 món bán chạy
    document.getElementById('timeFilter').addEventListener('change', updateTop5DishesList);
    document.getElementById('dayFilter').addEventListener('change', updateTop5DishesList);
    document.getElementById('weekFilter').addEventListener('change', updateTop5DishesList);
    document.getElementById('monthFilter').addEventListener('change', updateTop5DishesList);
    document.getElementById('yearFilter').addEventListener('change', updateTop5DishesList);

    // Cập nhật Top 5 món bán chạy
    updateTop5DishesList();

    // Thêm event listeners để cập nhật bảng thống kê chi tiết doanh thu
    document.getElementById('timeFilter').addEventListener('change', updateRevenueDetailTable);
    document.getElementById('dayFilter').addEventListener('change', updateRevenueDetailTable);
    document.getElementById('weekFilter').addEventListener('change', updateRevenueDetailTable);
    document.getElementById('monthFilter').addEventListener('change', updateRevenueDetailTable);
    document.getElementById('yearFilter').addEventListener('change', updateRevenueDetailTable);

    // Cập nhật bảng thống kê chi tiết doanh thu
    updateRevenueDetailTable();

    // Khởi tạo các chức năng điều hướng thời gian
    initializeTimeNavigation();

    // Xử lý sự kiện người dùng nhấn nút xuất báo cáo
    const exportReportBtn = document.getElementById('exportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', function() {
            // Lưu lại nội dung gốc của nút
            const originalButtonContent = this.innerHTML;
            
            // Thay đổi nội dung nút thành spinner + "Đang xuất báo cáo..."
            this.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span class="ms-1">Đang xuất báo cáo...</span>
            `;
            this.disabled = true; // Vô hiệu hóa nút để tránh nhấn nhiều lần
        
            // Tạo overlay với spinner ở giữa màn hình
            const overlay = document.createElement('div');
            overlay.className = 'export-overlay';
            overlay.innerHTML = `
                <div class="export-progress">
                    <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;"></div>
                    <div class="mt-3 text-light">Đang tạo báo cáo...</div>
                    <div class="progress mt-2" style="height: 10px; width: 200px;">
                        <div class="progress-bar progress-bar-animated" role="progressbar" style="width: 0%"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            
            // Thêm CSS cho overlay vào trang
            const style = document.createElement('style');
            style.textContent = `
                .export-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.6);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .export-progress {
                    text-align: center;
                    padding: 20px;
                    border-radius: 5px;
                    background-color: rgba(0, 0, 0, 0.6);
                }
            `;
            document.head.appendChild(style);

            // Cập nhật thanh tiến trình
            const progressBar = overlay.querySelector('.progress-bar');
            progressBar.style.width = '25%';
            
            // Gọi API để xuất báo cáo
            Promise.all([
                getSvg(document.getElementById('currentPeriodCard')),
                getSvg(document.getElementById('revenueByTimeChart')),
                getSvg(document.getElementById('hourlyRevenueChart')),
                getSvg(document.getElementById('categoryRevenueCard')),
                getSvg(document.getElementById('topDishesList')),
                getSvg(document.getElementById('revenueDetailCard'))
            ]).then(results => {
                progressBar.style.width = '50%';
                let reportTypeDate;
                let reportDate;
                const timeFilter = document.getElementById('timeFilter').value;
                if (timeFilter === 'day') {
                    const date = new Date(document.getElementById('dayFilter').value);
                    const formattedDate = date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    reportTypeDate = 'Ngày';
                    reportDate = formattedDate;
                } else if (timeFilter === 'week') {
                    const [weekYear, weekNum] = document.getElementById('weekFilter').value.split('-W');
                    reportTypeDate = 'Tuần';
                    reportDate = weekNum + ', ' + weekYear;
                } else if (timeFilter === 'month') {
                    const [monthYear, month] = document.getElementById('monthFilter').value.split('-');
                    reportTypeDate = 'Tháng';
                    reportDate = month + '/' + monthYear;
                } else if (timeFilter === 'year') {
                    reportTypeDate = 'Năm';
                    reportDate = document.getElementById('yearFilter').value;
                }
                const payload = {
                    files: [
                        { name: 'tong-quat.svg', content: results[0] },
                        { name: 'doanh-thu-theo-thoi-gian.svg', content: results[1] },
                        { name: 'doanh-thu-theo-khung-gio.svg', content: results[2] },
                        { name: 'ti-le-doanh-thu-theo-danh-muc.svg', content: results[3] },
                        { name: 'top-5-mon.svg', content: results[4] },
                        { name: 'chi-tiet-doanh-thu.svg', content: results[5] },
                    ],
                    type: reportTypeDate,
                    value: reportDate
                };
            
                fetch('/api/xuat-bao-cao', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                })
                .then(res => {
                    progressBar.style.width = '75%';
                    return res.json();  // 👉 Lấy response dạng JSON
                })
                .then(data => {
                    progressBar.style.width = '100%';
            
                    setTimeout(() => {
                        // Xóa overlay
                        document.body.removeChild(overlay);
            
                        // Khôi phục trạng thái nút
                        exportReportBtn.innerHTML = originalButtonContent;
                        exportReportBtn.disabled = false;
            
                        // Hiển thị thông báo thành công (có thể in ra data nếu cần)
                        console.log('Dữ liệu báo cáo trả về:', data);
                        showNotification('Xuất báo cáo thành công!', 'success');
                        window.location.href = data.href; // Chuyển hướng đến file báo cáo đã xuất
                    }, 500);
                })
                .catch(error => {
                    console.error('Lỗi khi xuất báo cáo:', error);
            
                    // Xóa overlay
                    document.body.removeChild(overlay);
            
                    // Khôi phục trạng thái nút
                    exportReportBtn.innerHTML = originalButtonContent;
                    exportReportBtn.disabled = false;
            
                    // Hiển thị thông báo lỗi
                    showNotification('Đã xảy ra lỗi khi xuất báo cáo. Vui lòng thử lại sau.', 'danger');
                });
            });
        })
            
    }
});

/**
 * Cập nhật bảng thống kê chi tiết doanh thu
 */
function updateRevenueDetailTable() {
    const timeFilter = document.getElementById('timeFilter').value;
    let value = '';
    
    // Lấy giá trị filter tùy theo loại thời gian
    if (timeFilter === 'day') {
        value = document.getElementById('dayFilter').value;
    } else if (timeFilter === 'week') {
        value = document.getElementById('weekFilter').value;
    } else if (timeFilter === 'month') {
        value = document.getElementById('monthFilter').value;
    } else if (timeFilter === 'year') {
        value = document.getElementById('yearFilter').value;
    }
    
    // Hiển thị loading
    const revenueDetailTableBody = document.getElementById('revenueDetailTableBody');
    if (revenueDetailTableBody) {
        revenueDetailTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-secondary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                    <span class="ms-2">Đang tải dữ liệu...</span>
                </td>
            </tr>
        `;
    }
    
    // Cập nhật tiêu đề bảng tùy theo loại thời gian
    updateRevenueDetailTableTitle(timeFilter, value);
    
    // Gọi API lấy dữ liệu thống kê chi tiết
    fetch(`/api/thong-ke-chi-tiet-doanh-thu?type=${timeFilter}&value=${value}`)
        .then(res => res.json())
        .then(data => {
            if (!data.status) {
                showNotification('Lỗi khi tải dữ liệu thống kê chi tiết', 'danger');
                if (revenueDetailTableBody) {
                    revenueDetailTableBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center text-danger py-3">
                                <i class="fas fa-exclamation-circle me-2"></i>
                                Không thể tải dữ liệu
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            
            // Kiểm tra có dữ liệu không
            if (!data.data || !data.data.chiTiet || data.data.chiTiet.length === 0) {
                if (revenueDetailTableBody) {
                    revenueDetailTableBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center text-muted py-3">
                                &#9432; Không có dữ liệu cho ${getTimeFilterLabel(timeFilter, value)}
                            </td>
                        </tr>
                    `;
                }
                return;
            }
            
            // Cập nhật bảng
            if (revenueDetailTableBody) {
                // Xóa nội dung cũ
                revenueDetailTableBody.innerHTML = '';
                
                // Lặp qua tất cả các item (khung giờ/ngày/tháng) và tạo các hàng tương ứng
                data.data.chiTiet.forEach(item => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${item.thoiGian}</td>
                        <td class="text-center">${item.soLuongDon}</td>
                        <td class="text-end">${formatCurrency(item.doanhThu)}</td>
                        <td class="text-center">
                            <div class="d-flex align-items-center">
                                <div class="progress flex-grow-1" style="height: 6px;">
                                    <div class="progress-bar" role="progressbar" style="width: ${item.phanTram}%;" 
                                        aria-valuenow="${item.phanTram}" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <span class="ms-2">${item.phanTram}%</span>
                            </div>
                        </td>
                    `;
                    
                    revenueDetailTableBody.appendChild(row);
                });
                
                // Thêm hàng tổng kết
                const totalRow = document.createElement('tr');
                totalRow.className = 'table-secondary fw-bold';
                totalRow.innerHTML = `
                    <td>Tổng cộng</td>
                    <td class="text-center">${data.data.chiTiet.reduce((sum, item) => sum + item.soLuongDon, 0)}</td>
                    <td class="text-end">${formatCurrency(data.data.tongDoanhThu)}</td>
                    <td class="text-center">100%</td>
                `;
                
                revenueDetailTableBody.appendChild(totalRow);
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu thống kê chi tiết:', error);
            showNotification('Đã xảy ra lỗi khi tải dữ liệu', 'danger');
            if (revenueDetailTableBody) {
                revenueDetailTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-danger py-3">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Không thể tải dữ liệu
                        </td>
                    </tr>
                `;
            }
        });
}

/**
 * Cập nhật tiêu đề bảng thống kê chi tiết doanh thu
 */
function updateRevenueDetailTableTitle(timeFilter, value) {
    const titleElement = document.getElementById('revenueDetailTableTitle');
    const headingElement = document.getElementById('revenueDetailTimeHeading');
    
    if (!titleElement || !headingElement) return;
    
    let title = '';
    let heading = 'Thời gian';
    
    switch (timeFilter) {
        case 'day':
            const date = new Date(value);
            const formattedDate = date.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            title = `Chi tiết doanh thu theo khung giờ - ${formattedDate}`;
            heading = 'Khung giờ';
            break;
        case 'week':
            const [weekYear, weekNum] = value.split('-W');
            title = `Chi tiết doanh thu theo ngày - Tuần ${weekNum}, ${weekYear}`;
            heading = 'Ngày trong tuần';
            break;
        case 'month':
            const [monthYear, month] = value.split('-');
            title = `Chi tiết doanh thu theo ngày - Tháng ${month}/${monthYear}`;
            heading = 'Ngày';
            break;
        case 'year':
            title = `Chi tiết doanh thu theo tháng - Năm ${value}`;
            heading = 'Tháng';
            break;
    }
    
    titleElement.textContent = title;
    headingElement.textContent = heading;
}

/**
 * Thêm overlay thông báo không có dữ liệu lên biểu đồ
 */
function addNoDataOverlay(chartId, message) {
    // Xóa overlay cũ nếu có
    removeNoDataOverlay(chartId);
    
    const chartContainer = document.getElementById(chartId).parentNode;
    chartContainer.style.position = 'relative';
    
    // Tạo overlay
    const overlay = document.createElement('div');
    overlay.className = 'no-data-overlay';
    overlay.innerHTML = `
        <div class="no-data-content">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chart-pie-2 mb-3 opacity-25" width="48" height="48" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 3v9h9" />
                <path d="M12 12l-8.5 3.5" />
                <path d="M12 12l2.5 8.5" />
            </svg>
            <p>${message}</p>
        </div>
    `;
    
    // Thêm overlay vào container
    chartContainer.appendChild(overlay);
}

/**
 * Xóa overlay thông báo
 */
function removeNoDataOverlay(chartId) {
    const chartContainer = document.getElementById(chartId).parentNode;
    const existingOverlay = chartContainer.querySelector('.no-data-overlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
}

/**
 * Hiển thị thông báo loading
 */
function showLoading(show) {
    const loadingElement = document.getElementById('loadingOverlay');
    if (loadingElement) {
        if (show) {
            loadingElement.style.display = 'flex';
        } else {
            loadingElement.style.display = 'none';
        }
    }
}

/**
 * Hiển thị thông báo
 */
function showNotification(message, type = 'info') {
    // Kiểm tra xem đã có container thông báo chưa
    let notificationContainer = document.getElementById('notificationContainer');
    
    // Nếu chưa có, tạo mới container
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Tạo thông báo mới
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    // Thêm sự kiện đóng thông báo
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', function() {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Thêm thông báo vào container
    notificationContainer.appendChild(notification);
    
    // Tự động đóng thông báo sau 5 giây
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

/**
 * Lấy icon cho thông báo
 */
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'fas fa-check-circle';
        case 'warning':
            return 'fas fa-exclamation-circle';
        case 'danger':
            return 'fas fa-times-circle';
        case 'info':
        default:
            return 'fas fa-info-circle';
    }
}

/**
 * Định dạng tiền tệ
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Cập nhật bảng dữ liệu danh mục
 */
function updateCategoryTable(categories) {
    const tableBody = document.querySelector('#categoryTable tbody');
    if (!tableBody) return;
    
    // Xóa nội dung hiện tại
    tableBody.innerHTML = '';
    
    // Sắp xếp danh mục theo doanh thu giảm dần
    const sortedCategories = [...categories].sort((a, b) => b.doanhThu - a.doanhThu);
    
    // Thêm dữ liệu mới
    sortedCategories.forEach((category, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${category.tenDanhMuc}</td>
            <td class="text-end">${formatCurrency(category.doanhThu)}</td>
            <td class="text-center">${category.soLuongDonHang || 0}</td>
            <td class="text-center">${category.soLuongMon || 0}</td>
            <td class="text-center">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${category.tyLePhanTram}%;" 
                        aria-valuenow="${category.tyLePhanTram}" aria-valuemin="0" aria-valuemax="100">
                        ${category.tyLePhanTram.toFixed(2)}%
                    </div>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Khởi tạo toàn bộ ứng dụng
 */
function initializeApp() {
    // Khởi tạo bộ lọc và sự kiện
    initializeFilters();
    
    // Cập nhật dữ liệu tổng quan ban đầu
    updateSummaryData();
    
    // Khởi tạo biểu đồ
    initializeCharts();
    
    // Thêm sự kiện cho nút Áp dụng
    const applyFilterBtn = document.getElementById('applyFilter');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            applyFilters();
        });
    }
    
    // Thêm sự kiện cho nút Xuất báo cáo
    const exportReportBtn = document.getElementById('exportReport');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', function(e) {
            const dataUrl = getSvgDataUrl()
        });
    }
}

/**
 * Khởi tạo các chức năng điều hướng thời gian
 */
function initializeTimeNavigation() {
    // Xóa các sự kiện cũ trước khi thêm mới để tránh trùng lặp
    
    // Điều hướng ngày
    const prevDayBtn = document.getElementById('prevDayBtn');
    const nextDayBtn = document.getElementById('nextDayBtn');
    
    // Xóa tất cả event listeners cũ bằng cách clone và thay thế element
    if (prevDayBtn) {
        const newPrevDayBtn = prevDayBtn.cloneNode(true);
        prevDayBtn.parentNode.replaceChild(newPrevDayBtn, prevDayBtn);
        newPrevDayBtn.addEventListener('click', function() {
            navigateTime('day', 'prev');
        });
    }
    
    if (nextDayBtn) {
        const newNextDayBtn = nextDayBtn.cloneNode(true);
        nextDayBtn.parentNode.replaceChild(newNextDayBtn, nextDayBtn);
        newNextDayBtn.addEventListener('click', function() {
            navigateTime('day', 'next');
        });
    }
    
    // Điều hướng tuần
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    
    if (prevWeekBtn) {
        const newPrevWeekBtn = prevWeekBtn.cloneNode(true);
        prevWeekBtn.parentNode.replaceChild(newPrevWeekBtn, prevWeekBtn);
        newPrevWeekBtn.addEventListener('click', function() {
            navigateTime('week', 'prev');
        });
    }
    
    if (nextWeekBtn) {
        const newNextWeekBtn = nextWeekBtn.cloneNode(true);
        nextWeekBtn.parentNode.replaceChild(newNextWeekBtn, nextWeekBtn);
        newNextWeekBtn.addEventListener('click', function() {
            navigateTime('week', 'next');
        });
    }
    
    // Điều hướng tháng
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    if (prevMonthBtn) {
        const newPrevMonthBtn = prevMonthBtn.cloneNode(true);
        prevMonthBtn.parentNode.replaceChild(newPrevMonthBtn, prevMonthBtn);
        newPrevMonthBtn.addEventListener('click', function() {
            navigateTime('month', 'prev');
        });
    }
    
    if (nextMonthBtn) {
        const newNextMonthBtn = nextMonthBtn.cloneNode(true);
        nextMonthBtn.parentNode.replaceChild(newNextMonthBtn, nextMonthBtn);
        newNextMonthBtn.addEventListener('click', function() {
            navigateTime('month', 'next');
        });
    }
    
    // Điều hướng năm
    const prevYearBtn = document.getElementById('prevYearBtn');
    const nextYearBtn = document.getElementById('nextYearBtn');
    
    if (prevYearBtn) {
        const newPrevYearBtn = prevYearBtn.cloneNode(true);
        prevYearBtn.parentNode.replaceChild(newPrevYearBtn, prevYearBtn);
        newPrevYearBtn.addEventListener('click', function() {
            navigateTime('year', 'prev');
        });
    }
    
    if (nextYearBtn) {
        const newNextYearBtn = nextYearBtn.cloneNode(true);
        nextYearBtn.parentNode.replaceChild(newNextYearBtn, nextYearBtn);
        newNextYearBtn.addEventListener('click', function() {
            navigateTime('year', 'next');
        });
    }
}

/**
 * Điều hướng thời gian (ngày/tuần/tháng/năm trước hoặc sau)
 * @param {string} type - Loại thời gian (day, week, month, year)
 * @param {string} direction - Hướng điều hướng (prev, next)
 */
function navigateTime(type, direction) {
    const today = new Date();
    const isNext = direction === 'next';
    
    switch(type) {
        case 'day':
            const dayFilter = document.getElementById('dayFilter');
            let day = new Date(dayFilter.value);
            
            // Kiểm tra giới hạn - không cho chọn ngày tương lai
            if (isNext && day >= new Date(today.setHours(0, 0, 0, 0))) {
                showNotification('Không thể chọn ngày trong tương lai', 'warning');
                return;
            }
            
            // Điều chỉnh ngày
            day.setDate(day.getDate() + (isNext ? 1 : -1));
            
            // Kiểm tra giới hạn - không cho chọn ngày trước ngày đầu tiên có đơn hàng
            if (!isNext && firstOrderTime.day && day < new Date(firstOrderTime.day)) {
                showNotification('Đã đến giới hạn dữ liệu', 'warning');
                return;
            }
            
            dayFilter.value = day.toISOString().split('T')[0];
            dayFilter.dispatchEvent(new Event('change'));
            break;
            
        case 'week':
            const weekFilter = document.getElementById('weekFilter');
            let [weekYear, weekNum] = weekFilter.value.split('-W').map(Number);
            
            // Điều chỉnh tuần
            if (isNext) {
                weekNum++;
                if (weekNum > 52) {
                    weekNum = 1;
                    weekYear++;
                }
            } else {
                weekNum--;
                if (weekNum < 1) {
                    weekNum = 52;
                    weekYear--;
                }
            }
            
            // Kiểm tra giới hạn - tương lai
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentWeek = getWeekNumber(currentDate);
            
            if (isNext && (weekYear > currentYear || (weekYear === currentYear && weekNum > currentWeek))) {
                showNotification('Không thể chọn tuần trong tương lai', 'warning');
                return;
            }
            
            // Kiểm tra giới hạn - quá khứ
            if (!isNext && firstOrderTime.week) {
                const [firstYear, firstWeek] = firstOrderTime.week.split('-W').map(Number);
                if (weekYear < firstYear || (weekYear === firstYear && weekNum < firstWeek)) {
                    showNotification('Đã đến giới hạn dữ liệu', 'warning');
                    return;
                }
            }
            
            weekFilter.value = `${weekYear}-W${weekNum.toString().padStart(2, '0')}`;
            weekFilter.dispatchEvent(new Event('change'));
            break;
            
        case 'month':
            const monthFilter = document.getElementById('monthFilter');
            let [monthYear, month] = monthFilter.value.split('-').map(Number);
            
            // Điều chỉnh tháng
            if (isNext) {
                month++;
                if (month > 12) {
                    month = 1;
                    monthYear++;
                }
            } else {
                month--;
                if (month < 1) {
                    month = 12;
                    monthYear--;
                }
            }
            
            // Kiểm tra giới hạn - tương lai
            if (isNext && (monthYear > today.getFullYear() || 
                          (monthYear === today.getFullYear() && month > today.getMonth() + 1))) {
                showNotification('Không thể chọn tháng trong tương lai', 'warning');
                return;
            }
            
            // Kiểm tra giới hạn - quá khứ
            if (!isNext && firstOrderTime.month) {
                const [firstYear, firstMonth] = firstOrderTime.month.split('-').map(Number);
                if (monthYear < firstYear || (monthYear === firstYear && month < firstMonth)) {
                    showNotification('Đã đến giới hạn dữ liệu', 'warning');
                    return;
                }
            }
            
            monthFilter.value = `${monthYear}-${month.toString().padStart(2, '0')}`;
            monthFilter.dispatchEvent(new Event('change'));
            break;
            
        case 'year':
            const yearFilter = document.getElementById('yearFilter');
            let year = parseInt(yearFilter.value);
            
            // Điều chỉnh năm
            year = year + (isNext ? 1 : -1);
            
            // Kiểm tra giới hạn - tương lai
            if (isNext && year > today.getFullYear()) {
                showNotification('Không thể chọn năm trong tương lai', 'warning');
                return;
            }
            
            // Kiểm tra giới hạn - quá khứ
            if (!isNext && firstOrderTime.year && year < parseInt(firstOrderTime.year)) {
                showNotification('Đã đến giới hạn dữ liệu', 'warning');
                return;
            }
            
            // Tìm option phù hợp (nếu có)
            let found = false;
            for (let option of yearFilter.options) {
                if (parseInt(option.value) === year) {
                    yearFilter.value = year.toString();
                    found = true;
                    break;
                }
            }
            
            // Nếu không tìm thấy, tạo mới option
            if (!found) {
                const option = document.createElement('option');
                option.value = year.toString();
                option.textContent = year.toString();
                yearFilter.add(option);
                yearFilter.value = year.toString();
            }
            
            yearFilter.dispatchEvent(new Event('change'));
            break;
    }
}

/**
 * Lấy số tuần trong năm của một ngày
 * @param {Date} date - Ngày cần lấy số tuần
 * @returns {number} Số tuần trong năm
 */
function getWeekNumber(date) {
    // Sao chép ngày để không làm thay đổi tham số đầu vào
    const d = new Date(date);
    
    // Đặt về ngày đầu tiên trong tuần (thứ 2)
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    
    // Lấy ngày đầu tiên của năm
    const firstWeek = new Date(d.getFullYear(), 0, 4);
    
    // Điều chỉnh về ngày đầu tuần chứa ngày 4/1
    firstWeek.setDate(firstWeek.getDate() + 3 - ((firstWeek.getDay() + 6) % 7));
    
    // Tính số mili giây giữa ngày được chọn và ngày đầu tuần của tuần đầu năm
    // Chia cho 7 ngày để có số tuần
    const weekNum = Math.round(((d - firstWeek) / 86400000) / 7) + 1;
    
    return weekNum;
}

/**
 * Khởi tạo bộ lọc và các sự kiện liên quan
 */
function initializeFilters() {
    const timeFilter = document.getElementById('timeFilter');
    const dayFilterGroup = document.getElementById('dayFilterGroup');
    const monthFilterGroup = document.getElementById('monthFilterGroup');
    const yearFilterGroup = document.getElementById('yearFilterGroup');
    const categoryFilter = document.getElementById('categoryFilter');

    // Khởi tạo giá trị mặc định cho ngày
    if (dayFilterGroup) {
        const today = new Date().toISOString().split('T')[0];
        const dayFilter = document.getElementById('dayFilter');
        if (dayFilter) dayFilter.value = today;
    }

    // Khởi tạo giá trị mặc định cho tháng
    const monthFilter = document.getElementById('monthFilter');
    if (monthFilter) {
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const year = now.getFullYear();
        monthFilter.value = `${year}-${month}`;
    }

    // Khởi tạo giá trị mặc định cho năm
    const yearFilter = document.getElementById('yearFilter');
    if (yearFilter) {
        const now = new Date();
        const year = now.getFullYear().toString();
        yearFilter.value = year;
    }

    // Sửa phần khởi tạo giá trị mặc định cho tuần
    const weekFilter = document.getElementById('weekFilter');
    if (weekFilter) {
        const now = new Date();
        const year = now.getFullYear();
        
        // Đúng chuẩn ISO 8601
        const d = new Date(now);
        // Đặt về thứ Năm của tuần (để tính đúng chuẩn ISO)
        d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
        // Lấy ngày đầu tiên của năm
        const firstWeek = new Date(d.getFullYear(), 0, 4);
        // Điều chỉnh về thứ Năm đầu tiên của tuần đầu năm
        firstWeek.setDate(firstWeek.getDate() + 3 - ((firstWeek.getDay() + 6) % 7));
        
        // Tính số tuần
        const weekNum = Math.ceil((((d - firstWeek) / 86400000) + 1) / 7);
        
        weekFilter.value = `${year}-W${weekNum.toString().padStart(2, '0')}`;
    }

    // Hiển thị bộ lọc phù hợp với lựa chọn
    if (timeFilter) {
        // Khởi tạo hiển thị ban đầu
        showRelevantDateFilter(timeFilter.value);
        
        // Thêm event listener cho sự kiện thay đổi
        timeFilter.addEventListener('change', function() {
            showRelevantDateFilter(this.value);

            // Nếu chọn lại "Theo tháng" thì set lại tháng hiện tại
            if (this.value === 'month' && monthFilter) {
                const now = new Date();
                const month = (now.getMonth() + 1).toString().padStart(2, '0');
                const year = now.getFullYear();
                monthFilter.value = `${year}-${month}`;
            }
            // Nếu chọn lại "Theo năm" thì set lại năm hiện tại
            if (this.value === 'year' && yearFilter) {
                const now = new Date();
                const year = now.getFullYear().toString();
                yearFilter.value = year;
            }
        });
    }
    
    // Thêm dữ liệu cho bộ lọc danh mục
    if (categoryFilter) {
        populateCategoryFilter();
    }
    
    // Khởi tạo chức năng điều hướng thời gian
    initializeTimeNavigation();
}

/**
 * Hiển thị bộ lọc thời gian phù hợp dựa trên lựa chọn
 */
function showRelevantDateFilter(timeFilterValue) {
    const dayFilterGroup = document.getElementById('dayFilterGroup');
    const weekFilterGroup = document.getElementById('weekFilterGroup');
    const monthFilterGroup = document.getElementById('monthFilterGroup');
    const yearFilterGroup = document.getElementById('yearFilterGroup');
    
    // Ẩn tất cả các nhóm bộ lọc
    if (dayFilterGroup) dayFilterGroup.style.display = 'none';
    if (weekFilterGroup) weekFilterGroup.style.display = 'none';
    if (monthFilterGroup) monthFilterGroup.style.display = 'none';
    if (yearFilterGroup) yearFilterGroup.style.display = 'none';
    
    // Hiển thị bộ lọc thích hợp
    switch(timeFilterValue) {
        case 'day':
            if (dayFilterGroup) dayFilterGroup.style.display = 'block';
            break;
        case 'week':
            if (weekFilterGroup) weekFilterGroup.style.display = 'block';
            break;
        case 'month':
            if (monthFilterGroup) monthFilterGroup.style.display = 'block';
            break;
        case 'year':
            if (yearFilterGroup) yearFilterGroup.style.display = 'block';
            break;
    }
}

/**
 * Điền dữ liệu cho bộ lọc danh mục
 */
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    
    // Dữ liệu mẫu - trong thực tế sẽ được lấy từ API
    const categories = [
        { id: 'all', name: 'Tất cả danh mục' },
        { id: 'main', name: 'Món chính' },
        { id: 'appetizer', name: 'Khai vị' },
        { id: 'dessert', name: 'Tráng miệng' },
        { id: 'drink', name: 'Đồ uống' }
    ];
    
    // Xóa tất cả các option hiện tại
    categoryFilter.innerHTML = '';
    
    // Thêm các option mới
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

/**
 * Áp dụng bộ lọc và tải lại dữ liệu
 */
function applyFilters() {
    // Hiển thị hiệu ứng loading
    showLoading(true);
    
    // Lấy giá trị bộ lọc
    const timeFilter = document.getElementById('timeFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    
    let dateValue;
    switch(timeFilter) {
        case 'day':
            dateValue = document.getElementById('dayFilter').value;
            break;
        case 'week':
            dateValue = document.getElementById('weekFilter').value;
            break;
        case 'month':
            const monthFilter = document.getElementById('monthFilter');
            dateValue = monthFilter ? monthFilter.value : null;
            break;
        case 'year':
            const yearFilter = document.getElementById('yearFilter');
            dateValue = yearFilter ? yearFilter.value : null;
            break;
    }
    
    console.log(`Áp dụng bộ lọc: Thời gian=${timeFilter}, Ngày=${dateValue}, Danh mục=${categoryFilter}`);
    
    // Trong thực tế, đây sẽ là API call để lấy dữ liệu theo bộ lọc
    // Giả lập việc tải dữ liệu với setTimeout
    setTimeout(() => {
        // Cập nhật dữ liệu tổng quan
        updateSummaryData();
        
        // Cập nhật biểu đồ
        updateCharts(timeFilter, dateValue, categoryFilter);
        
        // Cập nhật bảng dữ liệu chi tiết
        updateDetailTable(timeFilter, dateValue, categoryFilter);
        
        // Ẩn hiệu ứng loading
        showLoading(false);
        
        // Hiển thị thông báo
        showNotification('Dữ liệu đã được cập nhật', 'success');

        // Cập nhật label kỳ
        updatePeriodLabels();
    }, 800);
}

/**
 * Hiển thị hoặc ẩn hiệu ứng loading
 */
function showLoading(show) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Hiển thị thông báo
 */
function showNotification(message, type = 'info') {
    // Tạo thông báo toast
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const flexDiv = document.createElement('div');
    flexDiv.className = 'd-flex';
    
    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';
    toastBody.textContent = message;
    
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'btn-close btn-close-white me-2 m-auto';
    closeButton.setAttribute('data-bs-dismiss', 'toast');
    closeButton.setAttribute('aria-label', 'Close');
    
    flexDiv.appendChild(toastBody);
    flexDiv.appendChild(closeButton);
    toast.appendChild(flexDiv);
    
    // Thêm toast vào container
    const toastContainer = document.getElementById('toastContainer');
    if (toastContainer) {
        toastContainer.appendChild(toast);
        
        // Hiển thị toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Xóa toast khỏi DOM sau khi nó biến mất
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    } else {
        console.log(message);
    }
}

/**
 * Cập nhật dữ liệu tổng quan
 */
function updateSummaryData() {
    // Dữ liệu mẫu - trong thực tế sẽ được lấy từ API
    const summaryData = {
        totalRevenue: '25,500,000đ',
        revenueGrowth: 15,
        totalOrders: '125 đơn',
        orderGrowth: 8,
        averageOrderValue: '204,000đ',
        avgOrderGrowth: 5
    };
    
    // Cập nhật UI với dữ liệu thống kê
    const totalRevenueEl = document.getElementById('totalRevenue');
    const revenueGrowthEl = document.getElementById('revenueGrowth');
    const totalOrdersEl = document.getElementById('totalOrders');
    const orderGrowthEl = document.getElementById('orderGrowth');
    const averageOrderValueEl = document.getElementById('averageOrderValue');
    const avgOrderGrowthEl = document.getElementById('avgOrderGrowth');
    
    if (totalRevenueEl) totalRevenueEl.textContent = summaryData.totalRevenue;
    if (revenueGrowthEl) {
        revenueGrowthEl.textContent = `${summaryData.revenueGrowth}% so với kỳ trước`;
        revenueGrowthEl.className = summaryData.revenueGrowth >= 0 ? 'text-success' : 'text-danger';
        revenueGrowthEl.innerHTML = `<i class="fas fa-arrow-${summaryData.revenueGrowth >= 0 ? 'up' : 'down'}"></i> ` + revenueGrowthEl.textContent;
    }
    
    if (totalOrdersEl) totalOrdersEl.textContent = summaryData.totalOrders;
    if (orderGrowthEl) {
        orderGrowthEl.textContent = `${summaryData.orderGrowth}% so với kỳ trước`;
        orderGrowthEl.className = summaryData.orderGrowth >= 0 ? 'text-success' : 'text-danger';
        orderGrowthEl.innerHTML = `<i class="fas fa-arrow-${summaryData.orderGrowth >= 0 ? 'up' : 'down'}"></i> ` + orderGrowthEl.textContent;
    }
    
    if (averageOrderValueEl) averageOrderValueEl.textContent = summaryData.averageOrderValue;
    if (avgOrderGrowthEl) {
        avgOrderGrowthEl.textContent = `${summaryData.avgOrderGrowth}% so với kỳ trước`;
        avgOrderGrowthEl.className = summaryData.avgOrderGrowth >= 0 ? 'text-success' : 'text-danger';
        avgOrderGrowthEl.innerHTML = `<i class="fas fa-arrow-${summaryData.avgOrderGrowth >= 0 ? 'up' : 'down'}"></i> ` + avgOrderGrowthEl.textContent;
    }
}

/**
 * Khởi tạo các biểu đồ
 */
function initializeCharts() {
    // Biểu đồ doanh thu theo thời gian
    if (document.querySelector("#revenueByTimeChart")) {
        window.revenueChart = new ApexCharts(document.querySelector("#revenueByTimeChart"), {
            chart: {
                type: 'area',
                height: 350,
                toolbar: {
                    show: false
                }
            },
            series: [{
                name: 'Doanh thu',
                data: [] // Bắt đầu với mảng rỗng
            }],
            xaxis: {
                categories: [] // Bắt đầu với mảng rỗng
            },
            yaxis: {
                labels: {
                    formatter: function(value) {
                        return formatCurrency(value);
                    }
                }
            },
            colors: ['#8B4513'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.3
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            tooltip: {
                y: {
                    formatter: function(value) {
                        return formatCurrency(value);
                    }
                }
            },
            noData: {
                text: 'Đang tải dữ liệu...',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#888',
                    fontSize: '14px',
                    fontFamily: 'Segoe UI, Arial, sans-serif'
                }
            }
        });
        window.revenueChart.render();
    }

    // Biểu đồ doanh thu theo danh mục
    if (document.querySelector("#categoryRevenueChart")) {
        window.categoryChart = new ApexCharts(document.querySelector("#categoryRevenueChart"), {
            chart: {
                type: 'donut',
                height: 365,
            },
            series: [], // Bắt đầu với mảng rỗng
            labels: [],
            colors: ['#D4AF37', '#8B4513', '#CD853F', '#DEB887', '#A0522D', '#DAA520', '#F4A460'],
            legend: {
                position: 'bottom'
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 300
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }],
            tooltip: {
                y: {
                    formatter: function(value) {
                        return formatCurrency(value);
                    }
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            name: {
                                show: true
                            },
                            value: {
                                show: true,
                                formatter: function(val) {
                                    return formatCurrency(val);
                                }
                            },
                            total: {
                                show: true,
                                formatter: function(w) {
                                    const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                                    return formatCurrency(total);
                                }
                            }
                        }
                    }
                }
            },
            dataLabels: {
                formatter: function(val, opts) {
                    return opts.w.config.labels[opts.seriesIndex] + ': ' + val.toFixed(1) + '%';
                }
            },
            noData: {
                text: 'Đang tải dữ liệu...',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#888',
                    fontSize: '14px',
                    fontFamily: 'Segoe UI, Arial, sans-serif'
                }
            }
        });
        window.categoryChart.render();
    }

    // Biểu đồ doanh thu theo giờ
    if (document.querySelector("#hourlyRevenueChart")) {
        window.hourlyChart = new ApexCharts(document.querySelector("#hourlyRevenueChart"), {
            chart: {
                type: 'bar',
                height: 350,
                toolbar: {
                    show: false
                }
            },
            series: [{
                name: 'Doanh thu',
                data: [] // Bắt đầu với mảng rỗng
            }],
            xaxis: {
                categories: [] // Bắt đầu với mảng rỗng
            },
            colors: ['#8B4513'],
            plotOptions: {
                bar: {
                    borderRadius: 4,
                    columnWidth: '60%',
                    dataLabels: {
                        position: 'top'
                    }
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function(val) {
                    return formatCurrency(val, true);
                },
                offsetY: -20,
                style: {
                    fontSize: '12px',
                    colors: ['#304758']
                }
            },
            yaxis: {
                labels: {
                    formatter: function(value) {
                        return formatCurrency(value);
                    }
                }
            },
            tooltip: {
                y: {
                    formatter: function(value) {
                        return formatCurrency(value);
                    }
                }
            },
            noData: {
                text: 'Đang tải dữ liệu...',
                align: 'center',
                verticalAlign: 'middle',
                style: {
                    color: '#888',
                    fontSize: '14px',
                    fontFamily: 'Segoe UI, Arial, sans-serif'
                }
            }
        });
        window.hourlyChart.render();
    }
    
    // Ngay sau khi khởi tạo, gọi các hàm cập nhật dữ liệu từ API
    updateRevenueByTimeChart();
    updateRevenueByTimeSlotChart();
    updateCategoryRevenueChart();
    updateTop5DishesList();
    updateRevenueDetailTable();
}

/**
 * Cập nhật dữ liệu các biểu đồ dựa trên bộ lọc
 */
function updateCharts(timeFilter, dateValue, categoryFilter) {
    // Dữ liệu mẫu cho các biểu đồ - trong thực tế sẽ được lấy từ API
    let timeSeriesData, categoryData, hourlyData;
    
    switch(timeFilter) {
        case 'day':
            // Nếu chọn theo ngày, hiển thị dữ liệu theo giờ
            timeSeriesData = {
                categories: ['7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h'],
                data: [0, 0, 500000, 1200000, 2100000, 3500000, 2800000, 1500000, 1700000, 2000000, 2500000, 3800000, 4200000, 3500000, 2800000, 1500000]
            };
            break;
        case 'month':
            // Nếu chọn theo tháng, hiển thị dữ liệu theo ngày
            timeSeriesData = {
                categories: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
                data: [1500000, 1800000, 1700000, 1600000, 2200000, 2500000, 2800000, 1900000, 1700000, 1600000, 1700000, 1800000, 1900000, 2100000, 2300000, 2200000, 2500000, 2700000, 2900000, 3100000, 3300000, 3500000, 3300000, 3100000, 2900000, 2700000, 2400000, 2200000, 2000000, 1900000]
            };
            break;
        case 'year':
            // Nếu chọn theo năm, hiển thị dữ liệu theo tháng
            timeSeriesData = {
                categories: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
                data: [45000000, 48000000, 52000000, 49000000, 58000000, 62000000, 68000000, 71000000, 66000000, 64000000, 72000000, 75000000]
            };
            break;
        default:
            timeSeriesData = {
                categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                data: [1200000, 1900000, 1500000, 2500000, 2100000, 3100000, 2500000]
            };
    }
    
    // Dữ liệu biểu đồ theo danh mục
    if (categoryFilter === 'all') {
        categoryData = {
            series: [44, 55, 13, 33],
            labels: ['Món chính', 'Khai vị', 'Tráng miệng', 'Đồ uống']
        };
    } else {
        // Nếu chọn danh mục cụ thể, hiển thị phân tích chi tiết cho danh mục đó
        switch(categoryFilter) {
            case 'main':
                categoryData = {
                    series: [35, 25, 20, 15, 5],
                    labels: ['Món gà', 'Món heo', 'Món bò', 'Món cá', 'Món chay']
                };
                break;
            case 'appetizer':
                categoryData = {
                    series: [45, 30, 25],
                    labels: ['Salad', 'Súp', 'Khai vị nóng']
                };
                break;
            case 'dessert':
                categoryData = {
                    series: [40, 35, 25],
                    labels: ['Bánh ngọt', 'Trái cây', 'Kem']
                };
                break;
            case 'drink':
                categoryData = {
                    series: [30, 25, 20, 15, 10],
                    labels: ['Nước ngọt', 'Bia', 'Rượu', 'Nước ép', 'Đồ uống nóng']
                };
                break;
        }
    }
    
    // Dữ liệu theo giờ
    hourlyData = {
        data: [2100000, 2500000, 3500000, 2800000, 4500000, 3000000]
    };
    
    // Cập nhật biểu đồ
    if (window.revenueChart) {
        window.revenueChart.updateOptions({
            xaxis: {
                categories: timeSeriesData.categories
            }
        });
        window.revenueChart.updateSeries([{
            name: 'Doanh thu',
            data: timeSeriesData.data
        }]);
    }
    
    if (window.categoryChart) {
        window.categoryChart.updateOptions({
            labels: categoryData.labels
        });
        window.categoryChart.updateSeries(categoryData.series);
    }
    
    if (window.hourlyChart) {
        window.hourlyChart.updateSeries([{
            name: 'Doanh thu',
            data: hourlyData.data
        }]);
    }
}

/**
 * Cập nhật bảng dữ liệu chi tiết
 */
function updateDetailTable(timeFilter, dateValue, categoryFilter) {
    const tableBody = document.querySelector('#detailTable tbody');
    if (!tableBody) return;
    
    // Dữ liệu mẫu - trong thực tế sẽ được lấy từ API
    const detailData = [
        { id: 'HD001', date: '20/03/2025', time: '12:30', total: 1250000, items: 5, customer: 'Khách lẻ', payment: 'Tiền mặt' },
        { id: 'HD002', date: '20/03/2025', time: '13:15', total: 980000, items: 3, customer: 'Nguyễn Văn A', payment: 'Chuyển khoản' },
        { id: 'HD003', date: '20/03/2025', time: '18:45', total: 2350000, items: 8, customer: 'Công ty TNHH XYZ', payment: 'Thẻ tín dụng' },
        { id: 'HD004', date: '20/03/2025', time: '19:20', total: 1650000, items: 6, customer: 'Trần Thị B', payment: 'Tiền mặt' },
        { id: 'HD005', date: '20/03/2025', time: '20:10', total: 850000, items: 4, customer: 'Khách lẻ', payment: 'Chuyển khoản' }
    ];
    
    // Xóa nội dung hiện tại
    tableBody.innerHTML = '';
    
    // Thêm dữ liệu mới
    detailData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.date}</td>
            <td>${item.time}</td>
            <td class="text-end">${formatCurrency(item.total)}</td>
            <td class="text-center">${item.items}</td>
            <td>${item.customer}</td>
            <td>${item.payment}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-info me-1" onclick="viewDetail('${item.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="printInvoice('${item.id}')">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Định dạng số thành tiền tệ Việt Nam
 */
function formatCurrency(value, simplified = false) {
    // Nếu simplified = true, trả về định dạng rút gọn (ví dụ: 2.5tr)
    if (simplified) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'tr';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'k';
        }
        return value.toString();
    }
    
    // Định dạng đầy đủ
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Xem chi tiết hóa đơn
 */
function viewDetail(invoiceId) {
    console.log(`Xem chi tiết hóa đơn: ${invoiceId}`);
    // Mở modal hoặc chuyển hướng đến trang chi tiết
    showNotification(`Đang tải chi tiết hóa đơn ${invoiceId}`, 'info');
}
function updatePeriodLabels() {
    // Lấy loại thời gian và giá trị đang chọn
    const timeFilter = document.getElementById('timeFilter').value;
    let value = '';
    
    // Lấy giá trị filter tùy theo loại thời gian
    if (timeFilter === 'day') {
        value = document.getElementById('dayFilter').value;
    } else if (timeFilter === 'week') {
        value = document.getElementById('weekFilter').value;
    } else if (timeFilter === 'month') {
        value = document.getElementById('monthFilter').value;
    } else if (timeFilter === 'year') {
        value = document.getElementById('yearFilter').value;
    }
    
    // Cập nhật nhãn kỳ hiện tại
    const currentPeriodLabel = document.getElementById('currentPeriodLabel');
    if (currentPeriodLabel) {
        currentPeriodLabel.textContent = getTimeFilterLabel(timeFilter, value);
    }
    
    // Cập nhật nhãn kỳ trước
    const prevPeriodLabel = document.getElementById('prevPeriodLabel');
    if (prevPeriodLabel) {
        const prevValue = getPrevPeriod(timeFilter, value, firstOrderTime);
        if (prevValue) {
            prevPeriodLabel.textContent = getTimeFilterLabel(timeFilter, prevValue);
        } else {
            prevPeriodLabel.textContent = "Không có kỳ trước";
        }
    }
    
    // Định dạng nhãn hiển thị theo loại thời gian
    let periodLabel = getTimeFilterLabel(timeFilter, value);
    
    // Cập nhật các nhãn kỳ trong giao diện
    const periodLabelElements = document.querySelectorAll('.period-label');
    periodLabelElements.forEach(el => {
        el.textContent = periodLabel;
    });
    
    // Cập nhật tiêu đề trang
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = `Thống kê doanh thu - ${periodLabel}`;
    }
}

/**
 * Cập nhật dữ liệu tổng quan dựa trên bộ lọc
 */
function updateSummaryDataByFilter() {
    const timeFilter = document.getElementById('timeFilter').value;
    let value = '';
    if (timeFilter === 'day') {
        value = document.getElementById('dayFilter').value;
    } else if (timeFilter === 'week') {
        value = document.getElementById('weekFilter').value;
    } else if (timeFilter === 'month') {
        value = document.getElementById('monthFilter').value;
    } else if (timeFilter === 'year') {
        value = document.getElementById('yearFilter').value;
    }
    
    // Cập nhật nhãn kỳ trước khi gọi API
    updatePeriodLabels();
    
    // Hiển thị spinner trong các card
    const loadingElements = ['totalRevenue', 'totalOrders', 'averageOrderValue'];
    loadingElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>';
    });
    
    // Gọi API lấy dữ liệu tổng quan kỳ hiện tại
    fetch(`/api/thong-ke-tong-quat?type=${timeFilter}&value=${value}`)
        .then(res => res.json())
        .then(data => {
            if (data.status) {
                // Cập nhật các thành phần HTML
                const totalRevenueEl = document.getElementById('totalRevenue');
                const totalOrdersEl = document.getElementById('totalOrders');
                const averageOrderValueEl = document.getElementById('averageOrderValue');
                const customerNewEl = document.querySelector('.text-warning'); // h3 khách hàng mới

                if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(data.totalRevenue);
                if (totalOrdersEl) totalOrdersEl.textContent = data.totalOrders + ' đơn';
                if (averageOrderValueEl) averageOrderValueEl.textContent = formatCurrency(data.averageOrderValue);
                if (customerNewEl) customerNewEl.textContent = data.khachHangMoi || '0';

                // Lấy kỳ trước
                const prevValue = getPrevPeriod(timeFilter, value, firstOrderTime);

                if (prevValue) {
                    fetch(`/api/thong-ke-tong-quat?type=${timeFilter}&value=${prevValue}`)
                        .then(res2 => res2.json())
                        .then(prevData => {
                            if (prevData.status) {
                                // Tính % tăng trưởng
                                updateGrowth('revenueGrowth', data.totalRevenue, prevData.totalRevenue);
                                updateGrowth('orderGrowth', data.totalOrders, prevData.totalOrders);
                                updateGrowth('avgOrderGrowth', data.averageOrderValue, prevData.averageOrderValue);
                                updateGrowth('customerGrowth', data.khachHangMoi || 0, prevData.khachHangMoi || 0);
                                // Hiện các thành phần so sánh
                                showGrowthElements(true);
                            } else {
                                // Ẩn các thành phần so sánh nếu không có dữ liệu kỳ trước
                                showGrowthElements(false);
                            }
                            // Cập nhật lại nhãn kỳ sau khi đã lấy dữ liệu kỳ trước
                            updatePeriodLabels();
                        })
                        .catch(error => {
                            console.error('Lỗi khi lấy dữ liệu kỳ trước:', error);
                            showGrowthElements(false);
                        });
                } else {
                    // Ẩn các thành phần so sánh nếu không có kỳ trước hợp lệ
                    showGrowthElements(false);
                }
            } else {
                // Nếu lỗi, hiển thị thông báo
                if (totalRevenueEl) totalRevenueEl.textContent = '0 ₫';
                if (totalOrdersEl) totalOrdersEl.textContent = '0 đơn';
                if (averageOrderValueEl) averageOrderValueEl.textContent = '0 ₫';
                if (customerNewEl) customerNewEl.textContent = '0';
                showGrowthElements(false);
                showNotification('Không thể tải dữ liệu tổng quan', 'warning');
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu tổng quan:', error);
            showNotification('Đã xảy ra lỗi khi tải dữ liệu', 'danger');
            showGrowthElements(false);
        });
    
    // Cập nhật các biểu đồ và bảng khi thay đổi bộ lọc
    updateRevenueByTimeChart();
    updateRevenueByTimeSlotChart();
    updateCategoryRevenueChart();
    updateTop5DishesList();
    updateRevenueDetailTable();
}

// Hàm cập nhật % tăng trưởng
function updateGrowth(elementId, current, prev) {
    let soChia = prev
    const el = document.getElementById(elementId);
    if (!el) return;
    if (prev == 0 && prev == current) {
        el.innerHTML = `--% so với kỳ trước`;
        el.className = 'text-black';
        return;
    }
    else if(prev == 0){
        soChia = prev + 1
    }
    const growth = Math.round(((current - prev) / soChia) * 100);
    if (growth >= 0) {
        el.innerHTML = `▲ ${growth}% so với kỳ trước`;
        el.className = 'text-success';
    } else {
        el.innerHTML = `▼ ${Math.abs(growth)}% so với kỳ trước`;
        el.className = 'text-danger';
    }
}

// Hàm ẩn/hiện các thành phần so sánh
function showGrowthElements(show) {
    const ids = ['revenueGrowth', 'orderGrowth', 'avgOrderGrowth', 'comparePeriodLabel', 'customerGrowth'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = show ? '' : 'none';
    });
}

function getPrevPeriod(timeFilter, value, firstOrderTime) {
    if (!value) return null;
    if (!firstOrderTime) return null;

    let prevValue = '';
    if (timeFilter === 'day') {
        const date = new Date(value);
        date.setDate(date.getDate() - 1);
        prevValue = date.toISOString().slice(0, 10);
        if (prevValue < firstOrderTime.day) return null;
        if (prevValue === value) return null;
        return prevValue;
    } else if (timeFilter === 'week') {
        // value dạng "2024-W25"
        const [year, week] = value.split('-W');
        let prevWeek = parseInt(week) - 1;
        let prevYear = parseInt(year);
        if (prevWeek === 0) {
            prevWeek = 52;
            prevYear -= 1;
        }
        const prevValueStr = `${prevYear}-W${prevWeek.toString().padStart(2, '0')}`;
        if (prevValueStr < firstOrderTime.week) return null;
        if (prevValueStr === value) return null;
        return prevValueStr;
    } else if (timeFilter === 'month') {
        const [year, month] = value.split('-');
        let prevMonth = parseInt(month) - 1;
        let prevYear = parseInt(year);
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        const prevValueStr = `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
        if (prevValueStr < firstOrderTime.month) return null;
        if (prevValueStr === value) return null;
        return prevValueStr;
    } else if (timeFilter === 'year') {
        let prevYear = (parseInt(value) - 1).toString();
        if (prevYear < firstOrderTime.year) return null;
        if (prevYear === value) return null;
        return prevYear;
    }
    return null;
}

function updateRevenueByTimeChart() {
    const timeFilter = document.getElementById('timeFilter').value;
    let value = '';
    if (timeFilter === 'day') {
        value = document.getElementById('dayFilter').value;
    } else if (timeFilter === 'week') {
        value = document.getElementById('weekFilter').value;
    } else if (timeFilter === 'month') {
        value = document.getElementById('monthFilter').value;
    } else if (timeFilter === 'year') {
        value = document.getElementById('yearFilter').value;
    }

    fetch(`/api/thong-ke-theo-thoi-gian?type=${timeFilter}&value=${value}`)
        .then(res => res.json())
        .then(data => {
            if (!data.status) return;
            let categories = [];
            let seriesData = [];

            if (timeFilter === 'day' || timeFilter === 'week') {
                categories = data.days.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
                });
                seriesData = data.days.map(d => d.totalRevenue);
            } else if (timeFilter === 'month') {
                categories = data.days.map(d => {
                    const date = new Date(d.date);
                    return date.getDate().toString();
                });
                seriesData = data.days.map(d => d.totalRevenue);
            } else if (timeFilter === 'year') {
                categories = data.months.map(m => `Tháng ${m.month}`);
                seriesData = data.months.map(m => m.totalRevenue);
            }

            if (window.revenueChart) {
                window.revenueChart.updateOptions({
                    xaxis: { categories }
                });
                window.revenueChart.updateSeries([{
                    name: 'Doanh thu',
                    data: seriesData
                }]);
            }
        });
}

function updateRevenueByTimeSlotChart() {
    const timeFilter = document.getElementById('timeFilter').value;
    let value = '';
    if (timeFilter === 'day') {
        value = document.getElementById('dayFilter').value;
    } else if (timeFilter === 'week') {
        value = document.getElementById('weekFilter').value;
    } else if (timeFilter === 'month') {
        value = document.getElementById('monthFilter').value;
    } else if (timeFilter === 'year') {
        value = document.getElementById('yearFilter').value;
    }

    fetch(`/api/thong-ke-theo-khung-gio?type=${timeFilter}&value=${value}`)
        .then(res => res.json())
        .then(data => {
            if (!data.status) return;
            // data.data là mảng các khung giờ
            const categories = data.data.map(item => item.label);
            const seriesData = data.data.map(item => item.totalRevenue);

            // Cập nhật biểu đồ (giả sử bạn có window.hourlyChart là biểu đồ doanh thu theo khung giờ)
            if (window.hourlyChart) {
                window.hourlyChart.updateOptions({
                    xaxis: { categories }
                });
                window.hourlyChart.updateSeries([{
                    name: 'Doanh thu',
                    data: seriesData
                }]);
            }
        });
}

/**
 * Cập nhật danh sách top 5 món bán chạy
 */
function updateTop5DishesList() {
    const timeFilter = document.getElementById('timeFilter').value;
    let value = '';
    
    // Lấy giá trị filter tùy theo loại thời gian
    if (timeFilter === 'day') {
        value = document.getElementById('dayFilter').value;
    } else if (timeFilter === 'week') {
        value = document.getElementById('weekFilter').value;
    } else if (timeFilter === 'month') {
        value = document.getElementById('monthFilter').value;
    } else if (timeFilter === 'year') {
        value = document.getElementById('yearFilter').value;
    }
    
    // Hiển thị loading cho phần top món
    const topDishesList = document.getElementById('topDishesList');
    if (topDishesList) {
        topDishesList.innerHTML = `
            <li class="list-group-item text-center py-3">
                <div class="spinner-border spinner-border-sm text-secondary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
                <span class="ms-2">Đang tải dữ liệu...</span>
            </li>
        `;
    }
    
    // Gọi API lấy dữ liệu top 5 món bán chạy
    fetch(`/api/thong-ke-top-5-mon-ban-chay?type=${timeFilter}&value=${value}`)
        .then(res => res.json())
        .then(data => {
            if (!data.status) {
                showNotification('Lỗi khi tải dữ liệu top món', 'danger');
                if (topDishesList) {
                    topDishesList.innerHTML = `
                        <li class="list-group-item text-center text-danger py-3">
                            <i class="fas fa-exclamation-circle me-2"></i>
                            Không thể tải dữ liệu
                        </li>
                    `;
                }
                return;
            }
            
            // Kiểm tra có dữ liệu không
            if (!data.data || data.data.length === 0) {
                if (topDishesList) {
                    topDishesList.innerHTML = `
                        <li class="list-group-item text-center text-muted py-3">
                            &#9432; Không có dữ liệu cho ${getTimeFilterLabel(timeFilter, value)}
                        </li>
                    `;
                }
                return;
            }
            
            // Cập nhật danh sách
            if (topDishesList) {
                topDishesList.innerHTML = '';
                
                // Tạo các item trong danh sách
                data.data.forEach((item, index) => {
                    const li = document.createElement('li');
                    li.className = 'list-group-item d-flex justify-content-between align-items-center';
                    
                    // Thêm số thứ tự với màu khác nhau cho top 3
                    let badgeClass = 'bg-secondary';
                    if (index === 0) badgeClass = 'bg-warning text-dark'; // Top 1 - Vàng
                    else if (index === 1) badgeClass = 'bg-light text-dark border'; // Top 2 - Bạc
                    else if (index === 2) badgeClass = 'bg-copper text-white'; // Top 3 - Đồng
                    
                    li.innerHTML = `
                        <div>
                            <span class="badge ${badgeClass} me-2">${index + 1}</span>
                            <span>${item.ten}</span>
                        </div>
                        <span class="badge bg-primary rounded-pill">${item.tongSoLuong}</span>
                    `;
                    
                    topDishesList.appendChild(li);
                });
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu top món:', error);
            showNotification('Đã xảy ra lỗi khi tải dữ liệu', 'danger');
            if (topDishesList) {
                topDishesList.innerHTML = `
                    <li class="list-group-item text-center text-danger py-3">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Không thể tải dữ liệu
                    </li>
                `;
            }
        });
}

/**
 * Lấy nhãn mô tả cho bộ lọc thời gian
 */
function getTimeFilterLabel(timeFilter, value) {
    switch (timeFilter) {
        case 'day':
            const date = new Date(value);
            return `ngày ${date.toLocaleDateString('vi-VN')}`;
        case 'week':
            const [year, week] = value.split('-W');
            return `tuần ${week}, năm ${year}`;
        case 'month':
            const [monthYear, month] = value.split('-');
            return `tháng ${month}/${monthYear}`;
        case 'year':
            return `năm ${value}`;
        default:
            return 'khoảng thời gian này';
    }
}

/**
 * Cập nhật biểu đồ tỉ lệ doanh thu theo danh mục
 */
function updateCategoryRevenueChart() {
    const timeFilter = document.getElementById('timeFilter').value;
    let value = '';
    
    // Lấy giá trị filter tùy theo loại thời gian
    if (timeFilter === 'day') {
        value = document.getElementById('dayFilter').value;
    } else if (timeFilter === 'week') {
        value = document.getElementById('weekFilter').value;
    } else if (timeFilter === 'month') {
        value = document.getElementById('monthFilter').value;
    } else if (timeFilter === 'year') {
        value = document.getElementById('yearFilter').value;
    }
    
    // Hiển thị loading
    showLoading(true);
    
    // Gọi API lấy dữ liệu thống kê tỉ lệ doanh thu theo danh mục
    fetch(`/api/thong-ke-ti-le-theo-danh-muc-mon-an?type=${timeFilter}&value=${value}`)
        .then(res => res.json())
        .then(data => {
            // Ẩn loading
            showLoading(false);
            
            if (!data.status) {
                showNotification('Lỗi khi tải dữ liệu danh mục', 'danger');
                
                // Cập nhật biểu đồ với trạng thái "Không có dữ liệu"
                if (window.categoryChart) {
                    window.categoryChart.updateOptions({
                        labels: ['Không có dữ liệu'],
                        colors: ['#E0E0E0'], // Màu xám nhạt
                        legend: {
                            show: false
                        }
                    });
                    window.categoryChart.updateSeries([1]); // Chỉ hiển thị 1 phần
                    
                    // Thêm overlay thông báo vào container biểu đồ
                    addNoDataOverlay("categoryRevenueChart", `Không có dữ liệu doanh thu theo danh mục`);
                }
                
                // Xóa bảng dữ liệu nếu có
                const tableBody = document.querySelector('#categoryTable tbody');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
                }
                return;
            }
            
            // Kiểm tra cấu trúc dữ liệu
            if (!data.data || typeof data.data !== 'object') {
                console.error('Dữ liệu trả về không đúng định dạng:', data);
                showNotification('Dữ liệu trả về không đúng định dạng', 'danger');
                addNoDataOverlay("categoryRevenueChart", `Định dạng dữ liệu không hợp lệ`);
                return;
            }
            
            // Kiểm tra nếu không có dữ liệu danh mục hoặc danh mục trống
            if (!data.data.danhMuc || !Array.isArray(data.data.danhMuc) || data.data.danhMuc.length === 0) {
                // Cập nhật biểu đồ với trạng thái "Không có dữ liệu"
                if (window.categoryChart) {
                    window.categoryChart.updateOptions({
                        labels: ['Không có dữ liệu'],
                        colors: ['#E0E0E0'], // Màu xám nhạt
                        legend: {
                            show: false
                        }
                    });
                    window.categoryChart.updateSeries([1]); // Chỉ hiển thị 1 phần
                    
                    // Thêm overlay thông báo vào container biểu đồ
                    addNoDataOverlay("categoryRevenueChart", `Không có dữ liệu doanh thu theo danh mục cho ${getTimeFilterLabel(timeFilter, value)}`);
                }
                
                // Xóa bảng dữ liệu nếu có
                const tableBody = document.querySelector('#categoryTable tbody');
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Không có dữ liệu</td></tr>';
                }
                return;
            }
            
            // Xóa overlay thông báo nếu có
            removeNoDataOverlay("categoryRevenueChart");
            
            // Sắp xếp danh mục theo doanh thu giảm dần
            let sortedCategories = [...data.data.danhMuc].sort((a, b) => b.doanhThu - a.doanhThu);
            
            // Màu sắc sặc sỡ hơn cho biểu đồ
            const brightColors = [
                '#FF6384', // Hồng đậm
                '#36A2EB', // Xanh dương
                '#FFCE56', // Vàng
                '#4BC0C0', // Xanh ngọc
                '#9966FF', // Tím
                '#FF9F40', // Cam
                '#32CD32', // Xanh lá
                '#FF5733', // Đỏ cam
                '#8A2BE2', // Xanh tím
                '#00CED1'  // Xanh lơ
            ];
            
            // ĐÂY LÀ PHẦN CODE CÒN THIẾU
            // Chuẩn bị dữ liệu cho biểu đồ
            const labels = sortedCategories.map(item => item.tenDanhMuc);
            const seriesData = sortedCategories.map(item => item.doanhThu);
            const percentages = sortedCategories.map(item => item.tyLePhanTram);
            
            // Cập nhật biểu đồ
            if (window.categoryChart) {
                window.categoryChart.updateOptions({
                    labels: labels,
                    colors: brightColors.slice(0, labels.length), // Sử dụng đủ màu cho tất cả danh mục
                    legend: {
                        show: true,
                        position: 'bottom',
                        horizontalAlign: 'center'
                    },
                    tooltip: {
                        y: {
                            formatter: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    },
                    plotOptions: {
                        pie: {
                            donut: {
                                labels: {
                                    show: true,
                                    name: {
                                        show: true
                                    },
                                    value: {
                                        show: true,
                                        formatter: function(val) {
                                            return formatCurrency(val);
                                        }
                                    },
                                    total: {
                                        show: true,
                                        label: 'Tổng doanh thu',
                                        formatter: function(w) {
                                            return formatCurrency(data.data.tongDoanhThu);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
                
                // Cập nhật dữ liệu series
                window.categoryChart.updateSeries(seriesData);
            }
            
            // Cập nhật bảng dữ liệu
            updateCategoryTable(sortedCategories);
            
            // Hiển thị doanh thu tổng dưới biểu đồ
            const totalRevenueElement = document.getElementById('categoryTotalRevenue');
            if (totalRevenueElement) {
                totalRevenueElement.textContent = formatCurrency(data.data.tongDoanhThu);
            }
        })
        .catch(error => {
            console.error('Lỗi khi tải dữ liệu danh mục:', error);
            showNotification('Đã xảy ra lỗi khi tải dữ liệu', 'danger');
            showLoading(false);
            
            // Hiển thị thông báo lỗi
            addNoDataOverlay("categoryRevenueChart", "Không thể tải dữ liệu danh mục");
            
            // Cập nhật biểu đồ về trạng thái không có dữ liệu
            if (window.categoryChart) {
                window.categoryChart.updateOptions({
                    labels: ['Lỗi dữ liệu'],
                    colors: ['#E0E0E0'], // Màu xám nhạt
                    legend: {
                        show: false
                    }
                });
                window.categoryChart.updateSeries([1]); // Chỉ hiển thị 1 phần
            }
        });
}
function getSvg(node) {
    return domtoimage.toSvg(node)
        .then( async function (svgDataUrl) {
            const response = await fetch(svgDataUrl);
            const svgText = await response.text(); // Trả về nội dung SVG
            const fixedText = svgText.replace(/data:([a-zA-Z0-9_-]+)/g, 'data-$1');
            return fixedText; // Trả về nội dung SVG đã sửa
        })
        .catch(function (error) {
            console.error('Lỗi khi chuyển HTML sang SVG:', error);
            return null;
        });
}