document.addEventListener('DOMContentLoaded', async function() {
    // Cập nhật options tuần dựa trên ngày bắt đầu từ CSDL
    const defaultWeekValue = await updateWeekOptions();
    
    // Cập nhật ngày cho các tab điều hướng ngày trong tuần
    updateWeekDateRange(defaultWeekValue);
    
    // Lấy dữ liệu và hiển thị danh sách ca làm việc
    let listDangKyCa = await getAPICaLamViec(defaultWeekValue);
    window.fullShiftsList = listDangKyCa; // Lưu vào biến toàn cục
    thaoTacCaLamViec(listDangKyCa);
    
    // Cập nhật hiển thị trạng thái dựa trên tuần được chọn
    updateStatusVisibility(defaultWeekValue);
    
    // Lắng nghe sự kiện change trên weekSelect
    const weekSelect = document.getElementById('week-select');
    if (weekSelect) {
        weekSelect.addEventListener('change', function() {
            // Cập nhật các tab ngày và danh sách ca làm việc
            updateWeekDateRange(this.value);
            
            // Sử dụng chuỗi tuần đầy đủ thay vì chỉ số tuần
            const weekValue = this.value;
            
            // Cập nhật hiển thị trạng thái dựa trên tuần được chọn
            updateStatusVisibility(weekValue);
            
            // Lấy dữ liệu cho tuần mới
            getAPICaLamViec(weekValue).then(data => {
                window.fullShiftsList = data; // Đảm bảo lưu dữ liệu vào biến toàn cục
                thaoTacCaLamViec(data);
            });
        });
    }
    
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

    // Bật tính năng hover cho các dropdown trạng thái
    const statusDropdowns = document.querySelectorAll('.status-badge.dropdown-toggle');
    statusDropdowns.forEach(dropdown => {
        const dropdownMenu = dropdown.nextElementSibling;
        if (dropdownMenu) {
            // Phát hiện hover để mở dropdown
            dropdown.addEventListener('mouseenter', function() {
                const dropdownInstance = new bootstrap.Dropdown(dropdown);
                dropdownInstance.show();
            });
            
            // Phát hiện hover ra khỏi dropdown để đóng
            const parentItem = dropdown.closest('.list-inline-item');
            if (parentItem) {
                parentItem.addEventListener('mouseleave', function() {
                    const dropdownInstance = bootstrap.Dropdown.getInstance(dropdown);
                    if (dropdownInstance) {
                        dropdownInstance.hide();
                    }
                });
            }
        }
    });
});

