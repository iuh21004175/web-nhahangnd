document.addEventListener('DOMContentLoaded', function() {
    // Set default dates
    setDefaultDates();

    // Handle search form
    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // TODO: Implement search functionality
    });

    // Handle search form reset
    searchForm.addEventListener('reset', function() {
        setTimeout(setDefaultDates, 0);
    });

    // Handle add attendance form
    const addAttendanceForm = document.getElementById('addAttendanceForm');
    addAttendanceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // TODO: Implement add attendance functionality
        const modal = bootstrap.Modal.getInstance(document.getElementById('addAttendanceModal'));
        modal.hide();
    });

    // Handle edit attendance
    const editAttendanceForm = document.getElementById('editAttendanceForm');
    editAttendanceForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // TODO: Implement edit attendance functionality
        const modal = bootstrap.Modal.getInstance(document.getElementById('editAttendanceModal'));
        modal.hide();
    });

    // Load attendance data when edit modal opens
    const editAttendanceModal = document.getElementById('editAttendanceModal');
    editAttendanceModal.addEventListener('show.bs.modal', function(event) {
        const button = event.relatedTarget;
        const row = button.closest('tr');
        
        // Get data from table row
        const employeeName = row.cells[2].textContent;
        const date = row.cells[3].textContent;
        const timeIn = row.cells[4].textContent;
        const timeOut = row.cells[5].textContent;
        
        // Set data in form
        const form = this.querySelector('form');
        form.querySelector('#editEmployeeName').value = employeeName;
        
        // Convert date format from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = date.split('/');
        form.querySelector('[name="date"]').value = `${year}-${month}-${day}`;
        
        form.querySelector('[name="timeIn"]').value = timeIn;
        form.querySelector('[name="timeOut"]').value = timeOut;
    });

    // Hiển thị ngày hiện tại
    displayCurrentDate();
});

// Set default dates (today and 7 days ago)
function setDefaultDates() {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    document.getElementById('startDate').value = formatDate(sevenDaysAgo);
    document.getElementById('endDate').value = formatDate(today);
}

// Format date to YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Hiển thị ngày hiện tại
function displayCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('vi-VN', options);
    document.getElementById('currentDate').textContent = dateStr;
}

// Xử lý check-in
function checkIn(employeeId) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Cập nhật thời gian check-in
    document.getElementById(`timeIn-${employeeId}`).textContent = timeStr;
    
    // Cập nhật trạng thái và nút
    const row = document.querySelector(`button[data-employee-id="${employeeId}"]`).closest('tr');
    const statusBadge = row.querySelector('.badge');
    statusBadge.className = 'badge bg-primary';
    statusBadge.textContent = 'Đang làm việc';
    
    // Disable nút check-in và enable nút check-out
    const checkInBtn = row.querySelector('.check-in-btn');
    const checkOutBtn = row.querySelector('.check-out-btn');
    checkInBtn.disabled = true;
    checkOutBtn.disabled = false;

    // Hiển thị thông báo
    showToast('Check-in thành công!', 'success');
}

// Xử lý check-out
function checkOut(employeeId) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Cập nhật thời gian check-out
    document.getElementById(`timeOut-${employeeId}`).textContent = timeStr;
    
    // Cập nhật trạng thái và nút
    const row = document.querySelector(`button[data-employee-id="${employeeId}"]`).closest('tr');
    const statusBadge = row.querySelector('.badge');
    statusBadge.className = 'badge bg-success';
    statusBadge.textContent = 'Đã check-out';
    
    // Disable cả hai nút
    const checkInBtn = row.querySelector('.check-in-btn');
    const checkOutBtn = row.querySelector('.check-out-btn');
    checkInBtn.disabled = true;
    checkOutBtn.disabled = true;

    // Hiển thị thông báo
    showToast('Check-out thành công!', 'success');
}

// Hiển thị thông báo
function showToast(message, type = 'success') {
    const toast = document.getElementById('attendanceToast');
    const toastBody = toast.querySelector('.toast-body');
    toastBody.textContent = message;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
} 