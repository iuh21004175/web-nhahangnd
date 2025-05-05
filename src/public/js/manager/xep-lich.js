document.addEventListener('DOMContentLoaded', async function() {
    // Chỉ sử dụng weekSelect
    const weekSelect = document.getElementById('week-select');
    // Set default week to next week (tuần sau)
    function getNextWeekNumber() {
        // Giữ nguyên logic tính tuần sau
        const now = new Date();
        // Thêm 7 ngày để tính tuần kế tiếp
        const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
        
        // Triển khai đúng chuẩn ISO 8601
        const d = new Date(Date.UTC(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate()));
        
        // Đặt về thứ Năm của tuần hiện tại
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        
        // Lấy ngày đầu tiên của năm
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        
        // Tính số tuần
        const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        
        return {
            year: d.getUTCFullYear(),
            week: weekNum
        };
    }
    
    // Lấy thông tin tuần kế tiếp
    const { year, week } = getNextWeekNumber();

    // Format: YYYY-Www
    const formattedWeek = `${year}-W${week.toString().padStart(2, '0')}`;
    
    // Tạo options cho select tuần và đặt giá trị mặc định
    generateWeekOptions(formattedWeek);
    
    // Cập nhật ngày cho các tab điều hướng ngày trong tuần
    updateWeekDateRange(formattedWeek);
    
    // Lấy dữ liệu và hiển thị danh sách ca làm việc
    let listDangKyCa = await getAPICaLamViec(week);
    thaoTacCaLamViec(listDangKyCa);
    
    // Lắng nghe sự kiện change trên weekSelect
    weekSelect.addEventListener('change', function() {
        // Cập nhật các tab ngày và danh sách ca làm việc
        updateWeekDateRange(this.value);
        
        // Lấy số tuần mới
        const weekNumber = parseInt(this.value.split('-W')[1]);
        
        // Cập nhật hiển thị trạng thái dựa trên tuần được chọn
        updateStatusVisibility(this.value);
        
        // Lấy dữ liệu cho tuần mới
        getAPICaLamViec(weekNumber).then(data => {
            window.fullShiftsList = data; // Đảm bảo lưu dữ liệu vào biến toàn cục
            thaoTacCaLamViec(data);
            
            // Cập nhật bảng thống kê với tuần mới
            updateRoleStatistics(data);
        });
    });
    
    // Cập nhật hiển thị trạng thái dựa trên tuần được chọn ban đầu
    updateStatusVisibility(weekSelect.value);
    
    // Thêm sự kiện click cho các nút điều hướng ngày
    const dayNavLinks = document.querySelectorAll('.pagination .page-link');
    dayNavLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Loại bỏ class active từ tất cả các tab
            document.querySelectorAll('.pagination .page-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Thêm class active cho tab được click
            this.parentElement.classList.add('active');
            
            // Lấy ngày từ span
            const dateSpan = this.querySelector('span');
            const dayText = this.innerText.split('\n')[0]; // Lấy phần "Thứ hai", "Thứ ba"...
            
            // Cập nhật tiêu đề
            const ngayTrongTuanElement = document.getElementById('ngayTrongTuan');
            if (ngayTrongTuanElement) {
                ngayTrongTuanElement.textContent = `${dayText} (${dateSpan.textContent})`;
            }
            
            // Lọc danh sách ca làm việc theo ngày đã chọn
            filterShiftsByDate(dateSpan.textContent);
        });
    });

    // Thêm event listener cho select chức vụ
    const roleSelect = document.getElementById('duyetChucVu-select');
    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            // Bỏ chọn checkbox "Chọn tất cả" khi thay đổi chức vụ
            const selectAllCheckbox = document.getElementById('select-all');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            
            // Sử dụng lại danh sách đầy đủ đã lưu trước đó
            if (window.fullShiftsList) {
                thaoTacCaLamViec(window.fullShiftsList);
                
                // Gọi cập nhật bảng thống kê sau khi thay đổi chức vụ
                updateRoleStatistics(window.fullShiftsList);
            }
        });
    }

    // Thêm event listener cho nút Lưu và Hủy
    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveUpdates);
    }
    
    const cancelBtn = document.getElementById('btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelUpdates);
    }
    
    // Vô hiệu hóa nút Lưu và Hủy ban đầu
    toggleSaveButtons(false);

    // Loại bỏ event listener cũ trên nút xác nhận lưu
    const confirmSaveBtn = document.getElementById('btn-confirm-save');
    if (confirmSaveBtn) {
        // Xóa tất cả event listener cũ
        const newBtn = confirmSaveBtn.cloneNode(true);
        confirmSaveBtn.parentNode.replaceChild(newBtn, confirmSaveBtn);
    }

    // Thêm event listener cho nút duyệt hàng loạt
    const bulkApproveBtn = document.getElementById('btn-bulk-approve');
    if (bulkApproveBtn) {
        bulkApproveBtn.addEventListener('click', bulkApproveShifts);
    }

    // Thêm khởi tạo cho tab Phân công
    initializeAssignmentTab();
});

