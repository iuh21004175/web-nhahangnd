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

    let listHeSoLuong = await getAPIHeSoLuong(); 
    thaoTacHeSoLuong(listHeSoLuong);
    
    document.getElementById('rest-day-form').addEventListener('submit', themHeSoLuong);

    const editHeSoModal = document.getElementById('editHeSoModal');
    editHeSoModal.addEventListener('submit', async function(e) {
        e.preventDefault();
        // // Xử lý cập nhật danh mục ở đây
        const heSo = this.querySelector('#edit-he-so').value;
        const id = this.querySelector('#heSoId').value;
        const ghiChu = this.querySelector('#edit-ghi-chu').value;
        try {
            const res = await fetch('/api/he-so-luong', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, heSo, ghiChu })
            })
            const data = await res.json();
            if(data.status){
                // Cập nhật thành công
                const index =listHeSoLuong.findIndex(item => item.id == id);
                listHeSoLuong[index] = data.obj;
                thaoTacHeSoLuong(listHeSoLuong);
                alert("Cập nhật thành công!");
            }
            else{
                //showToastDanger(data.error);
                console.error('Lỗi server:', data.error);
            }
        } catch (error) {
            showToastDanger();
            console.error('Error:', error);
        }
        // Đóng modal sau khi cập nhật
        bootstrap.Modal.getInstance(document.getElementById('editHeSoModal')).hide();
    });
    
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

    // Thêm đoạn code này vào phần khởi tạo (trong DOMContentLoaded)
    document.getElementById('assignShiftModal').addEventListener('hidden.bs.modal', function() {
        // Xóa backdrop nếu còn
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Xóa class modal-open trên body
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        
        // Đảm bảo input tìm kiếm không bị disabled
        const searchInput = document.getElementById('search-employee');
        if (searchInput) {
            searchInput.disabled = false;
            searchInput.value = '';
        }
        
        // Reset form
        resetAssignmentForm();
    });

    // Thêm sự kiện cho input tìm kiếm
    const searchInput = document.getElementById('search-employee');
    const searchDropdown = document.getElementById('employee-search-dropdown');
    
    if (searchInput && searchDropdown) {
        // Biến lưu trữ timeout cho debounce
        let searchTimeout;
        
        // Sự kiện input
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim();
            
            // Xóa timeout hiện tại nếu có
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Ẩn dropdown nếu không có từ khóa
            if (keyword.length < 2) {
                searchDropdown.style.display = 'none';
                return;
            }
            
            // Đặt timeout để tránh tìm kiếm quá nhiều
            searchTimeout = setTimeout(() => {
                // Tìm kiếm nhân viên
                const results = searchEmployeesInList(keyword);
                
                // Hiển thị kết quả
                displaySearchResults(results);
            }, 300);
        });
        
        // Sự kiện focus vào input
        searchInput.addEventListener('focus', function() {
            const keyword = this.value.trim();
            
            if (keyword.length >= 2) {
                // Tìm kiếm và hiển thị kết quả
                const results = searchEmployeesInList(keyword);
                displaySearchResults(results);
            }
        });
        
        // Sự kiện click ngoài dropdown để ẩn
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.style.display = 'none';
            }
        });
    }

    // Thêm đoạn này vào phần khởi tạo (khi DOM đã tải xong)
    const removeSelectedBtn = document.getElementById('remove-selected-employee');
    if (removeSelectedBtn) {
        removeSelectedBtn.addEventListener('click', function() {
            // Xóa nhân viên khỏi danh sách đã chọn
            const selectedEmployeeName = document.getElementById('selected-employee-name');
            const name = selectedEmployeeName.textContent;
            const employee = selectedEmployeesForAssignment.find(e => e.name === name);
            
            if (employee) {
                removeEmployeeFromAssignment(employee.id);
            }
            
            // Đặt lại các trường thông tin nhân viên
            selectedEmployeeName.textContent = 'Chưa có nhân viên được chọn';
            document.getElementById('selected-employee-id').textContent = 'Mã: --';
            document.getElementById('selected-employee-role').textContent = '--';
            document.getElementById('selected-employee-role').className = 'badge bg-secondary';
            
            // Ẩn nút xóa
            removeSelectedBtn.style.display = 'none';
            
            // Kích hoạt lại ô tìm kiếm
            const searchInput = document.getElementById('search-employee');
            if (searchInput) {
                searchInput.value = '';
                searchInput.disabled = false;
                searchInput.focus();
            }
        });
    }
});
function thaoTacHeSoLuong(danhSach) {
    const tbody = document.querySelector('#salary-table tbody');
    tbody.innerHTML = ''; // Xóa dữ liệu cũ (nếu có)

    if (danhSach.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5">Chưa có hệ số lương nào.</td></tr>`; // Cập nhật lại số cột là 5 (thêm cột Sửa)
        return;
    }

    danhSach.forEach((item, index) => {
        const row = document.createElement('tr');

        const ngay = new Date(item.ngay).toLocaleDateString('vi-VN');
        const heSo = item.heSo;
        const ghiChu = item.ghiChu || '';

        row.innerHTML = `
            <td>${index + 1}</td> <!-- Thêm chỉ số cho hàng -->
            <td>${ngay}</td>
            <td>${heSo}</td>
            <td>${ghiChu}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-edit" 
                    data-bs-toggle="modal" 
                    data-bs-target="#editHeSoModal" 
                    data-bs-tooltip="tooltip"
                    title="Chỉnh sửa"
                    data-id="${item.id}"
                    data-ngay="${item.ngay}"
                    data-he-so="${item.heSo}"
                    data-ghi-chu="${item.ghiChu}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Khởi tạo tất cả tooltips
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });

    // Gắn sự kiện cho các nút "Chỉnh sửa"
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const ngay = this.dataset.ngay;
            const heSo = this.dataset.heSo;
            const ghiChu = this.dataset.ghiChu;

            // Lấy modal chỉnh sửa
           // const modal = new bootstrap.Modal(document.getElementById('editHeSoModal'));

            // Cập nhật thông tin vào các trường trong modal
            document.querySelector('#edit-he-so').value = heSo;
            document.querySelector('#edit-ghi-chu').value = ghiChu;
            document.querySelector('#edit-ngay-hidden').value = ngay;
            document.querySelector('#heSoId').value = id;
            

            // Mở modal
           // modal.show();
           bootstrap.Modal.getInstance(document.getElementById('editHeSoModal')).show();
        });
    });
}



async function getAPIHeSoLuong() {
    const response = await fetch('/api/he-so-luong');
    try {
        const data = await response.json();
        if (data.status) {
            return data.data; 
        } else {
            console.error('Lỗi server:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return [];
    }
}

async function themHeSoLuong(e) {
    e.preventDefault();

    const ngay = document.getElementById('rest-date').value;
    const heSo= document.getElementById('salary-factor').value;
    const ghiChu = document.getElementById('note').value;

    try {
        const res = await fetch('/api/them-he-so-luong', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ngay, heSo, ghiChu })
        });

        const data = await res.json();

        if (data.status) {
            alert(data.message); // Thông báo thành công
            document.getElementById('rest-day-form').reset();

            const listHeSoLuong = await getAPIHeSoLuong();
            thaoTacHeSoLuong(listHeSoLuong);
        } else {
            alert(data.message); // Lỗi nghiệp vụ
        }

    } catch (err) {
        console.error('Lỗi gọi API:', err);
        alert('Đã xảy ra lỗi khi lưu hệ số lương.');
    }
}

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
            
            // Reset form trước khi mở modal
            resetAssignmentForm();
            
            // Mở modal với ID và tên nhân viên
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

// Hàm thêm nhân viên vào danh sách phân công
function addEmployeeToAssignmentList(employee) {
    // Kiểm tra nếu nhân viên đã có trong danh sách
    if (selectedEmployeesForAssignment.some(e => e.id === employee.id)) {
        return; // Không thêm nếu đã có
    }
    
    // Chuẩn hóa dữ liệu nhân viên
    const employeeData = {
        id: employee.id,
        name: employee.name || employee.ten,
        ten: employee.ten || employee.name,
        role: employee.role !== undefined ? employee.role : employee.chucVu,
        chucVu: employee.chucVu !== undefined ? employee.chucVu : employee.role,
        avatarUrl: employee.avatarUrl || employee.hinhAnh
    };
    
    // Thêm vào danh sách
    selectedEmployeesForAssignment.push(employeeData);
    
    // Cập nhật giao diện
    updateSelectedEmployeesUI();
}

// Hàm mở modal phân công ca - được gọi khi nhấn nút "Phân công ca" hoặc nút "+" bên cạnh nhân viên
function openAssignmentModal(employeeId = null, employeeName = null) {
    // Reset dữ liệu 
    resetAssignmentForm();
    
    // Tải danh sách nhân viên
    loadAllEmployees();
    
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
    
    // Nếu được gọi từ nút bên cạnh nhân viên, hiển thị thông tin nhân viên đó
    if (employeeId && employeeName) {
        // Tìm thông tin nhân viên trong danh sách đã tải
        getEmployeeDetails(employeeId).then(employee => {
            if (employee) {
                // Hiển thị thông tin nhân viên trong phần selected-employee-info
                displaySelectedEmployee(employee);
                
                // Lưu nhân viên vào danh sách đã chọn
                addEmployeeToAssignmentList(employee);
                
                // Vô hiệu hóa input tìm kiếm vì đã có nhân viên được chọn
                const searchInput = document.getElementById('search-employee');
                if (searchInput) {
                    searchInput.value = employee.ten || employee.name;
                    searchInput.disabled = true;
                }
                
                // Đánh dấu ca làm việc của nhân viên này
                markExistingShifts(employeeId);
            }
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

// Sửa lại hàm resetAssignmentForm để xóa các nhãn trạng thái nếu có
function resetAssignmentForm() {
    // Xóa danh sách nhân viên đã chọn
    selectedEmployeesForAssignment = [];
    
    // Reset và kích hoạt lại ô tìm kiếm
    const searchInput = document.getElementById('search-employee');
    if (searchInput) {
        searchInput.value = '';
        searchInput.disabled = false; // Đảm bảo input luôn được enable
    }
    
    // Reset avatar về icon mặc định
    const avatarImg = document.getElementById('selected-employee-avatar');
    const defaultAvatar = document.querySelector('#selected-employee-info .default-avatar');
    
    if (avatarImg) {
        avatarImg.src = '';
        avatarImg.classList.add('d-none');
    }
    
    if (defaultAvatar) {
        defaultAvatar.classList.remove('d-none');
    }
    
    // Xóa danh sách nhân viên đã chọn trong container
    const selectedEmployeesContainer = document.getElementById('selected-employees');
    if (selectedEmployeesContainer) {
        selectedEmployeesContainer.innerHTML = '';
    }
    
    // Bỏ chọn tất cả checkbox và đảm bảo không bị disabled
    const checkboxes = document.querySelectorAll('#assignmentTableBody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
        checkbox.disabled = false; // Đảm bảo không bị disabled
    });
    
    // Xóa tất cả nhãn trạng thái đã thêm (nếu có)
    const statusLabels = document.querySelectorAll('#assignmentTableBody .badge');
    statusLabels.forEach(label => {
        label.remove();
    });
    
    // Bỏ chọn thông tin nhân viên
    const selectedEmployeeName = document.getElementById('selected-employee-name');
    const selectedEmployeeId = document.getElementById('selected-employee-id');
    const selectedEmployeeRole = document.getElementById('selected-employee-role');
    const removeSelectedBtn = document.getElementById('remove-selected-employee');
    
    if (selectedEmployeeName) {
        selectedEmployeeName.textContent = 'Chưa có nhân viên được chọn';
    }
    
    if (selectedEmployeeId) {
        selectedEmployeeId.textContent = 'Mã: --';
    }
    
    if (selectedEmployeeRole) {
        selectedEmployeeRole.textContent = '--';
        selectedEmployeeRole.className = 'badge bg-secondary';
    }
    
    if (removeSelectedBtn) {
        removeSelectedBtn.style.display = 'none';
    }
    
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

// Hàm hiển thị thông tin nhân viên được chọn
function displaySelectedEmployee(employee) {
    const selectedEmployeeInfo = document.getElementById('selected-employee-info');
    const selectedEmployeeName = document.getElementById('selected-employee-name');
    const selectedEmployeeId = document.getElementById('selected-employee-id');
    const selectedEmployeeRole = document.getElementById('selected-employee-role');
    const removeSelectedBtn = document.getElementById('remove-selected-employee');
    const avatarImg = document.getElementById('selected-employee-avatar');
    
    if (selectedEmployeeInfo && selectedEmployeeName && selectedEmployeeId && selectedEmployeeRole) {
        // Hiển thị khối thông tin nhân viên
        selectedEmployeeInfo.style.display = 'block';
        
        // Hiển thị tên nhân viên
        selectedEmployeeName.textContent = employee.name || employee.ten;
        
        // Hiển thị mã nhân viên
        selectedEmployeeId.textContent = `Mã: ${employee.id}`;
        
        // Hiển thị chức vụ nhân viên
        let roleName = 'Không xác định';
        let roleClass = 'bg-secondary';
        
        const roleValue = employee.role !== undefined ? employee.role : employee.chucVu;
        
        switch (parseInt(roleValue)) {
            case 0:
                roleName = 'Phục vụ';
                roleClass = 'bg-primary';
                break;
            case 1:
                roleName = 'Đầu bếp';
                roleClass = 'bg-success';
                break;
        }
        
        selectedEmployeeRole.textContent = roleName;
        selectedEmployeeRole.className = `badge ${roleClass}`;
        
        // Hiển thị avatar nếu có
        if (avatarImg) {
            const avatarSrc = employee.avatarUrl || employee.hinhAnh;
            
            if (avatarSrc) {
                avatarImg.src = avatarSrc;
                avatarImg.classList.remove('d-none');
                
                // Ẩn icon mặc định
                const defaultAvatar = selectedEmployeeInfo.querySelector('.default-avatar');
                if (defaultAvatar) defaultAvatar.classList.add('d-none');
            } else {
                // Không có avatar, hiển thị icon mặc định
                avatarImg.classList.add('d-none');
                
                const defaultAvatar = selectedEmployeeInfo.querySelector('.default-avatar');
                if (defaultAvatar) defaultAvatar.classList.remove('d-none');
            }
        }
        
        // Hiển thị nút xóa
        if (removeSelectedBtn) {
            removeSelectedBtn.style.display = 'block';
        }
    }
}

// Hàm thêm nhân viên vào danh sách phân công
function addEmployeeToAssignmentList(employee) {
    // Kiểm tra nếu nhân viên đã có trong danh sách
    if (selectedEmployeesForAssignment.some(e => e.id === employee.id)) {
        return; // Không thêm nếu đã có
    }
    
    // Chuẩn hóa dữ liệu nhân viên
    const employeeData = {
        id: employee.id,
        name: employee.name || employee.ten,
        ten: employee.ten || employee.name,
        role: employee.role !== undefined ? employee.role : employee.chucVu,
        chucVu: employee.chucVu !== undefined ? employee.chucVu : employee.role,
        avatarUrl: employee.avatarUrl || employee.hinhAnh
    };
    
    // Thêm vào danh sách
    selectedEmployeesForAssignment.push(employeeData);
    
    // Cập nhật giao diện
    updateSelectedEmployeesUI();
}

// Hàm cập nhật bảng lịch làm việc trong modal
function updateAssignmentCalendar() {
    // Xóa nội dung cũ
    const tableBody = document.getElementById('assignmentTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    
    // Lấy tuần được chọn
    const weekFilter = document.getElementById('assignment-week-filter');
    const weekValue = weekFilter.value;
    
    // Tách năm và số tuần
    const [year, weekPart] = weekValue.split('-W');
    const weekNumber = parseInt(weekPart);
    
    // Tính ngày đầu tiên (thứ Hai) của tuần
    const firstDayOfWeek = getFirstDayOfWeek(parseInt(year), weekNumber);
    
    // Tạo mảng các ngày trong tuần
    const weekDays = [];
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
        
        weekDays.push({
            date: currentDate,
            dayName: dayName,
            formattedDate: formattedDate,
            apiDateFormat: apiDateFormat,
            isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6
        });
    }
    
    // Tạo hàng cho ca sáng
    const morningRow = document.createElement('tr');
    morningRow.innerHTML = '<th>Ca sáng<br><small>(06:00 - 14:00)</small></th>';
    
    // Tạo hàng cho ca chiều
    const afternoonRow = document.createElement('tr');
    afternoonRow.innerHTML = '<th>Ca chiều<br><small>(14:00 - 22:00)</small></th>';
    
    // Thêm checkbox cho từng ngày
    weekDays.forEach((day, index) => {
        // Tạo ô cho ca sáng
        const morningCell = document.createElement('td');
        if (day.isWeekend) {
            morningCell.className = 'table-secondary';
        }
        
        morningCell.innerHTML = `
            <div class="form-check d-flex justify-content-center">
                <input class="form-check-input" type="checkbox" 
                       id="morning-${index}" 
                       data-date="${day.apiDateFormat}" 
                       data-shift="0">
            </div>
        `;
        
        // Tạo ô cho ca chiều
        const afternoonCell = document.createElement('td');
        if (day.isWeekend) {
            afternoonCell.className = 'table-secondary';
        }
        
        afternoonCell.innerHTML = `
            <div class="form-check d-flex justify-content-center">
                <input class="form-check-input" type="checkbox" 
                       id="afternoon-${index}" 
                       data-date="${day.apiDateFormat}" 
                       data-shift="1">
            </div>
        `;
        
        // Thêm các ô vào hàng tương ứng
        morningRow.appendChild(morningCell);
        afternoonRow.appendChild(afternoonCell);
    });
    
    // Thêm các hàng vào bảng
    tableBody.appendChild(morningRow);
    tableBody.appendChild(afternoonRow);
    
    // Tạo header cho bảng (các ngày trong tuần)
    const tableHeader = document.querySelector('#assignShiftModal table thead tr');
    if (tableHeader) {
        // Xóa header cũ trừ cột đầu tiên (Ca làm việc)
        while (tableHeader.children.length > 1) {
            tableHeader.removeChild(tableHeader.lastChild);
        }
        
        // Thêm header mới cho từng ngày
        weekDays.forEach(day => {
            const th = document.createElement('th');
            if (day.isWeekend) {
                th.className = 'table-secondary';
            }
            th.innerHTML = `${day.dayName}<br><small>${day.formattedDate}</small>`;
            tableHeader.appendChild(th);
        });
    }
    
    // Sau khi tạo xong bảng, cần kiểm tra và đánh dấu các ca đã đăng ký cho tất cả nhân viên được chọn
    if (selectedEmployeesForAssignment.length > 0) {
        // Đánh dấu ca làm việc cho nhân viên được chọn
        selectedEmployeesForAssignment.forEach(employee => {
            markExistingShifts(employee.id);
        });
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
    const searchDropdown = document.getElementById('employee-search-dropdown');
    
    if (!employees || employees.length === 0) {
        searchDropdown.innerHTML = '<div class="p-2 text-muted small">Không tìm thấy nhân viên phù hợp</div>';
        return;
    }
    
    let resultsHTML = '';
    
    employees.forEach(employee => {
        // Xác định chức vụ
        let roleName = '';
        let roleClass = '';
        
        switch (employee.chucVu) {
            case 0: 
                roleName = 'Phục vụ'; 
                roleClass = 'bg-primary';
                break;
            case 1: 
                roleName = 'Đầu bếp'; 
                roleClass = 'bg-success';
                break;
            default: 
                roleName = 'Không xác định';
                roleClass = 'bg-secondary';
        }
        
        // Kiểm tra có avatar không
        const avatarHtml = employee.hinhAnh 
            ? `<img src="${employee.hinhAnh}" class="dropdown-avatar rounded-circle me-2" width="32" height="32" alt="${employee.ten}">`
            : `<i class="fas fa-user-circle text-secondary me-2"></i>`;
        
        // Kiểm tra xem nhân viên đã được chọn chưa
        const isSelected = selectedEmployeesForAssignment.some(e => e.id === employee.id);
        
        resultsHTML += `
            <div class="dropdown-item ${isSelected ? 'disabled bg-light' : ''}" 
                 data-id="${employee.id}" 
                 data-name="${employee.ten}" 
                 data-role="${employee.chucVu}"
                 data-avatar="${employee.hinhAnh || ''}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${avatarHtml}
                        <div>
                            <div class="fw-bold">${employee.ten}</div>
                            <div class="small text-muted">Mã: ${employee.id}</div>
                        </div>
                    </div>
                    <span class="badge ${roleClass} text-white">${roleName}</span>
                </div>
                ${isSelected ? '<small class="text-success"><i class="fas fa-check me-1"></i>Đã chọn</small>' : ''}
            </div>
        `;
    });
    
    searchDropdown.innerHTML = resultsHTML;
    searchDropdown.style.display = 'block';
    
    // Thêm sự kiện click cho các kết quả tìm kiếm
    document.querySelectorAll('#employee-search-dropdown .dropdown-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            const employeeName = this.getAttribute('data-name');
            const employeeRole = parseInt(this.getAttribute('data-role'));
            const avatarUrl = this.getAttribute('data-avatar');
            
            // Thêm nhân viên vào danh sách đã chọn
            selectEmployee({
                id: employeeId,
                name: employeeName,
                role: employeeRole,
                avatarUrl: avatarUrl && avatarUrl !== 'null' ? avatarUrl : null
            });
            
            // Ẩn dropdown sau khi chọn
            searchDropdown.style.display = 'none';
        });
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
    
    // Lấy thông tin tuần
    const weekFilter = document.getElementById('assignment-week-filter');
    console.log('Tuần được chọn:', weekFilter.value);
    // Hiển thị thông báo đang xử lý
    showToastPrimary('Đang phân công ca làm việc...');
    
    try {
        // Xử lý cho từng nhân viên
        for (const employee of selectedEmployeesForAssignment) {
            // Tạo danh sách ca làm việc cho nhân viên hiện tại
            const shifts = [];
            
            // Lặp qua tất cả ca đã chọn
            selectedShifts.forEach(shift => {
                const date = shift.getAttribute('data-date');
                const shiftType = parseInt(shift.getAttribute('data-shift'));
                
                // Thêm ca làm việc vào danh sách
                shifts.push({
                    ngay: date,
                    caLamViec: shiftType,
                });
            });
            
            // Gửi yêu cầu API cho nhân viên hiện tại
            const response = await fetch('/api/them-lich-lam-viec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idNhanVien: employee.id, // Thêm ID nhân viên vào request
                    week: weekFilter.value, // Thêm thông tin tuần
                    shifts: shifts // Danh sách ca làm việc
                })
            });
            
            const result = await response.json();
            
            if (!result.status) {
                // Nếu có lỗi với nhân viên nào đó, hiển thị thông báo
                showToastDanger(`Lỗi khi phân công cho nhân viên ${employee.name}: ${result.error || 'Lỗi không xác định'}`);
                console.error('Lỗi phân công:', result);
                // Tiếp tục với nhân viên tiếp theo
            }
        }
        
        // Đóng modal sau khi gửi tất cả yêu cầu
        const modalElement = document.getElementById('assignShiftModal');
        const assignModal = bootstrap.Modal.getInstance(modalElement);
        if (assignModal) {
            assignModal.hide();
        }
        
        // Dọn dẹp backdrop modal (nếu còn)
        cleanupModalBackdrop();
        
        // Hiển thị thông báo thành công sau khi hoàn thành tất cả yêu cầu
        showToastSuccess('Phân công ca làm việc thành công');
        
        // Cập nhật lại danh sách nhân viên chưa có ca
        updateAssignmentTabData(weekFilter.value);
        
    } catch (error) {
        console.error('Lỗi khi phân công ca làm việc:', error);
        showToastDanger('Đã xảy ra lỗi khi phân công ca làm việc');
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

// Thêm hàm này
function cleanupModalBackdrop() {
    setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
    }, 300); // Đợi modal animate xong
}

// Biến lưu trữ danh sách nhân viên
let allEmployees = [];

// Hàm tải danh sách nhân viên khi mở modal
async function loadAllEmployees() {
    if (allEmployees.length > 0) return; // Nếu đã tải rồi thì không tải lại
    
    try {
        const response = await fetch('/api/nhan-vien');
        const data = await response.json();
        
        if (data.status) {
            // Thêm xử lý và kiểm tra thông tin avatar
            allEmployees = (data.list || []).map(employee => {
                // Nếu API trả về đường dẫn avatar, sử dụng nó
                // Nếu không, để avatarUrl là undefined
                if (employee.hinhAnh) {
                    employee.hinhAnh = employee.hinhAnh;
                }
                return employee;
            });
            console.log('Đã tải danh sách nhân viên:', allEmployees.length);
        } else {
            console.error('Lỗi khi tải danh sách nhân viên:', data.message);
            showToastDanger('Không thể tải danh sách nhân viên');
        }
    } catch (error) {
        console.error('Lỗi khi gọi API nhân viên:', error);
        showToastDanger('Đã xảy ra lỗi khi tải danh sách nhân viên');
    }
}

// Hàm tìm kiếm nhân viên dựa trên từ khóa
function searchEmployeesInList(keyword) {
    if (!keyword || keyword.length < 2) return [];
    
    const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return allEmployees.filter(employee => {
        // Chuẩn hóa tên nhân viên để dễ tìm kiếm (bỏ dấu, chuyển thành chữ thường)
        const normalizedName = employee.ten.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalizedName.includes(normalizedKeyword);
    });
}

// Hàm hiển thị danh sách nhân viên tìm được
function displaySearchResults(employees) {
    const searchDropdown = document.getElementById('employee-search-dropdown');
    
    if (!employees || employees.length === 0) {
        searchDropdown.innerHTML = '<div class="p-2 text-muted small">Không tìm thấy nhân viên phù hợp</div>';
        return;
    }
    
    let resultsHTML = '';
    
    employees.forEach(employee => {
        // Xác định chức vụ
        let roleName = '';
        let roleClass = '';
        
        switch (employee.chucVu) {
            case 0: 
                roleName = 'Phục vụ'; 
                roleClass = 'bg-primary';
                break;
            case 1: 
                roleName = 'Đầu bếp'; 
                roleClass = 'bg-success';
                break;
            default: 
                roleName = 'Không xác định';
                roleClass = 'bg-secondary';
        }
        
        // Kiểm tra có avatar không
        const avatarHtml = employee.hinhAnh 
            ? `<img src="${employee.hinhAnh}" class="dropdown-avatar rounded-circle me-2" width="32" height="32" alt="${employee.ten}">`
            : `<i class="fas fa-user-circle text-secondary me-2"></i>`;
        
        // Kiểm tra xem nhân viên đã được chọn chưa
        const isSelected = selectedEmployeesForAssignment.some(e => e.id === employee.id);
        
        resultsHTML += `
            <div class="dropdown-item ${isSelected ? 'disabled bg-light' : ''}" 
                 data-id="${employee.id}" 
                 data-name="${employee.ten}" 
                 data-role="${employee.chucVu}"
                 data-avatar="${employee.hinhAnh || ''}">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${avatarHtml}
                        <div>
                            <div class="fw-bold">${employee.ten}</div>
                            <div class="small text-muted">Mã: ${employee.id}</div>
                        </div>
                    </div>
                    <span class="badge ${roleClass} text-white">${roleName}</span>
                </div>
                ${isSelected ? '<small class="text-success"><i class="fas fa-check me-1"></i>Đã chọn</small>' : ''}
            </div>
        `;
    });
    
    searchDropdown.innerHTML = resultsHTML;
    searchDropdown.style.display = 'block';
    
    // Thêm sự kiện click cho các kết quả tìm kiếm
    document.querySelectorAll('#employee-search-dropdown .dropdown-item:not(.disabled)').forEach(item => {
        item.addEventListener('click', function() {
            const employeeId = this.getAttribute('data-id');
            const employeeName = this.getAttribute('data-name');
            const employeeRole = parseInt(this.getAttribute('data-role'));
            const avatarUrl = this.getAttribute('data-avatar');
            
            // Thêm nhân viên vào danh sách đã chọn
            selectEmployee({
                id: employeeId,
                name: employeeName,
                role: employeeRole,
                avatarUrl: avatarUrl && avatarUrl !== 'null' ? avatarUrl : null
            });
            
            // Ẩn dropdown sau khi chọn
            searchDropdown.style.display = 'none';
        });
    });
}

// Hàm chọn nhân viên - cập nhật để kiểm tra ca đã đăng ký
function selectEmployee(employee) {
    // Reset các checkbox nếu đã có nhân viên trước đó
    if (selectedEmployeesForAssignment.length > 0) {
        const checkboxes = document.querySelectorAll('#assignmentTableBody input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    // Hiển thị thông tin nhân viên bên ngoài dropdown
    const selectedEmployeeInfo = document.getElementById('selected-employee-info');
    const selectedEmployeeName = document.getElementById('selected-employee-name');
    const selectedEmployeeId = document.getElementById('selected-employee-id');
    const selectedEmployeeRole = document.getElementById('selected-employee-role');
    const removeSelectedBtn = document.getElementById('remove-selected-employee');
    const avatarImg = document.getElementById('selected-employee-avatar');
    
    if (selectedEmployeeName && selectedEmployeeId && selectedEmployeeRole) {
        // Hiển thị tên nhân viên
        selectedEmployeeName.textContent = employee.name;
        
        // Hiển thị mã nhân viên
        selectedEmployeeId.textContent = `Mã: ${employee.id}`;
        
        // Hiển thị chức vụ nhân viên
        let roleName = 'Không xác định';
        let roleClass = 'bg-secondary';
        
        switch (employee.role) {
            case 0:
                roleName = 'Phục vụ';
                roleClass = 'bg-primary';
                break;
            case 1:
                roleName = 'Đầu bếp';
                roleClass = 'bg-success';
                break;
        }
        
        selectedEmployeeRole.textContent = roleName;
        selectedEmployeeRole.className = `badge ${roleClass}`;
        
        // Kiểm tra và hiển thị avatar nếu có
        if (avatarImg) {
            // Kiểm tra dữ liệu avatar từ cả hai nguồn
            const avatarSrc = employee.avatarUrl || employee.hinhAnh;
            
            if (avatarSrc) {
                avatarImg.src = avatarSrc;
                avatarImg.classList.remove('d-none');
                
                // Ẩn icon mặc định
                const defaultAvatar = selectedEmployeeInfo.querySelector('.default-avatar');
                if (defaultAvatar) defaultAvatar.classList.add('d-none');
            } else {
                // Không có avatar, hiển thị icon mặc định
                avatarImg.classList.add('d-none');
                
                const defaultAvatar = selectedEmployeeInfo.querySelector('.default-avatar');
                if (defaultAvatar) defaultAvatar.classList.remove('d-none');
            }
        }
        
        // Hiển thị nút xóa
        if (removeSelectedBtn) {
            removeSelectedBtn.style.display = 'block';
        }
    }
    
    // Thêm vào danh sách nếu chưa có
    if (!selectedEmployeesForAssignment.some(e => e.id === employee.id)) {
        selectedEmployeesForAssignment.push({
            id: employee.id,
            name: employee.name,
            role: employee.role,
            avatarUrl: employee.avatarUrl || employee.hinhAnh
        });
        
        // Cập nhật UI danh sách nhân viên
        updateSelectedEmployeesUI();
        
        // Vô hiệu hóa ô tìm kiếm sau khi đã chọn nhân viên
        const searchInput = document.getElementById('search-employee');
        if (searchInput) {
            searchInput.value = employee.name;
            searchInput.disabled = true;
        }
        
        // Ẩn dropdown
        const searchDropdown = document.getElementById('employee-search-dropdown');
        if (searchDropdown) {
            searchDropdown.style.display = 'none';
        }
        
        // Kiểm tra và đánh dấu ca làm việc đã có
        markExistingShifts(employee.id);
    }
}

// Hàm kiểm tra và đánh dấu ca làm việc đã có của nhân viên
async function markExistingShifts(employeeId) {
    try {
        // Hiển thị thông báo đang tải
        showToastPrimary('Đang kiểm tra lịch làm việc của nhân viên...');
        
        // Lấy tuần đang chọn từ bộ lọc
        const weekFilter = document.getElementById('assignment-week-filter');
        const weekValue = weekFilter.value;
        
        // Gọi API để lấy lịch làm việc của nhân viên
        const response = await fetch(`/api/lich-lam-viec?idNhanVien=${employeeId}&week=${weekValue}`);
        const data = await response.json();
        
        if (data.status && data.list && data.list.length > 0) {
            console.log('Lịch làm việc của nhân viên:', data.list);
            
            // Lặp qua tất cả ca làm việc đã đăng ký
            data.list.forEach(shift => {
                // Format ngày từ YYYY-MM-DD để so sánh với data-date của checkbox
                const dateStr = new Date(shift.ngay).toISOString().split('T')[0];
                const shiftType = shift.caLamViec; // 0: sáng, 1: chiều
                
                // Tìm checkbox tương ứng
                const checkbox = document.querySelector(`#assignmentTableBody input[type="checkbox"][data-date="${dateStr}"][data-shift="${shiftType}"]`);
                
                if (checkbox) {
                    // Chỉ đánh dấu (check) mà không vô hiệu hóa (disable)
                    checkbox.checked = true;
                }
            });
            
            // Hiển thị thông báo hoàn thành
            showToastSuccess('Đã tải lịch làm việc của nhân viên');
        } else {
            console.log('Nhân viên chưa đăng ký ca nào cho tuần này');
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra lịch làm việc:', error);
        showToastDanger('Đã xảy ra lỗi khi tải lịch làm việc của nhân viên');
    }
}

