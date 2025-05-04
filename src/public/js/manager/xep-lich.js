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
            thaoTacCaLamViec(data);
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

// Cập nhật hàm filterShiftsByDate để reset checkbox select-all khi lọc
function filterShiftsByDate(dateStr) {
    // Lấy giá trị từ weekSelect
    const weekValue = document.getElementById('week-select').value;
    const year = weekValue.split('-')[0];
    
    // Phần còn lại giữ nguyên
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
        // Sử dụng thuộc tính data-date của hàng thay vì tìm cột chứa ngày
        const rowDay = row.getAttribute('data-day');
        const rowMonth = row.getAttribute('data-month');
        
        if (rowDay === day && rowMonth === month) {
            row.style.display = '';
            hasVisibleRows = true;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Hiển thị thông báo nếu không có ca làm việc nào trong ngày đã chọn
    if (!hasVisibleRows) {
        const noDataRow = document.createElement('tr');
        noDataRow.classList.add('no-data-row');
        noDataRow.innerHTML = '<td colspan="5" class="text-center">Không có ca làm việc nào trong ngày đã chọn</td>';
        
        // Xóa thông báo cũ nếu có
        const existingNoData = tableBody.querySelector('.no-data-row');
        if (existingNoData) {
            existingNoData.remove();
        }
        
        tableBody.appendChild(noDataRow);
    } else {
        // Xóa thông báo nếu có ca làm việc
        const existingNoData = tableBody.querySelector('.no-data-row');
        if (existingNoData) {
            existingNoData.remove();
        }
    }
    
    // Bỏ chọn checkbox "Chọn tất cả" khi lọc theo ngày
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
    }
    
    // Cập nhật trạng thái nút duyệt hàng loạt
    handleCheckboxChange();
    
    // Cập nhật số lượng trạng thái
    updateStatusCounts();
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

// Biến lưu trữ tuần hiện tại
let currentAssignmentWeek = null;

// Hàm khởi tạo cho tab Phân công
function initializeAssignmentTab() {
    // Tạo options cho select tuần
    const assignmentWeekFilter = document.getElementById('assignment-week-filter');
    populateWeekOptions(assignmentWeekFilter);
    
    // Lấy tuần hiện tại và cập nhật thống kê
    currentAssignmentWeek = assignmentWeekFilter.value;
    updateAssignmentStats(currentAssignmentWeek);
    
    // Cập nhật lịch làm việc trong tuần
    updateWeeklySchedule(currentAssignmentWeek);
    
    // Lấy danh sách nhân viên chưa đăng ký ca
    fetchUnregisteredEmployees(currentAssignmentWeek);
    
    // Thêm event listeners
    assignmentWeekFilter.addEventListener('change', function() {
        currentAssignmentWeek = this.value;
        updateAssignmentStats(currentAssignmentWeek);
        updateWeeklySchedule(currentAssignmentWeek);
        fetchUnregisteredEmployees(currentAssignmentWeek);
    });
    
    // Nút cập nhật thống kê
    document.getElementById('btn-refresh-stats').addEventListener('click', function() {
        updateAssignmentStats(currentAssignmentWeek);
        updateWeeklySchedule(currentAssignmentWeek);
        fetchUnregisteredEmployees(currentAssignmentWeek);
    });
    
    // Nút phân công ca
    document.getElementById('btn-assign-shift').addEventListener('click', function() {
        openAssignShiftModal();
    });
    
    // Checkbox chọn tất cả nhân viên
    document.getElementById('select-all-employees').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#unregisteredEmployeesTable tbody .employee-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

// Hàm cập nhật thống kê ca làm việc theo ngày
async function updateAssignmentStats(weekValue) {
    try {
        // Hiển thị trạng thái đang tải
        const statsTable = document.getElementById('dailyStatsTable');
        statsTable.querySelector('tbody').innerHTML = '<tr><td colspan="7" class="text-center">Đang tải dữ liệu...</td></tr>';
        
        // Lấy thông tin tuần
        const { year, week } = parseWeekValue(weekValue);
        const weekDays = getWeekDays(year, week);
        
        // Gọi API để lấy thống kê
        const response = await fetch(`/api/ca-lam-viec/stats?week=${week}&year=${year}`);
        const data = await response.json();
        
        if (data.status) {
            // Cập nhật thông tin phạm vi ngày
            document.getElementById('stats-date-range').textContent = 
                `Từ ${formatDateToVN(weekDays[0])} đến ${formatDateToVN(weekDays[6])}`;
            
            // Render bảng thống kê
            renderDailyStats(weekDays, data.stats);
        } else {
            showToastDanger(data.error || 'Không thể tải thống kê ca làm việc');
        }
    } catch (error) {
        console.error('Error loading assignment stats:', error);
        showToastDanger('Đã xảy ra lỗi khi tải thống kê ca làm việc');
    }
}

// Hàm hiển thị thống kê ca làm việc theo ngày
function renderDailyStats(weekDays, stats) {
    const tbody = document.getElementById('dailyStatsTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    const dayNames = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật'];
    
    weekDays.forEach((date, index) => {
        const dateStr = formatDateAPI(date);
        const dayStat = stats[dateStr] || {
            morning: 0,
            afternoon: 0,
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0
        };
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${dayNames[index]}</strong><br>${formatDateToVN(date)}</td>
            <td class="text-center">${dayStat.morning || 0}</td>
            <td class="text-center">${dayStat.afternoon || 0}</td>
            <td class="text-center">${dayStat.total || 0}</td>
            <td class="text-center text-success">${dayStat.approved || 0}</td>
            <td class="text-center text-warning">${dayStat.pending || 0}</td>
            <td class="text-center text-danger">${dayStat.rejected || 0}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Hàm cập nhật lịch làm việc trong tuần
async function updateWeeklySchedule(weekValue) {
    try {
        // Hiển thị trạng thái đang tải
        const scheduleTable = document.getElementById('weeklyScheduleTable');
        scheduleTable.querySelector('tbody').innerHTML = '<tr><td colspan="8" class="text-center">Đang tải lịch làm việc...</td></tr>';
        
        // Lấy thông tin tuần
        const { year, week } = parseWeekValue(weekValue);
        const weekDays = getWeekDays(year, week);
        
        // Cập nhật ngày hiển thị trong header
        const dayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        dayIds.forEach((id, index) => {
            document.getElementById(`${id}-schedule`).textContent = formatDateShort(weekDays[index]);
        });
        
        // Gọi API để lấy lịch làm việc
        const response = await fetch(`/api/ca-lam-viec/weekly?week=${week}&year=${year}`);
        const data = await response.json();
        
        if (data.status) {
            // Nhóm dữ liệu theo nhân viên
            const employeeSchedules = groupScheduleByEmployee(data.schedules, weekDays);
            renderWeeklySchedule(employeeSchedules, weekDays);
        } else {
            scheduleTable.querySelector('tbody').innerHTML = '<tr><td colspan="8" class="text-center">Không có dữ liệu lịch làm việc</td></tr>';
        }
    } catch (error) {
        console.error('Error loading weekly schedule:', error);
        showToastDanger('Đã xảy ra lỗi khi tải lịch làm việc');
    }
}

// Hàm nhóm lịch làm việc theo nhân viên
function groupScheduleByEmployee(schedules, weekDays) {
    const employeeMap = new Map();
    
    schedules.forEach(shift => {
        if (!employeeMap.has(shift.NhanVien.id)) {
            employeeMap.set(shift.NhanVien.id, {
                id: shift.NhanVien.id,
                name: shift.NhanVien.ten,
                role: shift.NhanVien.chucVu,
                shifts: Array(7).fill(null).map(() => ({ morning: null, afternoon: null }))
            });
        }
        
        const employee = employeeMap.get(shift.NhanVien.id);
        const shiftDate = new Date(shift.ngay);
        
        // Tìm index của ngày trong tuần
        const dayIndex = weekDays.findIndex(day => 
            day.getDate() === shiftDate.getDate() && 
            day.getMonth() === shiftDate.getMonth() && 
            day.getFullYear() === shiftDate.getFullYear()
        );
        
        if (dayIndex !== -1) {
            if (shift.caLamViec === 0) {
                employee.shifts[dayIndex].morning = shift;
            } else {
                employee.shifts[dayIndex].afternoon = shift;
            }
        }
    });
    
    return Array.from(employeeMap.values());
}

// Hàm hiển thị lịch làm việc trong tuần
function renderWeeklySchedule(employeeSchedules, weekDays) {
    const tbody = document.getElementById('weeklyScheduleTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (employeeSchedules.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Không có dữ liệu lịch làm việc</td></tr>';
        return;
    }
    
    employeeSchedules.forEach(employee => {
        const row = document.createElement('tr');
        
        // Tên nhân viên và chức vụ
        const roleName = employee.role === 0 ? 'Phục vụ' : employee.role === 1 ? 'Đầu bếp' : 'Thu ngân';
        row.innerHTML = `<td><strong>${employee.name}</strong><br><small class="text-muted">${roleName}</small></td>`;
        
        // Thêm ô cho mỗi ngày trong tuần
        employee.shifts.forEach(dayShifts => {
            const cell = document.createElement('td');
            
            // Ca sáng
            if (dayShifts.morning) {
                const morningDiv = createShiftDiv(dayShifts.morning, 'morning');
                cell.appendChild(morningDiv);
            }
            
            // Ca chiều
            if (dayShifts.afternoon) {
                const afternoonDiv = createShiftDiv(dayShifts.afternoon, 'afternoon');
                cell.appendChild(afternoonDiv);
            }
            
            // Nếu không có ca nào
            if (!dayShifts.morning && !dayShifts.afternoon) {
                cell.innerHTML = '<div class="text-center text-muted">-</div>';
            }
            
            row.appendChild(cell);
        });
        
        tbody.appendChild(row);
    });
}

// Hàm tạo div hiển thị thông tin ca làm việc
function createShiftDiv(shift, shiftType) {
    const div = document.createElement('div');
    div.className = `shift-info ${shiftType} status-${getStatusClass(shift.trangThai)}`;
    
    let shiftName = shiftType === 'morning' ? 'Ca sáng' : 'Ca chiều';
    let shiftTime = shiftType === 'morning' ? '6:00-14:00' : '14:00-22:00';
    
    div.innerHTML = `
        <div class="shift-time">${shiftName}</div>
        <div class="shift-status">${getStatusLabel(shift.trangThai)}</div>
    `;
    
    return div;
}

// Hàm lấy class tương ứng với trạng thái
function getStatusClass(status) {
    switch(status) {
        case 0: return 'pending';
        case 1: return 'approved';
        case 2: return 'timekeeping';
        case 3: return 'confirmed';
        case 4: return 'rejected';
        default: return 'pending';
    }
}

// Hàm lấy nhãn tương ứng với trạng thái
function getStatusLabel(status) {
    switch(status) {
        case 0: return 'Chờ duyệt';
        case 1: return 'Đã duyệt';
        case 2: return 'Chấm công';
        case 3: return 'Đã chấm';
        case 4: return 'Đã từ chối';
        default: return 'Chờ duyệt';
    }
}

// Hàm lấy danh sách nhân viên chưa đăng ký ca
async function fetchUnregisteredEmployees(weekValue) {
    try {
        // Hiển thị trạng thái đang tải
        const employeeTable = document.getElementById('unregisteredEmployeesTable');
        employeeTable.querySelector('tbody').innerHTML = '<tr><td colspan="7" class="text-center">Đang tải dữ liệu...</td></tr>';
        
        // Lấy thông tin tuần
        const { year, week } = parseWeekValue(weekValue);
        
        // Lọc theo chức vụ nếu có
        const roleFilter = document.getElementById('assignment-role-filter').value;
        const roleParam = roleFilter !== 'all' ? `&role=${roleFilter}` : '';
        
        // Gọi API để lấy danh sách nhân viên chưa đăng ký ca
        const response = await fetch(`/api/nhan-vien/unregistered?week=${week}&year=${year}${roleParam}`);
        const data = await response.json();
        
        if (data.status) {
            renderUnregisteredEmployees(data.employees);
        } else {
            employeeTable.querySelector('tbody').innerHTML = '<tr><td colspan="7" class="text-center">Không có dữ liệu nhân viên</td></tr>';
            showToastDanger(data.error || 'Không thể tải danh sách nhân viên');
        }
    } catch (error) {
        console.error('Error loading unregistered employees:', error);
        showToastDanger('Đã xảy ra lỗi khi tải danh sách nhân viên');
    }
}

// Hàm hiển thị danh sách nhân viên chưa đăng ký ca
function renderUnregisteredEmployees(employees) {
    const tbody = document.getElementById('unregisteredEmployeesTable').querySelector('tbody');
    tbody.innerHTML = '';
    
    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không có nhân viên nào cần phân công</td></tr>';
        return;
    }
    
    employees.forEach(employee => {
        const row = document.createElement('tr');
        
        // Định dạng ngày đăng ký cuối
        const lastRegistration = employee.lastRegistration 
            ? new Date(employee.lastRegistration).toLocaleDateString('vi-VN')
            : 'Chưa có';
        
        // Map chức vụ
        const roleMap = {
            0: 'Phục vụ',
            1: 'Đầu bếp',
            2: 'Thu ngân'
        };
        
        row.innerHTML = `
            <td><input type="checkbox" class="employee-checkbox" data-id="${employee.id}" data-name="${employee.ten}"></td>
            <td>${employee.maNV || '-'}</td>
            <td>${employee.ten}</td>
            <td>${roleMap[employee.chucVu] || 'Không xác định'}</td>
            <td class="text-center">${employee.totalShifts || 0}</td>
            <td>${lastRegistration}</td>
            <td>
                <button class="btn btn-sm btn-primary assign-btn" data-id="${employee.id}" data-name="${employee.ten}">
                    <i class="fas fa-calendar-plus"></i> Phân công
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Gắn sự kiện cho các nút phân công
    document.querySelectorAll('.assign-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            const employeeName = this.getAttribute('data-name');
            openAssignShiftModal([{ id: employeeId, name: employeeName }]);
        });
    });
}

// Hàm mở modal phân công ca làm việc
function openAssignShiftModal(preSelectedEmployees = null) {
    // Lấy danh sách nhân viên được chọn
    let selectedEmployees = preSelectedEmployees;
    
    if (!selectedEmployees) {
        selectedEmployees = [];
        document.querySelectorAll('#unregisteredEmployeesTable .employee-checkbox:checked').forEach(checkbox => {
            selectedEmployees.push({
                id: checkbox.getAttribute('data-id'),
                name: checkbox.getAttribute('data-name')
            });
        });
    }
    
    // Kiểm tra xem có nhân viên nào được chọn không
    if (selectedEmployees.length === 0) {
        showToastDanger('Vui lòng chọn ít nhất một nhân viên để phân công');
        return;
    }
    
    // Hiển thị danh sách nhân viên được chọn
    const selectedEmployeesContainer = document.getElementById('selected-employees');
    selectedEmployeesContainer.innerHTML = '';
    
    selectedEmployees.forEach(employee => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-primary me-2 mb-2';
        badge.innerHTML = `${employee.name} <i class="fas fa-check ms-1"></i>`;
        badge.setAttribute('data-id', employee.id);
        selectedEmployeesContainer.appendChild(badge);
    });
    
    // Cập nhật hiển thị ngày
    updateAssignModalDayDisplay();
    
    // Reset lựa chọn ca làm việc
    document.getElementById('shift-morning').checked = false;
    document.getElementById('shift-afternoon').checked = false;
    document.getElementById('assign-note').value = '';
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('assignShiftModal'));
    modal.show();
    
    // Gắn sự kiện cho dropdown chọn ngày
    document.getElementById('assign-day').addEventListener('change', updateAssignModalDayDisplay);
    
    // Gắn sự kiện cho nút xác nhận phân công
    document.getElementById('btn-confirm-assign').onclick = function() {
        confirmAssignShift(selectedEmployees);
    };
}

// Hàm cập nhật hiển thị ngày trong modal phân công
function updateAssignModalDayDisplay() {
    const daySelect = document.getElementById('assign-day');
    const selectedDay = daySelect.value;
    const { year, week } = parseWeekValue(currentAssignmentWeek);
    const weekDays = getWeekDays(year, week);
    
    // Map giá trị select vào index của mảng weekDays
    const dayIndexMap = {
        'monday': 0,
        'tuesday': 1,
        'wednesday': 2,
        'thursday': 3,
        'friday': 4,
        'saturday': 5,
        'sunday': 6
    };
    
    const selectedDate = weekDays[dayIndexMap[selectedDay]];
    document.getElementById('day-display').textContent = formatDateToVN(selectedDate);
}

// Hàm xác nhận phân công ca làm việc
async function confirmAssignShift(employees) {
    // Kiểm tra lựa chọn ca làm việc
    const morningShift = document.getElementById('shift-morning').checked;
    const afternoonShift = document.getElementById('shift-afternoon').checked;
    
    if (!morningShift && !afternoonShift) {
        showToastDanger('Vui lòng chọn ít nhất một ca làm việc');
        return;
    }
    
    // Lấy ngày được chọn
    const daySelect = document.getElementById('assign-day').value;
    const { year, week } = parseWeekValue(currentAssignmentWeek);
    const weekDays = getWeekDays(year, week);
    
    // Map giá trị select vào index của mảng weekDays
    const dayIndexMap = {
        'monday': 0,
        'tuesday': 1,
        'wednesday': 2,
        'thursday': 3,
        'friday': 4,
        'saturday': 5,
        'sunday': 6
    };
    
    const selectedDate = weekDays[dayIndexMap[daySelect]];
    const formattedDate = formatDateAPI(selectedDate);
    
    // Lấy ghi chú
    const note = document.getElementById('assign-note').value.trim();
    
    // Tạo danh sách ca cần phân công
    const shiftsToAssign = [];
    
    employees.forEach(employee => {
        if (morningShift) {
            shiftsToAssign.push({
                employeeId: employee.id,
                date: formattedDate,
                shiftType: 0, // Ca sáng
                week: week,
                note: note,
                status: 1 // Tự động duyệt
            });
        }
        
        if (afternoonShift) {
            shiftsToAssign.push({
                employeeId: employee.id,
                date: formattedDate,
                shiftType: 1, // Ca chiều
                week: week,
                note: note,
                status: 1 // Tự động duyệt
            });
        }
    });
    
    try {
        // Gửi yêu cầu phân công lên server
        const response = await fetch('/api/ca-lam-viec/assign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ shifts: shiftsToAssign })
        });
        
        const result = await response.json();
        
        // Đóng modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('assignShiftModal'));
        modal.hide();
        
        if (result.status) {
            showToastSuccess('Phân công ca làm việc thành công');
            
            // Cập nhật lại thống kê và lịch làm việc
            setTimeout(() => {
                updateAssignmentStats(currentAssignmentWeek);
                updateWeeklySchedule(currentAssignmentWeek);
                fetchUnregisteredEmployees(currentAssignmentWeek);
            }, 1000);
        } else {
            showToastDanger(result.error || 'Phân công ca làm việc thất bại');
        }
    } catch (error) {
        console.error('Error assigning shifts:', error);
        showToastDanger('Đã xảy ra lỗi khi phân công ca làm việc');
    }
}

// Các hàm tiện ích
function parseWeekValue(weekValue) {
    // Phân tích giá trị tuần (ví dụ: "2023-W01")
    const [year, weekPart] = weekValue.split('-');
    const week = parseInt(weekPart.substring(1));
    return { year: parseInt(year), week };
}

function getWeekDays(year, week) {
    // Tính ngày đầu tiên (thứ Hai) của tuần
    const firstDay = getFirstDayOfWeek(year, week);
    
    // Tạo mảng 7 ngày bắt đầu từ thứ Hai
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(firstDay);
        day.setDate(firstDay.getDate() + i);
        weekDays.push(day);
    }
    
    return weekDays;
}

function formatDateShort(date) {
    // Định dạng ngày: DD/MM
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
}

function formatDateAPI(date) {
    // Định dạng ngày cho API: YYYY-MM-DD
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}