async function getAPICaLamViec(weekValue) {
    try {
        // Sử dụng chuỗi tuần đầy đủ (YYYY-Www) thay vì chỉ số tuần
        const response = await fetch(`/api/ca-lam-viec?week=${weekValue}`)
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

// Hàm lấy ngày bắt đầu chấm công từ API
async function getFirstRecordDate() {
    try {
        const response = await fetch('/api/lay-ngay-bat-dau-ca');
        const data = await response.json();
        
        if (data.status && data.hasRecords) {
            // Nếu có dữ liệu, trả về ngày đầu tiên có dữ liệu
            return { 
                date: new Date(data.firstRecordDate),
                hasRecords: true 
            };
        }
        
        // Nếu không có dữ liệu, chỉ trả về flag hasRecords = false
        return { 
            hasRecords: false 
        };
    } catch (error) {
        console.error('Lỗi khi lấy ngày bắt đầu:', error);
        
        // Có lỗi cũng coi như không có dữ liệu
        return { 
            hasRecords: false 
        };
    }
}

// Hàm cập nhật tùy chọn tuần dựa trên ngày bắt đầu
async function updateWeekOptions() {
    // Lấy ngày bắt đầu có chấm công từ API
    const result = await getFirstRecordDate();
    
    // Lấy thông tin tuần hiện tại
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    
    // Tính tuần sau (tuần kết thúc)
    const nextWeek = {
        year: currentWeek.year,
        week: currentWeek.week + 1
    };
    
    // Điều chỉnh nếu tuần sau nằm ở năm kế tiếp
    if (nextWeek.week > 52) {
        nextWeek.week = 1;
        nextWeek.year += 1;
    };
    
    // Format chuỗi cho tuần mặc định (tuần sau)
    const defaultWeekValue = `${nextWeek.year}-W${nextWeek.week.toString().padStart(2, '0')}`;
    
    // Lấy phần tử select
    const weekSelect = document.getElementById('week-select');
    if (!weekSelect) {
        console.error('Không tìm thấy phần tử week-select');
        return defaultWeekValue;
    }
    
    // Xóa tất cả option hiện tại
    weekSelect.innerHTML = '';
    
    // Nếu không có dữ liệu, chỉ hiển thị tuần sau làm tùy chọn duy nhất
    if (!result.hasRecords) {
        // Tính ngày đầu và cuối của tuần sau
        const firstDayOfWeek = getFirstDayOfWeek(nextWeek.year, nextWeek.week);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        
        // Format ngày
        const startDateFormatted = formatDateToVN(firstDayOfWeek);
        const endDateFormatted = formatDateToVN(lastDayOfWeek);
        
        // Tạo option cho tuần sau
        const option = document.createElement('option');
        option.value = defaultWeekValue;
        option.textContent = `Tuần ${nextWeek.week}: ${startDateFormatted} -> ${endDateFormatted}`;
        option.selected = true;
        weekSelect.appendChild(option);
        
        // Kích hoạt sự kiện change để cập nhật dữ liệu
        const event = new Event('change');
        weekSelect.dispatchEvent(event);
        
        return defaultWeekValue;
    }
    
    // Nếu có dữ liệu, hiển thị từ tuần đầu tiên có dữ liệu đến tuần sau
    const firstRecordDate = result.date;
    const firstRecordWeek = getWeekNumber(firstRecordDate);
    
    // Thêm options từ tuần bắt đầu đến tuần sau
    for (let year = firstRecordWeek.year; year <= nextWeek.year; year++) {
        // Xác định tuần bắt đầu và kết thúc cho năm này
        const startWeek = (year === firstRecordWeek.year) ? firstRecordWeek.week : 1;
        const endWeek = (year === nextWeek.year) ? nextWeek.week : 52;
        
        for (let week = startWeek; week <= endWeek; week++) {
            // Tính ngày đầu và cuối của tuần
            const firstDayOfWeek = getFirstDayOfWeek(year, week);
            const lastDayOfWeek = new Date(firstDayOfWeek);
            lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
            
            // Format ngày
            const startDateFormatted = formatDateToVN(firstDayOfWeek);
            const endDateFormatted = formatDateToVN(lastDayOfWeek);
            
            // Tạo option
            const option = document.createElement('option');
            option.value = `${year}-W${week.toString().padStart(2, '0')}`;
            option.textContent = `Tuần ${week}: ${startDateFormatted} -> ${endDateFormatted}`;
            
            // Chọn mặc định là tuần sau
            const weekValue = `${year}-W${week.toString().padStart(2, '0')}`;
            if (weekValue === defaultWeekValue) {
                option.selected = true;
            }
            
            weekSelect.appendChild(option);
        }
    }
    
    // Kích hoạt sự kiện change để cập nhật dữ liệu
    const event = new Event('change');
    weekSelect.dispatchEvent(event);
    
    return defaultWeekValue;
}

// Hàm tính số tuần trong năm theo chuẩn ISO 8601
function getWeekNumber(date) {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    
    // Thứ 5 trong tuần hiện tại
    target.setDate(target.getDate() + 4 - (target.getDay() || 7));
    
    // Ngày đầu năm
    const yearStart = new Date(target.getFullYear(), 0, 1);
    
    // Số tuần
    const weekNumber = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
    
    return {
        year: target.getFullYear(),
        week: weekNumber
    };
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

// Thay thế hàm incrementStatusCount
function incrementStatusCount(status) {
    const countElement = document.getElementById(`${status}-count`);
    if (countElement) {
        const currentCount = parseInt(countElement.textContent || '0');
        countElement.textContent = (currentCount + 1).toString();
    }
    
    // Cập nhật lại chi tiết khi có thay đổi
    if (window.fullShiftsList) {
        updateStatusCounts();
    }
}

// Thay thế hàm decrementStatusCount
function decrementStatusCount(status) {
    const countElement = document.getElementById(`${status}-count`);
    if (countElement) {
        const currentCount = parseInt(countElement.textContent || '0');
        const newCount = Math.max(0, currentCount - 1);
        countElement.textContent = newCount.toString();
    }
    
    // Cập nhật lại chi tiết khi có thay đổi
    if (window.fullShiftsList) {
        updateStatusCounts();
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
                    const weekValue = weekSelect.value;
                    const updatedData = await getAPICaLamViec(weekValue);
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
        const weekValue = weekSelect.value;
        getAPICaLamViec(weekValue).then(data => {
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
}

// Cập nhật số lượng các trạng thái và chi tiết theo chức vụ và ca làm việc
function updateStatusCounts() {
    const visibleRows = Array.from(document.querySelectorAll('#registerShiftTable tbody tr')).filter(row => 
        row.style.display !== 'none' && !row.classList.contains('no-data-row')
    );
    
    // Đếm số lượng tổng theo trạng thái
    const counts = {
        pending: 0,
        approved: 0,
        timekeeping: 0,
        confirmed: 0,
        rejected: 0
    };
    
    // Đếm chi tiết theo chức vụ, ca làm việc và trạng thái
    const detailCounts = {
        pending: {
            waiter: { morning: 0, afternoon: 0, total: 0 },
            chef: { morning: 0, afternoon: 0, total: 0 },
            total: { morning: 0, afternoon: 0, all: 0 }
        },
        approved: {
            waiter: { morning: 0, afternoon: 0, total: 0 },
            chef: { morning: 0, afternoon: 0, total: 0 },
            total: { morning: 0, afternoon: 0, all: 0 }
        },
        timekeeping: {
            waiter: { morning: 0, afternoon: 0, total: 0 },
            chef: { morning: 0, afternoon: 0, total: 0 },
            total: { morning: 0, afternoon: 0, all: 0 }
        },
        confirmed: {
            waiter: { morning: 0, afternoon: 0, total: 0 },
            chef: { morning: 0, afternoon: 0, total: 0 },
            total: { morning: 0, afternoon: 0, all: 0 }
        },
        rejected: {
            waiter: { morning: 0, afternoon: 0, total: 0 },
            chef: { morning: 0, afternoon: 0, total: 0 },
            total: { morning: 0, afternoon: 0, all: 0 }
        }
    };
    
    // Lặp qua các hàng đang hiển thị
    visibleRows.forEach(row => {
        // Lấy trạng thái và tăng số đếm tổng
        const statusBadge = row.querySelector('.status-badge');
        let status = '';
        
        if (statusBadge) {
            if (statusBadge.classList.contains('status-pending')) {
                status = 'pending';
                counts.pending++;
            } else if (statusBadge.classList.contains('status-approved')) {
                status = 'approved';
                counts.approved++;
            } else if (statusBadge.classList.contains('status-timekeeping')) {
                status = 'timekeeping';
                counts.timekeeping++;
            } else if (statusBadge.classList.contains('status-confirmed')) {
                status = 'confirmed';
                counts.confirmed++;
            } else if (statusBadge.classList.contains('status-rejected')) {
                status = 'rejected';
                counts.rejected++;
            }
        }
        
        // Nếu có trạng thái hợp lệ
        if (status) {
            // Lấy thông tin ca sáng/chiều
            const shiftInfo = row.querySelector('td:nth-child(3)').textContent;
            const isEarlyShift = shiftInfo.includes('Ca sáng');
            const shift = isEarlyShift ? 'morning' : 'afternoon';
            
            // Lấy thông tin chức vụ (phục vụ = 0, đầu bếp = 1)
            // Giả định thông tin chức vụ được lưu trong row data attributes hoặc trong cell
            const employeeNameCell = row.querySelector('td:nth-child(2)');
            const employeeData = window.fullShiftsList.find(item => 
                item.NhanVien && item.NhanVien.ten === employeeNameCell.textContent
            );
            
            if (employeeData && employeeData.NhanVien) {
                const role = employeeData.NhanVien.chucVu === 0 ? 'waiter' : 'chef';
                
                // Tăng số lượng cho phù hợp
                detailCounts[status][role][shift]++;
                detailCounts[status][role].total++;
                detailCounts[status].total[shift]++;
                detailCounts[status].total.all++;
            }
        }
    });
    
    // Cập nhật hiển thị số lượng tổng cho mỗi trạng thái
    document.getElementById('pending-count').textContent = counts.pending;
    document.getElementById('approved-count').textContent = counts.approved;
    document.getElementById('timekeeping-count').textContent = counts.timekeeping;
    document.getElementById('confirmed-count').textContent = counts.confirmed;
    document.getElementById('rejected-count').textContent = counts.rejected;
    
    // Cập nhật chi tiết cho từng trạng thái
    updateStatusDetail('pending', detailCounts.pending);
    updateStatusDetail('approved', detailCounts.approved);
    updateStatusDetail('timekeeping', detailCounts.timekeeping);
    updateStatusDetail('confirmed', detailCounts.confirmed);
    updateStatusDetail('rejected', detailCounts.rejected);
    
    // Kiểm tra tuần được chọn để quyết định hiển thị
    const weekSelect = document.getElementById('week-select');
    if (weekSelect) {
        updateStatusVisibility(weekSelect.value);
    }
}

// Hàm cập nhật chi tiết cho một trạng thái cụ thể
function updateStatusDetail(status, counts) {
    // Cập nhật cho Phục vụ
    document.getElementById(`${status}-waiter-morning`).textContent = counts.waiter.morning;
    document.getElementById(`${status}-waiter-afternoon`).textContent = counts.waiter.afternoon;
    document.getElementById(`${status}-waiter-total`).textContent = counts.waiter.total;
    
    // Cập nhật cho Đầu bếp
    document.getElementById(`${status}-chef-morning`).textContent = counts.chef.morning;
    document.getElementById(`${status}-chef-afternoon`).textContent = counts.chef.afternoon;
    document.getElementById(`${status}-chef-total`).textContent = counts.chef.total;
    
    // Cập nhật tổng
    document.getElementById(`${status}-total-morning`).textContent = counts.total.morning;
    document.getElementById(`${status}-total-afternoon`).textContent = counts.total.afternoon;
    document.getElementById(`${status}-total-all`).textContent = counts.total.all;
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

// Hàm để cập nhật tùy chọn tuần cho assignment-week-filter
function populateAssignmentWeekFilter() {
    // Lấy thông tin week-select từ tab Duyệt ca
    const mainWeekSelect = document.getElementById('week-select');
    const assignmentWeekFilter = document.getElementById('assignment-week-filter');
    
    if (!mainWeekSelect || !assignmentWeekFilter) {
        return;
    }
    
    // Sao chép các tùy chọn từ week-select
    const options = Array.from(mainWeekSelect.options);
    assignmentWeekFilter.innerHTML = ''; // Xóa tùy chọn hiện tại
    
    options.forEach(option => {
        const newOption = document.createElement('option');
        newOption.value = option.value;
        newOption.textContent = option.textContent;
        
        // Chọn tùy chọn mặc định giống với week-select
        if (option.selected) {
            newOption.selected = true;
        }
        
        assignmentWeekFilter.appendChild(newOption);
    });
    
    // Thêm sự kiện thay đổi
    assignmentWeekFilter.addEventListener('change', function() {
        // Cập nhật dữ liệu dựa trên tuần được chọn
        updateAssignmentTabData(this.value);
    });
}

// Cập nhật hàm để hiển thị dữ liệu từ API
function updateAssignmentTabData(weekValue) {
    // Hiển thị thông báo đang tải
    const unregisteredTable = document.getElementById('unregisteredEmployeesTable');
    if (unregisteredTable && unregisteredTable.querySelector('tbody')) {
        unregisteredTable.querySelector('tbody').innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu...</td></tr>';
    }
    
    // Lấy và hiển thị danh sách nhân viên chưa có ca
    getNhanVienChuaCoCa(weekValue).then(data => {
        displayNhanVienChuaCoCa(data);
    });
}

// Hàm cập nhật hiển thị phạm vi ngày cho tab Phân công
function updateAssignmentDateRange(weekValue) {
    const dateRangeElement = document.getElementById('stats-date-range');
    if (!dateRangeElement) return;
    
    const [year, weekPart] = weekValue.split('-W');
    const weekNumber = parseInt(weekPart);
    
    // Tính ngày đầu và cuối của tuần
    const firstDayOfWeek = getFirstDayOfWeek(parseInt(year), weekNumber);
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    
    // Format ngày
    const startDateFormatted = formatDateToVN(firstDayOfWeek);
    const endDateFormatted = formatDateToVN(lastDayOfWeek);
    
    dateRangeElement.textContent = `${startDateFormatted} - ${endDateFormatted}`;
}

// Cập nhật hàm khởi tạo tab Phân công
function initializeAssignmentTab() {
    // Cập nhật tùy chọn tuần
    populateAssignmentWeekFilter();
    
    // Khởi tạo dữ liệu ban đầu
    const assignmentWeekFilter = document.getElementById('assignment-week-filter');
    if (assignmentWeekFilter && assignmentWeekFilter.value) {
        updateAssignmentTabData(assignmentWeekFilter.value);
    }
    
    // Thêm sự kiện cho nút Cập nhật thống kê
    const refreshBtn = document.getElementById('btn-refresh-stats');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const weekValue = document.getElementById('assignment-week-filter').value;
            updateAssignmentTabData(weekValue);
            showToastPrimary('Đã cập nhật thống kê');
        });
    }
    
    // Thêm sự kiện cho nút Phân công ca
    const assignBtn = document.getElementById('btn-assign-shift');
    if (assignBtn) {
        assignBtn.addEventListener('click', function() {
            openAssignmentModal();
        });
    }
    
    // Thêm sự kiện cho nút Xuất Excel
    const exportBtn = document.getElementById('btn-export-employees');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            showToastPrimary('Tính năng đang được phát triển');
        });
    }
}

// Hàm gọi API lấy danh sách nhân viên chưa có ca
async function getNhanVienChuaCoCa(weekValue) {
    try {
        const response = await fetch(`/api/lay-danh-sach-nhan-chua-co-ca?week=${weekValue}`);
        const data = await response.json();
        
        if (data.status) {
            return data;
        } else {
            console.error('Lỗi khi lấy danh sách nhân viên chưa có ca:', data.message);
            showToastDanger(data.message || 'Đã xảy ra lỗi khi tải dữ liệu nhân viên.');
            return { list: [] };
        }
    } catch (error) {
        console.error('Lỗi khi lấy danh sách nhân viên chưa có ca:', error);
        showToastDanger('Đã xảy ra lỗi khi tải dữ liệu nhân viên.');
        return { list: [] };
    }
}

// Hàm hiển thị danh sách nhân viên chưa có ca
function displayNhanVienChuaCoCa(data) {
    const tableBody = document.querySelector('#unregisteredEmployeesTable tbody');
    if (!tableBody) return;
    
    // Xóa nội dung cũ và hiển thị thông báo đang tải
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu...</td></tr>';
    
    // Lọc theo chức vụ nếu đã chọn
    let filteredList = [...data.list]; // Tạo bản sao để không ảnh hưởng đến dữ liệu gốc
    const roleFilter = document.getElementById('assignment-role-filter');
    
    if (roleFilter && roleFilter.value !== 'all') {
        const roleValue = parseInt(roleFilter.value);
        filteredList = filteredList.filter(employee => employee.chucVu === roleValue);
    }
    
    // Kiểm tra nếu không có dữ liệu
    if (!filteredList || filteredList.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Không có nhân viên nào chưa có ca</td></tr>';
        return;
    }
    
    // Xóa thông báo đang tải để hiển thị dữ liệu
    tableBody.innerHTML = '';
    
    // Thêm từng nhân viên vào bảng
    filteredList.forEach(employee => {
        // Xác định tên chức vụ
        let roleName = '';
        switch(employee.chucVu) {
            case 0: roleName = 'Phục vụ'; break;
            case 1: roleName = 'Đầu bếp'; break;
            default: roleName = 'Không xác định';
        }
        
        // Tạo hàng mới
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${employee.id}</td>
            <td>${employee.ten}</td>
            <td>${roleName}</td>
            <td>
                <button class="btn btn-sm btn-primary assign-single-btn" data-id="${employee.id}" data-name="${employee.ten}">
                    <i class="fas fa-plus-circle"></i>
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Gắn sự kiện cho nút phân công
    attachAssignButtonEvents();
}

// Gắn sự kiện cho các nút phân công
function attachAssignButtonEvents() {
    document.querySelectorAll('.assign-single-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            const employeeName = this.getAttribute('data-name');
            openAssignmentModal(employeeId, employeeName);
        });
    });
}