async function getAPICaLamViec(week) {
    try {
        const response = await fetch(`/api/ca-lam-viec?week=${week}`)
        const data = await response.json();
        if(data.status){
            return data.list
        }
        else{
            console.error(data.error);
            showToastDanger(data.error);
            return [];
        }
    } catch (error) {
        console.error('Error fetching ca lam viec:', error);
        showToastDanger('Đã xảy ra lỗi khi tải dữ liệu ca làm việc.');
        return [];
    }
}

// Sửa lại hàm thaoTacCaLamViec
function thaoTacCaLamViec(list) {
    // Lưu danh sách gốc vào biến toàn cục để sử dụng cho bộ lọc
    window.fullShiftsList = list;
    
    const tableBody = document.querySelector('#registerShiftTable tbody');
    tableBody.innerHTML = ''; // Xóa nội dung cũ
    
    // Lọc theo chức vụ nếu đã chọn
    const roleFilter = document.getElementById('duyetChucVu-select');
    if (roleFilter && roleFilter.value !== 'all') {
        const roleValue = parseInt(roleFilter.value);
        list = list.filter(reg => reg.NhanVien.chucVu === roleValue);
    }

    if (list.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Không tìm thấy ca làm việc</td></tr>';
    } else {
        // Code cũ của bạn từ đây
        list.forEach(reg => {
            const row = document.createElement('tr');
            
            // Format date - Sửa để đảm bảo định dạng "Thứ hai, 20/11/2023"
            const date = new Date(reg.ngay);
            const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const formattedDate = `${dayNames[date.getDay()]}, ${day}/${month}/${year}`;
            
            // Thêm thuộc tính data-date vào hàng để có thể lọc theo ngày mà không cần cột ngày
            row.setAttribute('data-date', `${day}/${month}/${year}`);
            row.setAttribute('data-day', `${day}`);
            row.setAttribute('data-month', `${month}`);
            
            // Status badge class và code khác giữ nguyên
            let statusClass = '';
            let statusText = '';
            switch(reg.trangThai) {
                case 0:
                    statusClass = 'status-pending';
                    statusText = 'Chờ duyệt';
                    break;
                case 1:
                    statusClass = 'status-approved';
                    statusText = 'Đã duyệt';
                    break;
                case 2:
                    statusClass = 'status-timekeeping';
                    statusText = 'Chấm công';
                    break;
                case 3:
                    statusClass = 'status-confirmed';
                    statusText = 'Đã chấm';
                    break;
                case 4:
                    statusClass = 'status-rejected';
                    statusText = 'Đã từ chối';
                    break;
            }
            
            // Buttons based on status - sửa để thêm các nút cho trạng thái khác
            let actionButtons = '';
            if (reg.trangThai === 0) {
                actionButtons = `
                    <button class="btn btn-sm btn-success action-btn approve-btn" 
                            data-id="${reg.id}" 
                            data-bs-tooltip="tooltip"
                            title="Duyệt">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger action-btn reject-btn"
                            data-id="${reg.id}"
                            data-bs-tooltip="tooltip"
                            title="Từ chối">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            } else {
                actionButtons = `
                    <button class="btn btn-sm btn-secondary action-btn" disabled>
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary action-btn" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="shift-checkbox" 
                           data-id="${reg.id}" ${reg.trangThai !== 0 ? 'disabled' : ''}>
                </td>
                <td>${reg.NhanVien.ten}</td>
                <td>${reg.caLamViec == 0 ? 'Ca sáng(6:00 - 14:00)' : 'Ca chiều(14:00 - 22:00)'}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    ${actionButtons}
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Initialize tooltips
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-tooltip="tooltip"]'));
        tooltips.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Gắn sự kiện cho checkbox
        attachCheckboxEvents();
    }
    
    // Sửa lại hàm selectAllChangeHandler để chỉ chọn các hàng đang hiển thị (theo ngày và chức vụ)
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        // Bỏ event listener cũ
        selectAllCheckbox.removeEventListener('change', selectAllChangeHandler);
        // Thêm event listener mới
        selectAllCheckbox.addEventListener('change', function() {
            // Chỉ áp dụng cho các checkbox không bị disabled và thuộc hàng đang hiển thị
            const visibleCheckboxes = document.querySelectorAll('#registerShiftTable tbody tr:not([style*="display: none"]) .shift-checkbox:not([disabled])');
            
            visibleCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            
            // Cập nhật trạng thái nút duyệt hàng loạt
            handleCheckboxChange();
        });
    }
    
    // Gắn các sự kiện cho các nút
    attachActionButtonEvents();
    
    // Cập nhật số lượng trạng thái
    updateStatusCounts();
    
    // Cập nhật hiển thị trạng thái dựa trên tuần được chọn
    const weekSelect = document.getElementById('week-select');
    if (weekSelect) {
        updateStatusVisibility(weekSelect.value);
    }
    
    // Lọc theo ngày đang chọn nếu có
    const activeTab = document.querySelector('.pagination .page-item.active');
    if (activeTab) {
        const dateSpan = activeTab.querySelector('span');
        if (dateSpan) {
            filterShiftsByDate(dateSpan.textContent);
        }
    }

    // Cập nhật bảng thống kê theo chức vụ
    updateRoleStatistics(list);
}

// Hàm xử lý select all checkbox
function selectAllChangeHandler() {
    const checkboxes = document.querySelectorAll('.shift-checkbox:not([disabled])');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
}

// Thêm biến lưu trữ các ca làm việc được cập nhật
let pendingUpdates = [];

// Hàm gắn sự kiện cho các nút - Cập nhật lại để theo dõi các thay đổi
function attachActionButtonEvents() {
    // Approve buttons
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const shiftId = this.getAttribute('data-id');
            
            // Thêm vào danh sách cập nhật
            addToUpdateList(shiftId, 1);
            
            // Thay đổi giao diện nút
            updateButtonsUI(this);
            
            // Kích hoạt nút Lưu và Hủy
            toggleSaveButtons(true);
        });
    });
    
    // Reject buttons
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const shiftId = this.getAttribute('data-id');
            
            // Thêm vào danh sách cập nhật
            addToUpdateList(shiftId, 4);
            
            // Thay đổi giao diện nút
            updateButtonsUI(this);
            
            // Kích hoạt nút Lưu và Hủy
            toggleSaveButtons(true);
        });
    });
    
    // Các nút timekeeping, confirm và issue vẫn giữ nguyên
    document.querySelectorAll('.timekeeping-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const shiftId = this.getAttribute('data-id');
            console.log('Chấm công', shiftId);
        });
    });
    
    document.querySelectorAll('.confirm-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const shiftId = this.getAttribute('data-id');
            console.log('Xác nhận', shiftId);
        });
    });
    
    document.querySelectorAll('.issue-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const shiftId = this.getAttribute('data-id');
            console.log('Báo vấn đề', shiftId);
        });
    });
}

