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
});