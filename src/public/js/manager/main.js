document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle Sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', (e) => {
            e.preventDefault();
            sidebar.classList.toggle('active');
        });
    }

    // Close Sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && 
                !sidebarToggle.contains(e.target) && 
                sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }
        }
    });

    // Initialize Bootstrap Tooltips & Popovers
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Active Navigation Link
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // Responsive Sidebar
    function handleResize() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
        }
    }
    window.addEventListener('resize', handleResize);

    // Hàm đóng tất cả các submenu
    function closeAllSubmenus() {
        document.querySelectorAll('.sub-menu').forEach(menu => {
            menu.style.display = 'none';
            const otherToggle = document.querySelector(`[data-target="${menu.id}"]`);
            if (otherToggle) {
                otherToggle.classList.remove('active');
                const otherChevron = otherToggle.querySelector('.fa-chevron-down');
                if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
            }
        });
    }

    // Hàm mở submenu cụ thể
    function openSubmenu(submenuId) {
        const submenu = document.getElementById(submenuId);
        if (submenu) {
            submenu.style.display = 'block';
            const toggle = document.querySelector(`[data-target="${submenuId}"]`);
            if (toggle) {
                toggle.classList.add('active');
                const chevron = toggle.querySelector('.fa-chevron-down');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            }
            // Lưu trạng thái mở vào localStorage
            localStorage.setItem('activeSubmenu', submenuId);
        }
    }

    // Xác định submenu cần mở dựa trên URL
    function getSubmenuForPath(path) {
        const submenuMap = {
            '/danh-muc-mon-an': 'menuSubmenu',
            '/mon-an': 'menuSubmenu',
            '/danh-muc-nguyen-lieu': 'inventorySubmenu',
            '/nguyen-lieu': 'inventorySubmenu',
            '/kho': 'inventorySubmenu',
            '/phieu-nhap': 'inventorySubmenu',
            '/phieu-xuat': 'inventorySubmenu',
            '/duyet-dang-ky': 'scheduleSubmenu',
            '/phan-cong': 'scheduleSubmenu',
            '/khu-vuc': 'tableSubmenu',
            '/ban': 'tableSubmenu'
        };

        for (const [urlPath, submenuId] of Object.entries(submenuMap)) {
            if (path.includes(urlPath)) {
                return submenuId;
            }
        }
        return null;
    }

    // Khôi phục trạng thái submenu khi tải trang
    function restoreSubmenuState() {
        // Đóng tất cả submenu trước
        closeAllSubmenus();

        // Xác định submenu cần mở dựa trên URL
        const pathSubmenu = getSubmenuForPath(currentPath);
        
        if (pathSubmenu) {
            // Nếu URL khớp với một submenu, ưu tiên mở submenu đó
            openSubmenu(pathSubmenu);
        } else {
            // Nếu không, kiểm tra localStorage
            const savedSubmenu = localStorage.getItem('activeSubmenu');
            if (savedSubmenu) {
                openSubmenu(savedSubmenu);
            }
        }
    }

    // Xử lý tất cả các submenu toggles
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    submenuToggles.forEach(toggle => {
        const targetId = toggle.getAttribute('data-target');
        
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const submenu = document.getElementById(targetId);
            const isCurrentlyOpen = submenu && (submenu.style.display === 'block');
            
            // Đóng tất cả submenu trước
            closeAllSubmenus();
            
            // Nếu submenu này chưa mở, hãy mở nó
            if (!isCurrentlyOpen && submenu) {
                openSubmenu(targetId);
            } else {
                // Nếu đã mở, xóa khỏi localStorage khi đóng
                localStorage.removeItem('activeSubmenu');
            }
        });
    });

    // Ngăn chặn sự kiện click trên submenu lan ra ngoài
    document.querySelectorAll('.sub-menu').forEach(menu => {
        menu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });

    // Khôi phục trạng thái khi tải trang
    restoreSubmenuState();

    // ===== PASSWORD CHANGE FUNCTIONALITY =====
    
    // Handle toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            // Toggle type between password and text
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
    
    // Handle form submission
    document.getElementById('btnChangePassword')?.addEventListener('click', async function() {
        // Reset validation states
        const currentPassword = document.getElementById('currentPassword');
        const newPassword = document.getElementById('newPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        
        currentPassword.classList.remove('is-invalid');
        newPassword.classList.remove('is-invalid');
        confirmPassword.classList.remove('is-invalid');
        
        // Validate input fields
        let isValid = true;
        
        if (!currentPassword.value) {
            currentPassword.classList.add('is-invalid');
            document.getElementById('currentPasswordFeedback').textContent = 'Vui lòng nhập mật khẩu hiện tại';
            isValid = false;
        }
        
        if (!newPassword.value) {
            newPassword.classList.add('is-invalid');
            document.getElementById('newPasswordFeedback').textContent = 'Vui lòng nhập mật khẩu mới';
            isValid = false;
        } else if (newPassword.value.length < 6) {
            newPassword.classList.add('is-invalid');
            document.getElementById('newPasswordFeedback').textContent = 'Mật khẩu phải có ít nhất 6 ký tự';
            isValid = false;
        }
        
        if (!confirmPassword.value) {
            confirmPassword.classList.add('is-invalid');
            document.getElementById('confirmPasswordFeedback').textContent = 'Vui lòng xác nhận mật khẩu mới';
            isValid = false;
        } else if (newPassword.value !== confirmPassword.value) {
            confirmPassword.classList.add('is-invalid');
            document.getElementById('confirmPasswordFeedback').textContent = 'Mật khẩu xác nhận không khớp';
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Define originalBtnText outside try/catch block so it's in the right scope
        const btnChangePassword = document.getElementById('btnChangePassword');
        const originalBtnText = btnChangePassword.innerHTML;
        
        try {
            // Hiển thị loader hoặc disable nút
            btnChangePassword.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...';
            btnChangePassword.disabled = true;
            console.log('Submitting form...');
            const response = await fetch('/api/doi-mat-khau', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    matKhauCu: currentPassword.value,
                    matKhauMoi: newPassword.value
                })
            });
            
            const data = await response.json();
            console.log('Response:', data);
            // Khôi phục nút
            btnChangePassword.innerHTML = originalBtnText;
            btnChangePassword.disabled = false;
            
            if (data.status) {
                // Success
                showToastSuccess('Đổi mật khẩu thành công');
                alert('Vui lòng đăng nhập lại để tiếp tục');
                window.location.href = './login';
                // Close modal and reset form
                const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                modal.hide();
                document.getElementById('changePasswordForm').reset();
            } else {
                showToastDanger(data.message);
            }
        } catch (error) {
            console.error('Lỗi khi đổi mật khẩu:', error);
            showToastDanger('Đã xảy ra lỗi khi kết nối tới máy chủ');
            
            // Khôi phục nút
            btnChangePassword.innerHTML = originalBtnText;
            btnChangePassword.disabled = false;
        }
    });
    
    // Reset form when modal is closed
    const changePasswordModal = document.getElementById('changePasswordModal');
    changePasswordModal?.addEventListener('hidden.bs.modal', function() {
        document.getElementById('changePasswordForm').reset();
        
        // Clear validation states
        document.getElementById('currentPassword').classList.remove('is-invalid');
        document.getElementById('newPassword').classList.remove('is-invalid');
        document.getElementById('confirmPassword').classList.remove('is-invalid');
    });
    
    // Add toast functions if they don't exist
    if (typeof showToastSuccess !== 'function') {
        window.showToastSuccess = function(message) {
            const toastEl = document.getElementById('successToast');
            const toast = new bootstrap.Toast(toastEl);
            const toastMessage = toastEl.querySelector('.toastMessage');
            toastMessage.textContent = message;
            toast.show();
        };
    }
    
    if (typeof showToastDanger !== 'function') {
        window.showToastDanger = function(message) {
            const toastEl = document.getElementById('dangerToast');
            const toast = new bootstrap.Toast(toastEl);
            const toastMessage = toastEl.querySelector('.toastMessage');
            toastMessage.textContent = message;
            toast.show();
        };
    }
    
    if (typeof showToastPrimary !== 'function') {
        window.showToastPrimary = function(message) {
            const toastEl = document.getElementById('primaryToast');
            const toast = new bootstrap.Toast(toastEl);
            const toastMessage = toastEl.querySelector('.toastMessage');
            toastMessage.textContent = message;
            toast.show();
        };
    }
});