// Hàm lấy thông tin chi tiết của nhân viên theo ID
async function getEmployeeDetails(employeeId) {
    // Trước tiên, kiểm tra trong danh sách đã tải
    if (allEmployees && allEmployees.length > 0) {
        const foundEmployee = allEmployees.find(emp => emp.id === employeeId);
        if (foundEmployee) {
            return {
                id: foundEmployee.id,
                name: foundEmployee.ten,
                ten: foundEmployee.ten,
                role: foundEmployee.chucVu,
                chucVu: foundEmployee.chucVu,
                avatarUrl: foundEmployee.hinhAnh || foundEmployee.avatarUrl
            };
        }
    }
    
    // Nếu chưa có trong danh sách đã tải, gọi API để lấy
    try {
        // Sử dụng query parameter để lấy thông tin một nhân viên cụ thể
        const response = await fetch(`/api/nhan-vien?id=${employeeId}`);
        const data = await response.json();
        
        if (data.status && data.obj) {
            // Cập nhật vào allEmployees để lần sau không cần gọi API nữa
            if (allEmployees && !allEmployees.some(emp => emp.id === data.obj.id)) {
                allEmployees.push(data.obj);
            }
            
            return {
                id: data.obj.id,
                name: data.obj.ten,
                ten: data.obj.ten,
                role: data.obj.chucVu,
                chucVu: data.obj.chucVu,
                avatarUrl: data.obj.hinhAnh || data.obj.avatarUrl
            };
        } else {
            console.warn(`Không tìm thấy nhân viên có ID ${employeeId}`);
            return {
                id: employeeId,
                name: employeeName || 'Nhân viên không xác định',
                ten: employeeName || 'Nhân viên không xác định',
                role: 0, // Mặc định là phục vụ
                chucVu: 0
            };
        }
    } catch (error) {
        console.error('Lỗi khi lấy thông tin chi tiết nhân viên:', error);
        
        // Trả về dữ liệu tối thiểu từ tham số nếu có lỗi
        return {
            id: employeeId,
            name: employeeName || 'Nhân viên không xác định',
            ten: employeeName || 'Nhân viên không xác định',
            role: 0, // Mặc định là phục vụ
            chucVu: 0
        };
    }
}