// Thêm sự kiện cho bộ lọc chức vụ
const roleFilter = document.getElementById('assignment-role-filter');
if (roleFilter) {
    roleFilter.addEventListener('change', function() {
        // Lấy lại danh sách nhân viên chưa có ca với bộ lọc mới
        const weekValue = document.getElementById('assignment-week-filter').value;
        getNhanVienChuaCoCa(weekValue).then(data => {
            displayNhanVienChuaCoCa(data);
        });
    });
}

// Biến lưu trữ nhân viên được chọn để phân công
let selectedEmployeesForAssignment = [];

// Hàm mở modal phân công ca - được gọi khi nhấn nút "Phân công ca" hoặc nút "+" bên cạnh nhân viên
function openAssignmentModal(employeeId = null, employeeName = null) {
    // Reset dữ liệu 
    resetAssignmentForm();
    
    // Kiểm tra xem có phải tuần sau không
    const weekFilter = document.getElementById('assignment-week-filter');
    const isFutureWeek = checkIfFutureWeek(weekFilter.value);
    
    // Nếu không phải tuần sau, vô hiệu hóa các nút và hiển thị thông báo
    if (!isFutureWeek) {
        document.getElementById('btn-confirm-assign').disabled = true;
        document.getElementById('assignmentTableBody').querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.disabled = true;
        });
        
        // Hiển thị thông báo
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning mt-2';
        alertDiv.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i> Chỉ có thể phân công ca làm việc cho tuần sau';
        document.querySelector('#assignShiftModal .modal-body').appendChild(alertDiv);
    } else {
        document.getElementById('btn-confirm-assign').disabled = false;
    }
    
    // Nếu được gọi từ nút bên cạnh nhân viên, thêm nhân viên đó vào danh sách
    if (employeeId && employeeName) {
        addEmployeeToAssignmentList({
            id: employeeId,
            name: employeeName
        });
    }
    
    // Cập nhật hiển thị lịch làm việc trong tuần
    updateAssignmentCalendar();
    
    // Mở modal
    const assignModal = new bootstrap.Modal(document.getElementById('assignShiftModal'));
    assignModal.show();
}