// Hàm thêm vào danh sách cập nhật
function addToUpdateList(shiftId, newStatus) {
    // Kiểm tra xem đã có trong danh sách cập nhật chưa
    const existingIndex = pendingUpdates.findIndex(item => item.id === shiftId);
    
    if (existingIndex !== -1) {
        // Nếu đã có, cập nhật trạng thái mới
        pendingUpdates[existingIndex].trangThai = newStatus;
    } else {
        // Nếu chưa có, thêm vào danh sách
        pendingUpdates.push({
            id: shiftId,
            trangThai: newStatus
        });
    }
    
    console.log('Danh sách cập nhật:', pendingUpdates);
}

// Hàm cập nhật giao diện nút sau khi click
function updateButtonsUI(clickedButton) {
    // Lấy container của nút
    const actionCell = clickedButton.closest('td');
    if (!actionCell) {
        console.error('Không tìm thấy ô td chứa nút');
        return;
    }
    
    // Lấy ID ca làm việc
    const shiftId = clickedButton.getAttribute('data-id');
    
    // Lấy loại nút được click (approve hoặc reject)
    const isApprove = clickedButton.classList.contains('approve-btn');
    
    // Tắt tooltip trước khi thay đổi nội dung
    const tooltipsInCell = actionCell.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltipsInCell.forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) {
            tooltip.dispose();
        }
    });
    
    // Lấy trạng thái ban đầu để cập nhật số lượng
    const row = actionCell.closest('tr');
    if (!row) {
        console.error('Không tìm thấy hàng tr chứa nút');
        return;
    }
    
    const statusBadge = row.querySelector('.status-badge');
    if (!statusBadge) {
        console.error('Không tìm thấy phần tử có class status-badge');
        return;
    }
    
    // Lưu trạng thái ban đầu để sử dụng khi hủy
    const originalStatus = getStatusFromClass(statusBadge.className);
    row.setAttribute('data-original-status', originalStatus);
    
    // Giảm số lượng trạng thái cũ 
    decrementStatusCount(originalStatus);
    
    // Thay đổi giao diện - đổi sang nút không thể click
    actionCell.innerHTML = `
        <button class="btn btn-sm btn-secondary action-btn" disabled>
            <i class="fas fa-check"></i>
        </button>
        <button class="btn btn-sm btn-secondary action-btn" disabled>
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Thay đổi trạng thái hiển thị
    if (isApprove) {
        statusBadge.className = 'status-badge status-approved';
        statusBadge.textContent = 'Đã duyệt';
        // Tăng số lượng 'Đã duyệt'
        incrementStatusCount('approved');
    } else {
        statusBadge.className = 'status-badge status-rejected';
        statusBadge.textContent = 'Đã từ chối';
        // Tăng số lượng 'Đã từ chối'
        incrementStatusCount('rejected');
    }
    
    // Vô hiệu hóa checkbox
    const checkbox = row.querySelector('.shift-checkbox');
    if (checkbox) {
        checkbox.disabled = true;
        checkbox.checked = false;
    }
    
    // Kích hoạt nút Lưu và Hủy
    toggleSaveButtons(true);
}

// Lấy trạng thái từ tên class
function getStatusFromClass(className) {
    if (className.includes('status-pending')) return 'pending';
    if (className.includes('status-approved')) return 'approved';
    if (className.includes('status-timekeeping')) return 'timekeeping';
    if (className.includes('status-confirmed')) return 'confirmed';
    if (className.includes('status-rejected')) return 'rejected';
    return 'pending';
}

// Tăng số lượng trạng thái
function incrementStatusCount(status) {
    const countElement = document.getElementById(`${status}-count`);
    if (countElement) {
        const currentCount = parseInt(countElement.textContent || '0');
        countElement.textContent = (currentCount + 1).toString();
    }
}

// Giảm số lượng trạng thái
function decrementStatusCount(status) {
    const countElement = document.getElementById(`${status}-count`);
    if (countElement) {
        const currentCount = parseInt(countElement.textContent || '0');
        const newCount = Math.max(0, currentCount - 1);
        countElement.textContent = newCount.toString();
    }
}

// Hàm bật/tắt nút Lưu và Hủy
function toggleSaveButtons(enabled) {
    const saveBtn = document.getElementById('btn-save');
    const cancelBtn = document.getElementById('btn-cancel');
    
    if (saveBtn) {
        saveBtn.disabled = !enabled;
    }
    
    if (cancelBtn) {
        cancelBtn.disabled = !enabled;
    }
}

// Hàm gửi cập nhật lên server
async function saveUpdates() {
    if (pendingUpdates.length === 0) {
        showToastDanger('Không có thay đổi để lưu');
        return;
    }
    
    // Cập nhật thông tin hiển thị trong modal
    document.getElementById('total-updates').textContent = pendingUpdates.length;
    
    // Đếm số lượng ca được duyệt và từ chối
    const approvedCount = pendingUpdates.filter(item => item.trangThai === 1).length;
    const rejectedCount = pendingUpdates.filter(item => item.trangThai === 4).length;
    
    document.getElementById('approved-updates').textContent = approvedCount;
    document.getElementById('rejected-updates').textContent = rejectedCount;
    
    // Hiển thị modal xác nhận
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmSaveModal'));
    confirmModal.show();
    
    // Gắn sự kiện cho nút xác nhận trong modal
    document.getElementById('btn-confirm-save').onclick = async function() {
        // Ẩn modal
        confirmModal.hide();
        
        // Hiển thị thông báo đang xử lý
        showToastPrimary('Đang cập nhật...');
        
        try {
            const response = await fetch('/api/ca-lam-viec', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    updates: pendingUpdates
                })
            });
            
            const result = await response.json();
            
            if (result.status) {
                showToastSuccess('Cập nhật trạng thái ca làm việc thành công');
                
                // Xóa các thuộc tính data-original-status vì thay đổi đã được lưu
                document.querySelectorAll('tr[data-original-status]').forEach(row => {
                    row.removeAttribute('data-original-status');
                });
                
                // Xóa danh sách cập nhật
                pendingUpdates = [];
                
                // Vô hiệu hóa nút Lưu và Hủy
                toggleSaveButtons(false);
                
                // Cập nhật lại danh sách
                const weekSelect = document.getElementById('week-select');
                if (weekSelect) {
                    const weekNumber = parseInt(weekSelect.value.split('-W')[1]);
                    const updatedData = await getAPICaLamViec(weekNumber);
                    thaoTacCaLamViec(updatedData);
                }
            } else {
                showToastDanger(result.error || 'Cập nhật thất bại');
                
                // Khôi phục trạng thái ban đầu nếu lưu thất bại
                cancelUpdates();
            }
        } catch (error) {
            console.error('Error updating shift status:', error);
            showToastDanger('Đã xảy ra lỗi khi cập nhật trạng thái ca làm việc');
            
            // Khôi phục trạng thái ban đầu nếu lưu thất bại
            cancelUpdates();
        }
    };
}

// Hàm hủy các thay đổi
function cancelUpdates() {
    // Khôi phục trạng thái của các hàng đã thay đổi
    const changedRows = document.querySelectorAll('tr[data-original-status]');
    changedRows.forEach(row => {
        const originalStatus = row.getAttribute('data-original-status');
        const currentStatus = getStatusFromClass(row.querySelector('.status-badge').className);
        
        // Giảm số lượng trạng thái hiện tại
        decrementStatusCount(currentStatus);
        
        // Tăng số lượng trạng thái ban đầu
        incrementStatusCount(originalStatus);
        
        // Xóa thuộc tính 
        row.removeAttribute('data-original-status');
    });
    
    // Xóa danh sách cập nhật
    pendingUpdates = [];
    
    // Vô hiệu hóa nút Lưu và Hủy
    toggleSaveButtons(false);
    
    // Tải lại danh sách từ server để khôi phục trạng thái ban đầu
    const weekSelect = document.getElementById('week-select');
    if (weekSelect) {
        const weekNumber = parseInt(weekSelect.value.split('-W')[1]);
        getAPICaLamViec(weekNumber).then(data => {
            thaoTacCaLamViec(data);
        });
    }
}

// Hàm cập nhật ngày cho các nút điều hướng ngày trong tuần
function updateWeekDateRange(weekValue) {
    // Tách năm và số tuần từ giá trị week (định dạng YYYY-Www)
    const [year, weekPart] = weekValue.split('-');
    const weekNumber = parseInt(weekPart.substring(1));
    
    // Tính ngày đầu tiên (thứ Hai) của tuần dựa trên năm và số tuần
    const firstDayOfWeek = getFirstDayOfWeek(parseInt(year), weekNumber);
    
    // Cập nhật hiển thị cho từng ngày trong tuần
    const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    dayIds.forEach((dayId, index) => {
        const date = new Date(firstDayOfWeek);
        date.setDate(firstDayOfWeek.getDate() + index);
        
        // Định dạng ngày theo dd/MM
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        
        // Gán vào thẻ span
        const dateSpan = document.getElementById(`${dayId}-date`);
        if (dateSpan) {
            dateSpan.textContent = formattedDate;
        }
        
        // Highlight ngày hiện tại nếu nằm trong tuần đang xem
        const navLink = document.getElementById(`${dayId}-nav`);
        if (navLink) {
            // Kiểm tra xem ngày này có phải là ngày hiện tại không
            const today = new Date();
            const isToday = date.getDate() === today.getDate() && 
                           date.getMonth() === today.getMonth() && 
                           date.getFullYear() === today.getFullYear();
            
            // Thêm/xóa class active tùy theo ngày
            if (isToday) {
                navLink.parentElement.classList.add('active');
            } else {
                navLink.parentElement.classList.remove('active');
            }
        }
    });
    
    // Mặc định chọn thứ Hai
    document.querySelector('.pagination .page-item:first-child').classList.add('active');
}

// Hàm tính ngày thứ Hai đầu tuần dựa trên năm và số tuần
function getFirstDayOfWeek(year, weekNumber) {
    // Sử dụng chuẩn ISO 8601 (tuần bắt đầu từ thứ Hai)
    // Ngày 4/1 luôn nằm trong tuần 1
    const jan4th = new Date(year, 0, 4);
    
    // Tìm thứ Hai của tuần chứa ngày 4/1
    const firstMondayOfYear = new Date(jan4th);
    const dayOfWeek = jan4th.getDay() || 7; // Chuyển 0 (CN) thành 7
    firstMondayOfYear.setDate(jan4th.getDate() - dayOfWeek + 1);
    
    // Tính ngày thứ Hai của tuần cần tìm
    const mondayOfTargetWeek = new Date(firstMondayOfYear);
    mondayOfTargetWeek.setDate(firstMondayOfYear.getDate() + (weekNumber - 1) * 7);
    
    return mondayOfTargetWeek;
}

// Hàm định dạng ngày theo chuẩn Việt Nam: DD/MM/YYYY
function formatDateToVN(date) {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
}

// Cập nhật hàm filterShiftsByDate
function filterShiftsByDate(dateStr) {
    const [day, month] = dateStr.split('/');
    
    // Lọc danh sách ca làm việc hiện tại
    const tableBody = document.querySelector('#registerShiftTable tbody');
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    
    // Không lọc nếu không có dữ liệu hoặc chỉ có một hàng thông báo
    if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('td[colspan]'))) {
        return;
    }
    
    // Hiển thị/ẩn các hàng dựa trên ngày
    let hasVisibleRows = false;
    rows.forEach(row => {
        const rowDay = row.getAttribute('data-day');
        const rowMonth = row.getAttribute('data-month');
        
        if (rowDay === day && rowMonth === month) {
            row.style.display = '';
            hasVisibleRows = true;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Cập nhật số lượng trạng thái
    updateStatusCounts();
    
    // Cập nhật bảng thống kê theo chức vụ sau khi lọc - QUAN TRỌNG
    if (window.fullShiftsList) {
        // Cập nhật bảng thống kê với ngày đã chọn
        updateRoleStatistics(window.fullShiftsList);
    }
}

// Cập nhật số lượng các trạng thái
function updateStatusCounts() {
    const visibleRows = Array.from(document.querySelectorAll('#registerShiftTable tbody tr')).filter(row => 
        row.style.display !== 'none' && !row.classList.contains('no-data-row')
    );
    
    // Đếm số lượng theo trạng thái
    const counts = {
        pending: 0,
        approved: 0,
        timekeeping: 0,
        confirmed: 0,
        rejected: 0
    };
    
    visibleRows.forEach(row => {
        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge) {
            if (statusBadge.classList.contains('status-pending')) counts.pending++;
            else if (statusBadge.classList.contains('status-approved')) counts.approved++;
            else if (statusBadge.classList.contains('status-timekeeping')) counts.timekeeping++;
            else if (statusBadge.classList.contains('status-confirmed')) counts.confirmed++;
            else if (statusBadge.classList.contains('status-rejected')) counts.rejected++;
        }
    });
    
    // Cập nhật hiển thị số lượng
    document.getElementById('pending-count').textContent = counts.pending;
    document.getElementById('approved-count').textContent = counts.approved;
    document.getElementById('timekeeping-count').textContent = counts.timekeeping;
    document.getElementById('confirmed-count').textContent = counts.confirmed;
    document.getElementById('rejected-count').textContent = counts.rejected;
    
    // Kiểm tra tuần được chọn để quyết định hiển thị
    const weekSelect = document.getElementById('week-select');
    if (weekSelect) {
        updateStatusVisibility(weekSelect.value);
    }
}

// Đã sửa lại hàm để chỉ sử dụng weekSelect
function generateWeekOptions(currentWeekValue) {
    const weekSelect = document.getElementById('week-select');
    if (!weekSelect) {
        console.error('Không tìm thấy phần tử có id "week-select"');
        return;
    }
    
    // Xóa options hiện tại
    weekSelect.innerHTML = '';
    
    // Lấy năm và tuần hiện tại từ giá trị week
    const [currentYear, currentWeekPart] = currentWeekValue.split('-');
    const currentWeekNumber = parseInt(currentWeekPart.substring(1));
    
    // Lấy thông tin tuần hiện tại (không phải tuần sau)
    const now = new Date();
    const currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    currentDate.setUTCDate(currentDate.getUTCDate() + 4 - (currentDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    const currentWeek = Math.ceil((((currentDate - yearStart) / 86400000) + 1) / 7);
    
    // Lấy thời điểm bắt đầu đăng ký ca (từ 4 tuần trước đến 4 tuần sau)
    const startWeekNumber = Math.max(1, currentWeek - 4);
    const endWeekNumber = currentWeek + 4;
    
    // Thêm các tuần từ tuần bắt đầu đến tuần sau
    for (let weekNum = startWeekNumber; weekNum <= endWeekNumber; weekNum++) {
        // Tính ngày đầu tiên (thứ Hai) của tuần
        const firstDay = getFirstDayOfWeek(parseInt(currentYear), weekNum);
        
        // Tính ngày cuối cùng (Chủ nhật) của tuần
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        
        // Định dạng ngày
        const startDateFormatted = formatDateToVN(firstDay);
        const endDateFormatted = formatDateToVN(lastDay);
        
        // Tạo option
        const option = document.createElement('option');
        option.value = `${currentYear}-W${weekNum.toString().padStart(2, '0')}`;
        option.textContent = `Tuần ${weekNum}: ${startDateFormatted} -> ${endDateFormatted}`;
        
        // Đảm bảo chọn tuần sau làm mặc định
        if (weekNum === currentWeekNumber) {
            option.selected = true;
        }
        
        weekSelect.appendChild(option);
    }
}

// Hàm kiểm tra mối quan hệ giữa tuần được chọn và tuần hiện tại
function checkSelectedWeekRelation(selectedWeekValue) {
    // Phân tích giá trị tuần được chọn
    const [selectedYear, selectedWeekPart] = selectedWeekValue.split('-');
    const selectedWeek = parseInt(selectedWeekPart.substring(1));
    
    // Lấy thông tin tuần hiện tại
    const now = new Date();
    const currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    currentDate.setUTCDate(currentDate.getUTCDate() + 4 - (currentDate.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1));
    const currentWeek = Math.ceil((((currentDate - yearStart) / 86400000) + 1) / 7);
    const currentYear = currentDate.getUTCFullYear();
    
    // So sánh tuần được chọn với tuần hiện tại
    if (parseInt(selectedYear) > currentYear) {
        return 'future'; // Năm sau
    } else if (parseInt(selectedYear) < currentYear) {
        return 'past'; // Năm trước
    } else {
        // Cùng năm
        if (selectedWeek > currentWeek) {
            return 'future'; // Tuần sau
        } else if (selectedWeek < currentWeek) {
            return 'past'; // Tuần trước
        } else {
            return 'current'; // Tuần hiện tại
        }
    }
}

// Hàm cập nhật hiển thị trạng thái dựa trên tuần được chọn
function updateStatusVisibility(weekValue) {
    const weekRelation = checkSelectedWeekRelation(weekValue);
    
    // Lấy các phần tử trạng thái
    const pendingStatusItem = document.querySelector('.list-inline-item:has(.status-pending)');
    const approvedStatusItem = document.querySelector('.list-inline-item:has(.status-approved)');
    const timekeepingStatusItem = document.querySelector('.list-inline-item:has(.status-timekeeping)');
    const confirmedStatusItem = document.querySelector('.list-inline-item:has(.status-confirmed)');
    const rejectedStatusItem = document.querySelector('.list-inline-item:has(.status-rejected)');
    
    if (weekRelation === 'future') {
        // Tuần sau: Hiển thị Chờ duyệt, Đã duyệt, Đã từ chối
        if (pendingStatusItem) pendingStatusItem.style.display = '';
        if (approvedStatusItem) approvedStatusItem.style.display = '';
        if (timekeepingStatusItem) timekeepingStatusItem.style.display = 'none';
        if (confirmedStatusItem) confirmedStatusItem.style.display = 'none';
        if (rejectedStatusItem) rejectedStatusItem.style.display = '';
    } else {
        // Tuần hiện tại hoặc trước: Hiển thị Chấm công, Đã chấm, Đã từ chối
        if (pendingStatusItem) pendingStatusItem.style.display = 'none';
        if (approvedStatusItem) approvedStatusItem.style.display = 'none';
        if (timekeepingStatusItem) timekeepingStatusItem.style.display = '';
        if (confirmedStatusItem) confirmedStatusItem.style.display = '';
        if (rejectedStatusItem) rejectedStatusItem.style.display = '';
    }
}

// Toast functions - giữ nguyên
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

// Cập nhật hàm handleCheckboxChange để chỉ đếm checkbox đang hiển thị
function handleCheckboxChange() {
    // Kiểm tra xem có checkbox nào được chọn không - chỉ đếm các checkbox thuộc hàng đang hiển thị
    const hasChecked = document.querySelectorAll('#registerShiftTable tbody tr:not([style*="display: none"]) .shift-checkbox:checked').length > 0;
    
    // Kích hoạt/vô hiệu hóa nút duyệt hàng loạt
    const bulkApproveBtn = document.getElementById('btn-bulk-approve');
    if (bulkApproveBtn) {
        bulkApproveBtn.disabled = !hasChecked;
    }
}

// Hàm gắn sự kiện cho tất cả checkbox
function attachCheckboxEvents() {
    document.querySelectorAll('.shift-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}

// Cập nhật hàm bulkApproveShifts để chỉ xử lý các hàng đang hiển thị
function bulkApproveShifts() {
    // Lấy tất cả checkbox đã chọn và thuộc hàng đang hiển thị
    const checkedBoxes = document.querySelectorAll('#registerShiftTable tbody tr:not([style*="display: none"]) .shift-checkbox:checked');
    
    // Duyệt qua từng checkbox
    checkedBoxes.forEach(checkbox => {
        const shiftId = checkbox.getAttribute('data-id');
        
        // Thêm vào danh sách cập nhật
        addToUpdateList(shiftId, 1);
        
        // Cập nhật giao diện hàng
        const row = checkbox.closest('tr');
        if (row) {
            // Lấy trạng thái ban đầu
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge) {
                // Lưu trạng thái ban đầu
                const originalStatus = getStatusFromClass(statusBadge.className);
                row.setAttribute('data-original-status', originalStatus);
                
                // Giảm số lượng trạng thái cũ
                decrementStatusCount(originalStatus);
                
                // Cập nhật status badge
                statusBadge.className = 'status-badge status-approved';
                statusBadge.textContent = 'Đã duyệt';
                
                // Tăng số lượng 'Đã duyệt'
                incrementStatusCount('approved');
            }
            
            // Vô hiệu hóa checkbox
            checkbox.disabled = true;
            checkbox.checked = false;
            
            // Cập nhật các nút hành động
            const actionCell = row.querySelector('td:last-child');
            if (actionCell) {
                // Tắt tooltip trước khi thay đổi nội dung
                const tooltipsInCell = actionCell.querySelectorAll('[data-bs-tooltip="tooltip"]');
                tooltipsInCell.forEach(el => {
                    const tooltip = bootstrap.Tooltip.getInstance(el);
                    if (tooltip) {
                        tooltip.dispose();
                    }
                });
                
                // Thay đổi giao diện nút
                actionCell.innerHTML = `
                    <button class="btn btn-sm btn-secondary action-btn" disabled>
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary action-btn" disabled>
                        <i class="fas fa-times"></i>
                    </button>
                `;
            }
        }
    });
    
    // Vô hiệu hóa nút duyệt hàng loạt
    const bulkApproveBtn = document.getElementById('btn-bulk-approve');
    if (bulkApproveBtn) {
        bulkApproveBtn.disabled = true;
    }
    
    // Vô hiệu hóa checkbox Chọn tất cả
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    
    // Kích hoạt nút Lưu và Hủy
    toggleSaveButtons(true);
}

/*** PHẦN PHÂN CÔNG CA LÀM VIỆC ***/

// Hàm khởi tạo cho tab Phân công - đã đơn giản hóa
function initializeAssignmentTab() {
    // Hiển thị thông báo "Chức năng đang phát triển"
    showTemporaryAssignmentMessage();
    
    // Thêm event listener cho nút Refresh
    const refreshBtn = document.getElementById('btn-refresh-stats');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            showToastPrimary('Tính năng đang được phát triển');
        });
    }
    
    // Thêm event listener cho nút Phân công
    const assignBtn = document.getElementById('btn-assign-shift');
    if (assignBtn) {
        assignBtn.addEventListener('click', function() {
            showToastPrimary('Tính năng đang được phát triển');
        });
    }
}

// Hiển thị thông báo tạm thời cho tab phân công
function showTemporaryAssignmentMessage() {
    // Thông báo trong bảng thống kê
    const statsTable = document.getElementById('dailyStatsTable');
    if (statsTable && statsTable.querySelector('tbody')) {
        statsTable.querySelector('tbody').innerHTML = '<tr><td colspan="7" class="text-center">Tính năng đang được phát triển</td></tr>';
    }
    
    // Thông báo trong bảng lịch trong tuần
    const weeklyTable = document.getElementById('weeklyScheduleTable');
    if (weeklyTable && weeklyTable.querySelector('tbody')) {
        weeklyTable.querySelector('tbody').innerHTML = '<tr><td colspan="8" class="text-center">Tính năng đang được phát triển</td></tr>';
    }
    
    // Thông báo trong bảng nhân viên chưa đăng ký
    const employeesTable = document.getElementById('unregisteredEmployeesTable');
    if (employeesTable && employeesTable.querySelector('tbody')) {
        employeesTable.querySelector('tbody').innerHTML = '<tr><td colspan="7" class="text-center">Tính năng đang được phát triển</td></tr>';
    }
    
    // Hiển thị thông tin phạm vi ngày
    const dateRange = document.getElementById('stats-date-range');
    if (dateRange) {
        dateRange.textContent = 'Tính năng đang phát triển';
    }
}

// Hàm cập nhật bảng thống kê theo chức vụ, ngày, và tuần được chọn
function updateRoleStatistics(list) {
    // Kiểm tra nếu list rỗng
    if (!list || list.length === 0) {
        clearRoleStats();
        return;
    }
    
    // Lấy ngày được chọn từ tab điều hướng ngày
    const activeTab = document.querySelector('.pagination .page-item.active');
    let selectedDate = null;
    
    if (activeTab) {
        const dateSpan = activeTab.querySelector('span');
        if (dateSpan && dateSpan.textContent) {
            const [day, month] = dateSpan.textContent.split('/');
            selectedDate = { day, month };
        }
    }
    
    // Hiển thị thông báo debug về ngày được chọn
    console.log('Ngày được chọn:', selectedDate);
    
    // Khởi tạo biến đếm cho từng chức vụ và ca
    const stats = {
        waiter: { morning: { count: 0 }, afternoon: { count: 0 } },
        chef: { morning: { count: 0 }, afternoon: { count: 0 } }
    };
    
    // Lọc theo chức vụ nếu đã chọn
    const roleFilter = document.getElementById('duyetChucVu-select');
    let filteredList = [...list]; // Tạo bản sao của danh sách để không ảnh hưởng đến danh sách gốc
    
    if (roleFilter && roleFilter.value !== 'all') {
        const roleValue = parseInt(roleFilter.value);
        filteredList = filteredList.filter(reg => reg.NhanVien.chucVu === roleValue);
    }
    
    // Tính toán số liệu thống kê
    filteredList.forEach(shift => {
        // Kiểm tra nếu shift không có NhanVien
        if (!shift.NhanVien) {
            console.warn('Shift không có thông tin NhanVien:', shift);
            return;
        }
        
        // Bỏ qua nếu không đúng ngày được chọn
        if (selectedDate) {
            const shiftDate = new Date(shift.ngay);
            const shiftDay = shiftDate.getDate().toString().padStart(2, '0');
            const shiftMonth = (shiftDate.getMonth() + 1).toString().padStart(2, '0');
            
            if (shiftDay !== selectedDate.day || shiftMonth !== selectedDate.month) {
                return;
            }
        }
        
        // Phân loại theo chức vụ và ca làm việc
        const role = shift.NhanVien.chucVu;
        
        if (role === 0) { // Phục vụ
            if (shift.caLamViec === 0) { // Ca sáng
                stats.waiter.morning.count++;
            } else { // Ca chiều
                stats.waiter.afternoon.count++;
            }
        } else if (role === 1) { // Đầu bếp
            if (shift.caLamViec === 0) { // Ca sáng
                stats.chef.morning.count++;
            } else { // Ca chiều
                stats.chef.afternoon.count++;
            }
        }
    });
    
    console.log('Thống kê ca làm việc:', stats);
    
    // Cập nhật hiển thị cho Phục vụ
    document.getElementById('waiter-morning-count').textContent = stats.waiter.morning.count;
    document.getElementById('waiter-afternoon-count').textContent = stats.waiter.afternoon.count;
    document.getElementById('waiter-total').textContent = 
        stats.waiter.morning.count + stats.waiter.afternoon.count;
    
    // Cập nhật hiển thị cho Đầu bếp
    document.getElementById('chef-morning-count').textContent = stats.chef.morning.count;
    document.getElementById('chef-afternoon-count').textContent = stats.chef.afternoon.count;
    document.getElementById('chef-total').textContent = 
        stats.chef.morning.count + stats.chef.afternoon.count;
    
    // Cập nhật tổng cộng
    const totalMorningCount = stats.waiter.morning.count + stats.chef.morning.count;
    const totalAfternoonCount = stats.waiter.afternoon.count + stats.chef.afternoon.count;
    
    document.getElementById('total-morning-count').textContent = totalMorningCount;
    document.getElementById('total-afternoon-count').textContent = totalAfternoonCount;
    document.getElementById('grand-total').textContent = totalMorningCount + totalAfternoonCount;
    
    // Thêm thông tin ngày vào header của bảng thống kê
    updateRoleStatsHeader(selectedDate);
}

// Thêm hàm mới để xóa tất cả số liệu thống kê
function clearRoleStats() {
    document.getElementById('waiter-morning-count').textContent = '0';
    document.getElementById('waiter-afternoon-count').textContent = '0';
    document.getElementById('waiter-total').textContent = '0';
    document.getElementById('chef-morning-count').textContent = '0';
    document.getElementById('chef-afternoon-count').textContent = '0';
    document.getElementById('chef-total').textContent = '0';
    document.getElementById('total-morning-count').textContent = '0';
    document.getElementById('total-afternoon-count').textContent = '0';
    document.getElementById('grand-total').textContent = '0';
}

// Thêm hàm cập nhật header cho bảng thống kê
function updateRoleStatsHeader(selectedDate) {
    const headerInfo = document.getElementById('role-stats-date');
    if (!headerInfo) return;
    
    if (selectedDate) {
        // Lấy tên thứ trong tuần
        const activeTab = document.querySelector('.pagination .page-item.active');
        let dayName = '';
        if (activeTab) {
            const linkText = activeTab.querySelector('a').innerText.split('\n')[0];
            dayName = linkText;
        }
        
        // Hiển thị thông tin ngày
        headerInfo.textContent = `Thống kê ngày: ${dayName} (${selectedDate.day}/${selectedDate.month})`;
        headerInfo.style.display = '';
    } else {
        // Hiển thị thông báo nếu không có ngày được chọn
        headerInfo.textContent = 'Vui lòng chọn một ngày để xem thống kê';
        headerInfo.style.display = '';
    }
}