// Hàm cập nhật giao diện danh sách nhân viên được chọn
function updateSelectedEmployeesUI() {
    const container = document.getElementById('selected-employees');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (selectedEmployeesForAssignment.length === 0) {
        container.innerHTML = '<div class="p-2 text-muted">Chưa có nhân viên nào được chọn</div>';
        return;
    }
    
    // Tạo card cho mỗi nhân viên đã chọn
    selectedEmployeesForAssignment.forEach(employee => {
        // Xác định tên chức vụ
        let roleName = '';
        let roleClass = '';
        
        switch (employee.role) {
            case 0: 
                roleName = 'Phục vụ'; 
                roleClass = 'bg-primary';
                break;
            case 1: 
                roleName = 'Đầu bếp'; 
                roleClass = 'bg-success';
                break;
            default: 
                roleName = 'Không xác định';
                roleClass = 'bg-secondary';
        }
        
        // Kiểm tra có avatar không
        const avatarHtml = employee.avatarUrl 
            ? `<img src="${employee.avatarUrl}" class="employee-avatar rounded-circle" alt="${employee.name}">`
            : `<i class="fas fa-user-circle fa-2x text-secondary default-avatar"></i>`;
        
        const card = document.createElement('div');
        card.className = 'employee-card mb-2';
        card.innerHTML = `
            <div class="d-flex align-items-center p-2 border rounded">
                <div class="me-2 employee-avatar-container">
                    ${avatarHtml}
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold">${employee.name}</div>
                    <div>
                        <span class="badge bg-secondary">Mã: ${employee.id}</span>
                        <span class="badge ${roleClass}">${roleName}</span>
                    </div>
                </div>
                <button type="button" class="btn-close" aria-label="Xóa" data-id="${employee.id}"></button>
            </div>
        `;
        
        // Thêm sự kiện xóa nhân viên
        const removeBtn = card.querySelector('.btn-close');
        removeBtn.addEventListener('click', function() {
            removeEmployeeFromAssignment(employee.id);
        });
        
        container.appendChild(card);
    });
}

// Hàm xóa nhân viên khỏi danh sách được chọn
function removeEmployeeFromAssignment(employeeId) {
    // Tìm vị trí của nhân viên trong danh sách
    const index = selectedEmployeesForAssignment.findIndex(emp => emp.id === employeeId);
    
    if (index !== -1) {
        // Xóa nhân viên khỏi danh sách
        selectedEmployeesForAssignment.splice(index, 1);
        
        // Cập nhật lại giao diện
        updateSelectedEmployeesUI();
        
        // Nếu không còn nhân viên nào được chọn, kích hoạt lại input tìm kiếm
        if (selectedEmployeesForAssignment.length === 0) {
            const searchInput = document.getElementById('search-employee');
            if (searchInput) {
                searchInput.disabled = false;
                searchInput.value = '';
                searchInput.focus();
            }
            
            // Ẩn thông tin nhân viên đã chọn
            const selectedEmployeeInfo = document.getElementById('selected-employee-info');
            if (selectedEmployeeInfo) {
                selectedEmployeeInfo.style.display = 'none';
            }
        }
    }
}