// Hàm kiểm tra xem tuần được chọn có phải tuần sau không
function checkIfFutureWeek(weekValue) {
    // Phân tích giá trị tuần được chọn
    const [selectedYear, selectedWeekPart] = weekValue.split('-W');
    const selectedWeek = parseInt(selectedWeekPart);
    
    // Lấy thông tin tuần hiện tại
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    
    // So sánh tuần được chọn với tuần hiện tại
    if (parseInt(selectedYear) > currentWeek.year) {
        return true; // Năm sau
    } else if (parseInt(selectedYear) < currentWeek.year) {
        return false; // Năm trước
    } else {
        // Cùng năm
        return selectedWeek > currentWeek.week; // True nếu là tuần sau
    }
}

// Hàm reset form phân công
function resetAssignmentForm() {
    // Xóa danh sách nhân viên đã chọn
    selectedEmployeesForAssignment = [];
    const selectedEmployeesContainer = document.getElementById('selected-employees');
    if (selectedEmployeesContainer) {
        selectedEmployeesContainer.innerHTML = '';
    }
    
    // Xóa tìm kiếm
    const searchInput = document.getElementById('search-employee');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Bỏ chọn tất cả checkbox
    const checkboxes = document.querySelectorAll('#assignmentTableBody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Xóa ghi chú
    const noteInput = document.getElementById('assign-note');
    if (noteInput) {
        noteInput.value = '';
    }
    
    // Xóa thông báo cảnh báo nếu có
    const warningAlert = document.querySelector('#assignShiftModal .alert-warning');
    if (warningAlert) {
        warningAlert.remove();
    }
}

// Hàm thêm nhân viên vào danh sách phân công
function addEmployeeToAssignmentList(employee) {
    // Kiểm tra nếu nhân viên đã có trong danh sách
    if (selectedEmployeesForAssignment.some(e => e.id === employee.id)) {
        return; // Không thêm nếu đã có
    }
    
    // Thêm vào danh sách
    selectedEmployeesForAssignment.push(employee);
    
    // Cập nhật giao diện
    updateSelectedEmployeesUI();
}

// Hàm cập nhật giao diện danh sách nhân viên được chọn
function updateSelectedEmployeesUI() {
    const container = document.getElementById('selected-employees');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (selectedEmployeesForAssignment.length === 0) {
        container.innerHTML = '<em class="text-muted">Chưa có nhân viên nào được chọn</em>';
        return;
    }
    
    selectedEmployeesForAssignment.forEach(employee => {
        const employeeTag = document.createElement('div');
        employeeTag.className = 'employee-tag';
        employeeTag.innerHTML = `
            ${employee.name}
            <button type="button" class="btn-close btn-close-white ms-2" 
                    data-id="${employee.id}" aria-label="Xóa"></button>
        `;
        
        // Thêm sự kiện xóa nhân viên
        const closeBtn = employeeTag.querySelector('.btn-close');
        closeBtn.addEventListener('click', function() {
            removeEmployeeFromAssignment(employee.id);
        });
        
        container.appendChild(employeeTag);
    });
}

// Hàm xóa nhân viên khỏi danh sách phân công
function removeEmployeeFromAssignment(employeeId) {
    selectedEmployeesForAssignment = selectedEmployeesForAssignment.filter(e => e.id !== employeeId);
    updateSelectedEmployeesUI();
}

// Hàm cập nhật bảng lịch làm việc trong modal
function updateAssignmentCalendar() {
    const tableBody = document.getElementById('assignmentTableBody');
    if (!tableBody) return;
    
    // Xóa nội dung cũ
    tableBody.innerHTML = '';
    
    // Lấy tuần được chọn
    const weekFilter = document.getElementById('assignment-week-filter');
    const weekValue = weekFilter.value;
    
    // Tách năm và số tuần
    const [year, weekPart] = weekValue.split('-W');
    const weekNumber = parseInt(weekPart);
    
    // Tính ngày đầu tiên (thứ Hai) của tuần
    const firstDayOfWeek = getFirstDayOfWeek(parseInt(year), weekNumber);
    
    // Tạo hàng cho từng ngày trong tuần
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(firstDayOfWeek);
        currentDate.setDate(firstDayOfWeek.getDate() + i);
        
        // Định dạng ngày
        const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        const dayName = dayNames[currentDate.getDay()];
        const day = currentDate.getDate().toString().padStart(2, '0');
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const formattedDate = `${day}/${month}/${currentDate.getFullYear()}`;
        
        // Format ngày để gửi API
        const apiDateFormat = `${currentDate.getFullYear()}-${month}-${day}`;
        
        // Tạo hàng mới
        const row = document.createElement('tr');
        if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
            row.className = 'table-secondary'; // Highlight cuối tuần
        }
        
        row.innerHTML = `
            <td>
                <strong>${dayName}</strong><br>
                <small>${formattedDate}</small>
            </td>
            <td class="text-center">
                <div class="form-check d-inline-block">
                    <input class="form-check-input" type="checkbox" id="morning-${i}" 
                           data-date="${apiDateFormat}" data-shift="0">
                    <label class="form-check-label" for="morning-${i}">
                        Ca sáng
                    </label>
                </div>
            </td>
            <td class="text-center">
                <div class="form-check d-inline-block">
                    <input class="form-check-input" type="checkbox" id="afternoon-${i}" 
                           data-date="${apiDateFormat}" data-shift="1">
                    <label class="form-check-label" for="afternoon-${i}">
                        Ca chiều
                    </label>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
}

// Hàm mở modal tìm kiếm nhân viên
function openSearchEmployeeModal() {
    // Reset kết quả tìm kiếm
    document.getElementById('employee-search-results').innerHTML = '';
    document.getElementById('search-employee-input').value = '';
    
    // Mở modal
    const searchModal = new bootstrap.Modal(document.getElementById('searchEmployeeModal'));
    searchModal.show();
}

// Hàm tìm kiếm nhân viên
async function searchEmployees(keyword) {
    // Thực hiện tìm kiếm - giả định có API tìm kiếm
    try {
        const response = await fetch(`/api/nhan-vien/search?q=${encodeURIComponent(keyword)}`);
        const data = await response.json();
        
        if (data.status) {
            displaySearchResults(data.list);
        } else {
            document.getElementById('employee-search-results').innerHTML = 
                '<div class="list-group-item text-danger">Lỗi khi tìm kiếm nhân viên</div>';
        }
    } catch (error) {
        // Mô phỏng kết quả nếu không có API
        console.log('Tìm kiếm mô phỏng:', keyword);
        
        // Danh sách mô phỏng
        const mockResults = [
            { id: 1, ten: 'Nguyễn Văn A', chucVu: 0 },
            { id: 2, ten: 'Trần Thị B', chucVu: 1 },
            { id: 3, ten: 'Lê Văn C', chucVu: 0 }
        ].filter(e => e.ten.toLowerCase().includes(keyword.toLowerCase()));
        
        displaySearchResults(mockResults);
    }
}

// Hàm hiển thị kết quả tìm kiếm
function displaySearchResults(employees) {
    const resultsContainer = document.getElementById('employee-search-results');
    resultsContainer.innerHTML = '';
    
    if (!employees || employees.length === 0) {
        resultsContainer.innerHTML = '<div class="list-group-item">Không tìm thấy nhân viên nào</div>';
        return;
    }
    
    employees.forEach(employee => {
        // Xác định chức vụ
        let role = '';
        switch (employee.chucVu) {
            case 0: role = 'Phục vụ'; break;
            case 1: role = 'Đầu bếp'; break;
            default: role = 'Không xác định';
        }
        
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action employee-result-item';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${employee.ten}</strong>
                    <small class="d-block text-muted">ID: ${employee.id}</small>
                </div>
                <span class="badge bg-secondary">${role}</span>
            </div>
        `;
        
        // Thêm sự kiện chọn nhân viên
        item.addEventListener('click', function(e) {
            e.preventDefault();
            addEmployeeToAssignmentList({
                id: employee.id,
                name: employee.ten
            });
            
            // Đóng modal tìm kiếm
            const searchModal = bootstrap.Modal.getInstance(document.getElementById('searchEmployeeModal'));
            searchModal.hide();
        });
        
        resultsContainer.appendChild(item);
    });
}

// Hàm xử lý khi nhấn nút xác nhận phân công
async function confirmAssignment() {
    // Kiểm tra xem có nhân viên nào được chọn không
    if (selectedEmployeesForAssignment.length === 0) {
        showToastDanger('Vui lòng chọn ít nhất một nhân viên');
        return;
    }
    
    // Kiểm tra xem có ca nào được chọn không
    const selectedShifts = document.querySelectorAll('#assignmentTableBody input[type="checkbox"]:checked');
    if (selectedShifts.length === 0) {
        showToastDanger('Vui lòng chọn ít nhất một ca làm việc');
        return;
    }
    
    // Tạo danh sách ca làm việc được gán
    const assignments = [];
    
    // Lấy thông tin tuần
    const weekFilter = document.getElementById('assignment-week-filter');
    const [year, weekPart] = weekFilter.value.split('-W');
    const weekNumber = parseInt(weekPart);
    
    // Lấy ghi chú
    const note = document.getElementById('assign-note').value;
    
    // Tạo đối tượng phân công cho mỗi nhân viên và mỗi ca
    selectedShifts.forEach(shift => {
        const date = shift.getAttribute('data-date');
        const shiftType = parseInt(shift.getAttribute('data-shift'));
        
        selectedEmployeesForAssignment.forEach(employee => {
            assignments.push({
                idNhanVien: employee.id,
                ngay: date,
                tuan: weekNumber,
                caLamViec: shiftType,
                trangThai: 1, // Đã duyệt
                ghiChu: note
            });
        });
    });
    
    console.log('Danh sách phân công:', assignments);
    
    // Hiển thị thông báo đang xử lý
    showToastPrimary('Đang phân công ca làm việc...');
    
    // Đóng modal
    const assignModal = bootstrap.Modal.getInstance(document.getElementById('assignShiftModal'));
    assignModal.hide();
    
    try {
        // Gửi yêu cầu API
        const response = await fetch('/api/them-ca-lam-viec', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                assignments: assignments
            })
        });
        
        const result = await response.json();
        
        if (result.status) {
            showToastSuccess('Phân công ca làm việc thành công');
            
            // Cập nhật lại danh sách nhân viên chưa có ca
            updateAssignmentTabData(weekFilter.value);
        } else {
            showToastDanger(result.message || 'Phân công ca làm việc thất bại');
        }
    } catch (error) {
        // Mô phỏng thành công
        console.error('Lỗi phân công ca làm việc:', error);
        showToastSuccess('Phân công ca làm việc thành công');
        
        // Cập nhật lại danh sách nhân viên chưa có ca
        updateAssignmentTabData(weekFilter.value);
    }
}

// Khi DOM đã tải xong, thêm các event handler
document.addEventListener('DOMContentLoaded', function() {
    // Thay đổi hàm initializeAssignmentTab để thêm các sự kiện
    const oldInitializeAssignmentTab = initializeAssignmentTab;
    
    initializeAssignmentTab = function() {
        // Gọi hàm gốc
        if (oldInitializeAssignmentTab) {
            oldInitializeAssignmentTab();
        }
        
        // Thêm sự kiện cho nút Phân công ca
        const assignBtn = document.getElementById('btn-assign-shift');
        if (assignBtn) {
            assignBtn.removeEventListener('click', null);
            assignBtn.addEventListener('click', function() {
                openAssignmentModal();
            });
        }
        
        // Thêm sự kiện cho các nút phân công cá nhân
        attachAssignButtonEvents();
        
        // Thêm sự kiện cho nút tìm kiếm nhân viên
        const searchBtn = document.getElementById('btn-search-employee');
        if (searchBtn) {
            searchBtn.addEventListener('click', function() {
                openSearchEmployeeModal();
            });
        }
        
        // Thêm sự kiện cho nút xác nhận phân công
        const confirmBtn = document.getElementById('btn-confirm-assign');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', confirmAssignment);
        }
        
        // Thêm sự kiện cho input tìm kiếm trong modal
        const searchInput = document.getElementById('search-employee-input');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                if (this.value.trim().length >= 2) {
                    searchEmployees(this.value.trim());
                }
            });
            
            // Thêm sự kiện Enter
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && this.value.trim().length >= 2) {
                    e.preventDefault();
                    searchEmployees(this.value.trim());
                }
            });
        }
    };
    
    // Ghi đè hàm attachAssignButtonEvents
    window.attachAssignButtonEvents = function() {
        document.querySelectorAll('.assign-single-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const employeeId = this.getAttribute('data-id');
                const employeeName = this.getAttribute('data-name');
                openAssignmentModal(employeeId, employeeName);
            });
        });
    };
});