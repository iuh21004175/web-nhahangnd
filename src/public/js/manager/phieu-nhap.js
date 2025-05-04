document.addEventListener('DOMContentLoaded', async function() {
    // Thiết lập giá trị mặc định cho các input date
    setupDefaultDates();
    // Biến toàn cục để lưu trữ danh sách nguyên liệu
    let ingredientsList = [];
    let listPhieuNhap = await getAPIPhieuNhap()
    thaoTacVoiBang(listPhieuNhap);
    // Khởi tạo ứng dụng
    init();

    // Hàm khởi tạo
    function init() {
        // Tải danh sách nguyên liệu
        loadIngredients();
        
        // Xử lý nút thêm hàng mới
        const addIngredientRowButton = document.getElementById('addIngredientRow');
        if (addIngredientRowButton) {
            addIngredientRowButton.addEventListener('click', addIngredientRow);
        }
        
        // Khởi tạo sự kiện cho hàng đầu tiên
        document.querySelectorAll('.ingredient-row').forEach(row => {
            attachRowEventListeners(row);
        });
        
        // Xử lý submit form
        const addReceiptForm = document.getElementById('addReceiptForm');
        if (addReceiptForm) {
            addReceiptForm.addEventListener('submit', submitPhieuNhap);
        }
    }
    // Thêm hàm này vào file phieu-nhap.js
    async function submitPhieuNhap(e) {
        e.preventDefault();
        
        try {
            showLoading(true);
            
            // Lấy thông tin chung của phiếu nhập
            const phieuNhap = {
                thoiGianNhap: new Date().toISOString(),
                tongTien: parseInt(document.getElementById('createTotalAmount')?.textContent.replace(/[^\d]/g, '')) || 0,
                chiTiet: [] // Chi tiết các nguyên liệu
            };
            
            // Lặp qua tất cả các hàng để lấy thông tin chi tiết
            const rows = document.querySelectorAll('.ingredient-row');
            let hasError = false;
            
            rows.forEach((row, index) => {
                const ingredientId = row.querySelector('.ingredient-value')?.value;
                const ingredientName = row.querySelector('.ingredient-search')?.value;
                const quantity = parseFloat(row.querySelector('.quantity-input')?.value) || 0;
                const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
                const expireDate = row.querySelector('.expire-date-input')?.value;
                const note = row.querySelector('.note-input')?.value || '';
                
                // Kiểm tra dữ liệu hợp lệ
                if (!ingredientId || !ingredientName) {
                    alert(`Vui lòng chọn nguyên liệu ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!quantity || quantity <= 0) {
                    alert(`Vui lòng nhập số lượng hợp lệ ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!price || price <= 0) {
                    alert(`Vui lòng nhập đơn giá hợp lệ ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!expireDate) {
                    alert(`Vui lòng nhập hạn sử dụng ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                // Thêm chi tiết vào phiếu nhập
                phieuNhap.chiTiet.push({
                    idNguyenLieu: ingredientId,
                    soLuong: quantity,
                    gia: price,
                    hanSuDung: expireDate,
                    ghiChu: note
                });
            });
            
            // Nếu có lỗi, dừng việc gửi API
            if (hasError) {
                showLoading(false);
                return;
            }
            
            // Gọi API để tạo phiếu nhập
            const response = await fetch('/api/phieu-nhap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(phieuNhap)
            });
            
            const data = await response.json();
            if (data.status){
                // Reset form hoặc đóng modal
                showToastSuccess("Tạo phiếu nhập thành công!")
                const modal = bootstrap.Modal.getInstance(document.getElementById('addReceiptModal'));
                if (modal) {
                    modal.hide();
                }
                resetPhieuNhapForm();
                listPhieuNhap.unshift(data.obj); // Thêm phiếu nhập mới vào đầu danh sách
                thaoTacVoiBang(listPhieuNhap); // Cập nhật bảng danh sách phiếu nhập
            }
            else {
                showToastDanger(data.error)
                console.error('Lỗi khi tạo phiếu nhập:', data.error);
            }
            
            
        } catch (error) {
            showToastDanger()
            console.error('Lỗi khi tạo phiếu nhập:', error);
        } finally {
            showLoading(false);
        }
    }
    // Thêm hàm reset phiếu nhập
    function resetPhieuNhapForm() {
        // Giữ lại dòng đầu tiên và xóa các dòng khác
        const tbody = document.querySelector('#ingredientTable tbody');
        const allRows = tbody.querySelectorAll('.ingredient-row');
        
        // Nếu có nhiều hơn 1 dòng, giữ lại dòng đầu và xóa các dòng còn lại
        if (allRows.length > 1) {
            const firstRow = allRows[0];
            
            // Xóa tất cả các dòng
            tbody.innerHTML = '';
            
            // Thêm lại dòng đầu tiên
            tbody.appendChild(firstRow);
        }
        
        // Reset giá trị trong dòng đầu tiên
        const firstRow = tbody.querySelector('.ingredient-row');
        if (firstRow) {
            // Reset các input
            firstRow.querySelectorAll('input').forEach(input => {
                input.value = '';
                
                // Đảm bảo unit-input hiển thị và là readonly
                if (input.classList.contains('unit-input')) {
                    input.style.display = '';
                    input.readOnly = true;
                }
                
                // Reset initialized attribute cho input tìm kiếm
                if (input.classList.contains('ingredient-search')) {
                    input.removeAttribute('data-initialized');
                }
            });
            
            // Reset thành tiền
            const amountCell = firstRow.querySelector('.amount-cell');
            if (amountCell) amountCell.textContent = '0đ';
            
            // Reset date picker về ngày hiện tại nếu có
            const expireDateInput = firstRow.querySelector('.expire-date-input');
            if (expireDateInput) {
                const today = new Date();
                const nextMonth = new Date(today);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                const year = nextMonth.getFullYear();
                const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
                const day = String(nextMonth.getDate()).padStart(2, '0');
                
                expireDateInput.value = `${year}-${month}-${day}`;
            }
            
            // Reset select boxes nếu có
            firstRow.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Reset STT
            const sttCell = firstRow.querySelector('td:first-child');
            if (sttCell) sttCell.textContent = '1';
        }
        
        // Reset tổng tiền
        const totalElement = document.getElementById('createTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(0);
        }
        
        // Khởi tạo lại dropdown
        initializeCustomDropdowns();
    }
        // Hàm loại bỏ dấu tiếng Việt để tìm kiếm
    function removeDiacritics(str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    
    // Hàm tải danh sách nguyên liệu từ API
    async function loadIngredients() {
        try {
            showLoading(true);
            const response = await fetch('/api/nguyen-lieu');
            if (!response.ok) throw new Error('Không thể tải danh sách nguyên liệu');
            
            // Lưu danh sách nguyên liệu vào biến toàn cục
            const data = await response.json();
            ingredientsList = data.list;
            
            // Khởi tạo dropdown
            initializeCustomDropdowns();
            
            showLoading(false);
        } catch (error) {
            console.error("Lỗi khi tải danh sách nguyên liệu:", error);
            alert("Không thể tải danh sách nguyên liệu. Vui lòng thử lại sau.");
            showLoading(false);
        }
    }
    
    // Khởi tạo dropdown tùy chỉnh
    function initializeCustomDropdowns() {
        document.querySelectorAll('.ingredient-search').forEach(input => {
            if (!input.dataset.initialized) {
                setupIngredientSearch(input);
                input.dataset.initialized = "true";
            }
        });
    }
    
    // Thiết lập tìm kiếm nguyên liệu
    function setupIngredientSearch(input) {
        const container = input.closest('.custom-dropdown-container');
        const dropdown = container.querySelector('.ingredient-dropdown');
        const resultsContainer = dropdown.querySelector('.dropdown-search-results');
        
        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            closeAllDropdowns();
            
            // Tính toán và đặt vị trí cho dropdown
            positionDropdownAbsolute(dropdown, input);
            
            // Hiển thị dropdown
            dropdown.classList.add('active');
            filterIngredients(input.value, resultsContainer);
        });
        
        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            filterIngredients(input.value, resultsContainer);
        });
        
        // Xử lý click bên ngoài để đóng dropdown
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Xử lý click vào dropdown arrow
        const arrow = container.querySelector('.dropdown-arrow');
        arrow.addEventListener('click', function() {
            input.focus();
        });
    }
    // Hàm mới để tính toán vị trí chính xác cho dropdown
    function positionDropdownAbsolute(dropdown, input) {
        // Lấy vị trí của input trên trang
        const rect = input.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        
        // Đặt vị trí top và left cho dropdown
        dropdown.style.top = (rect.bottom + scrollTop) + 'px';
        dropdown.style.left = (rect.left + scrollLeft) + 'px';
        dropdown.style.width = Math.max(rect.width, 250) + 'px';
        
        // Kiểm tra nếu dropdown sẽ bị tràn ra khỏi màn hình
        const dropdownHeight = 250; // Chiều cao ước lượng
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // Nếu tràn ra dưới màn hình, hiển thị dropdown lên trên
        if (rect.bottom + dropdownHeight > windowHeight) {
            dropdown.style.top = (rect.top + scrollTop - dropdownHeight) + 'px';
        }
        
        // Nếu tràn ra phải, dịch sang trái
        if (rect.left + dropdown.offsetWidth > windowWidth) {
            dropdown.style.left = (windowWidth - dropdown.offsetWidth - 10 + scrollLeft) + 'px';
        }
        
        // Đặt max-height để tránh quá dài
        dropdown.style.maxHeight = '250px';
        dropdown.style.overflowY = 'auto';
    }

    // Cập nhật khi cuộn trang
    window.addEventListener('scroll', function() {
        const activeDropdown = document.querySelector('.ingredient-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.ingredient-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    }, true);

    // Cập nhật khi thay đổi kích thước cửa sổ
    window.addEventListener('resize', function() {
        const activeDropdown = document.querySelector('.ingredient-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.ingredient-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    });

    // Cập nhật khi cuộn trong table-responsive
    document.querySelectorAll('.table-responsive').forEach(table => {
        table.addEventListener('scroll', function() {
            const activeDropdown = document.querySelector('.ingredient-dropdown.active');
            if (activeDropdown) {
                const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.ingredient-search');
                if (input) {
                    positionDropdownAbsolute(activeDropdown, input);
                }
            }
        });
    });
    // Đóng tất cả dropdown đang mở
    function closeAllDropdowns() {
        document.querySelectorAll('.ingredient-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    // Lọc danh sách nguyên liệu theo từ khóa tìm kiếm
    function filterIngredients(keyword, resultsContainer) {
        // Xóa nội dung hiện tại
        resultsContainer.innerHTML = '';
        
        // Nếu không có từ khóa, hiển thị tất cả
        const normalizedKeyword = removeDiacritics(keyword.toLowerCase());
        
        // Lọc danh sách nguyên liệu
        const filteredIngredients = normalizedKeyword.length > 0 
            ? ingredientsList.filter(ingredient => {
                const normalizedName = removeDiacritics(ingredient.ten.toLowerCase());
                return normalizedName.includes(normalizedKeyword);
              })
            : ingredientsList;
        
        // Nếu không có kết quả
        if (filteredIngredients.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không tìm thấy nguyên liệu</div>';
            return;
        }
        
        // Hiển thị kết quả
        filteredIngredients.forEach(ingredient => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.id = ingredient.id;
            item.dataset.name = ingredient.ten;
            item.dataset.unit = ingredient.donVi || '';
            
            // Highlight từ khóa tìm kiếm
            const name = ingredient.ten;
            if (normalizedKeyword.length > 0) {
                const normalizedName = removeDiacritics(name.toLowerCase());
                const start = normalizedName.indexOf(normalizedKeyword);
                if (start !== -1) {
                    const end = start + normalizedKeyword.length;
                    item.innerHTML = name.substring(0, start) + 
                        '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' + 
                        name.substring(end);
                } else {
                    item.textContent = name;
                }
            } else {
                item.textContent = name;
            }
            
            // Xử lý khi chọn một nguyên liệu
            item.addEventListener('click', function() {
                const input = this.closest('.custom-dropdown-container').querySelector('.ingredient-search');
                const hiddenInput = this.closest('.custom-dropdown-container').querySelector('.ingredient-value');
                const dropdown = this.closest('.ingredient-dropdown');
                
                // Cập nhật giá trị
                input.value = this.dataset.name;
                hiddenInput.value = this.dataset.id;
                dropdown.classList.remove('active');
                
                // Cập nhật đơn vị - đảm bảo đơn vị luôn được hiển thị
                const row = input.closest('.ingredient-row');
                const unitInput = row.querySelector('.unit-input');
                
                if (unitInput && this.dataset.unit) {
                    // Đảm bảo input đơn vị hiển thị và được cập nhật
                    unitInput.style.display = '';
                    unitInput.value = this.dataset.unit;
                }
            });
            
            resultsContainer.appendChild(item);
        });
    }
    
    // Thêm hàng nguyên liệu mới
    function addIngredientRow() {
        const tbody = document.querySelector('#ingredientTable tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng nguyên liệu');
            return;
        }
        
        const firstRow = tbody.querySelector('.ingredient-row');
        if (!firstRow) {
            console.error('Không tìm thấy dòng nguyên liệu mẫu');
            return;
        }
        
        const newRow = firstRow.cloneNode(true);
        
        // Reset các giá trị trong dòng mới
        newRow.querySelectorAll('input').forEach(input => {
            // Reset giá trị nhưng không ẩn input đơn vị
            input.value = '';
            
            // Chỉ ẩn các input khác nếu cần, KHÔNG ẩn unit-input
            if (input.classList.contains('unit-input')) {
                // Đảm bảo unit-input hiển thị và là readonly
                input.style.display = ''; // Xóa style display:none nếu có
                input.readOnly = true;
            }
            
            // Reset initialized attribute cho input tìm kiếm
            if (input.classList.contains('ingredient-search')) {
                input.removeAttribute('data-initialized');
            }
        });
        // Reset thành tiền
        const amountCell = newRow.querySelector('.amount-cell');
        if (amountCell) amountCell.textContent = '0đ';
        // Reset ghi chú
        const noteInput = newRow.querySelector('.note-input');
        if (noteInput) noteInput.value = '';
        // Reset select boxes nếu có
        newRow.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        // Cập nhật STT
        const rowCount = tbody.children.length + 1;
        const sttCell = newRow.querySelector('td:first-child');
        if (sttCell) {
            sttCell.textContent = rowCount;
        }
        
        // Đảm bảo các phần tử có đúng style
        const unitInput = newRow.querySelector('.unit-input');
        if (unitInput) {
            // Đảm bảo input đơn vị hiển thị đúng
            unitInput.style.display = '';
            unitInput.style.width = '30px';
            unitInput.readOnly = true;
        }
        
        // Thêm dòng mới vào bảng
        tbody.appendChild(newRow);
        
        // Khởi tạo lại dropdown
        initializeCustomDropdowns();
        
        // Gắn lại các event listeners
        attachRowEventListeners(newRow);
        
        // Tính lại tổng tiền
        calculateTotal();
    }
    
    // Gắn sự kiện cho các phần tử trong hàng
    function attachRowEventListeners(row) {
        const removeButton = row.querySelector('.remove-row');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                if (document.querySelectorAll('.ingredient-row').length > 1) {
                    row.remove();
                    updateRowNumbers();
                    calculateTotal();
                }
            });
        }
        
        const quantityInput = row.querySelector('.quantity-input');
        const priceInput = row.querySelector('.price-input');
        
        if (quantityInput) quantityInput.addEventListener('input', () => calculateAmount(row));
        if (priceInput) priceInput.addEventListener('input', () => calculateAmount(row));
        
        // Đảm bảo input đơn vị hiển thị (nếu có unit-select thì xử lý khác)
        const unitInput = row.querySelector('.unit-input');
        if (unitInput) {
            unitInput.style.display = ''; // Đảm bảo hiển thị
        }
    }
    
    // Cập nhật số thứ tự các hàng
    function updateRowNumbers() {
        document.querySelectorAll('.ingredient-row').forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
        });
    }
    
    // Tính toán thành tiền cho một hàng
    function calculateAmount(row) {
        const quantity = parseFloat(row.querySelector('.quantity-input').value) || 0;
        const price = parseFloat(row.querySelector('.price-input').value) || 0;
        const amount = quantity * price;
        
        row.querySelector('.amount-cell').textContent = formatCurrency(amount);
        calculateTotal();
    }
    
    // Tính tổng tiền
    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const amountText = row.querySelector('.amount-cell').textContent;
            const amount = parseFloat(amountText.replace(/[^\d]/g, '')) || 0;
            total += amount;
        });
        
        const totalElement = document.getElementById('createTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(total);
        }
    }
    
    
    // Hiển thị loading indicator
    function showLoading(show) {
        if (show) {
            if (!document.getElementById('loading-indicator')) {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loading-indicator';
                loadingIndicator.style.position = 'fixed';
                loadingIndicator.style.top = '0';
                loadingIndicator.style.left = '0';
                loadingIndicator.style.right = '0';
                loadingIndicator.style.bottom = '0';
                loadingIndicator.style.background = 'rgba(255,255,255,0.7)';
                loadingIndicator.style.zIndex = '9999';
                loadingIndicator.style.display = 'flex';
                loadingIndicator.style.justifyContent = 'center';
                loadingIndicator.style.alignItems = 'center';
                loadingIndicator.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                `;
                document.body.appendChild(loadingIndicator);
            }
        } else {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.remove();
        }
    }
    document.querySelector('.btn-timKiem').addEventListener('click', async function(e) {
        e.preventDefault();
        timKiemPhieuNhap();
    })
    document.querySelector('.btn-lamMoi').addEventListener('click', async function(e) {
        e.preventDefault();
        setupDefaultDates();
        document.getElementById('minAmount').value = '';
        document.getElementById('maxAmount').value = '';
        listPhieuNhap = await getAPIPhieuNhap()
        thaoTacVoiBang(listPhieuNhap);
    })
});
// Format số tiền
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}
// Hàm lấy dữ liệu danh sách phiếu nhập từ API
async function getAPIPhieuNhap() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const response = await fetch(`/api/phieu-nhap?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        if(data.status) {
            return data.list
        }
        else{
            showToastDanger(data.error)
            console.error('Lỗi khi tải danh sách phiếu nhập:', data.error);
            return [];
        }
    } catch (error) {
        showToastDanger()
        console.error('Lỗi khi tải danh sách phiếu nhập:', error);
        return [];
    }
}
function formatDate (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
};
// Hàm render danh sách phiếu nhập và sử lý sự kiện phiếu nhập
function thaoTacVoiBang(list){
    const tableBody = document.querySelector('.table-danhSach tbody');
    tableBody.innerHTML = ''; // Xóa nội dung hiện tại
    // Format ngày dạng YYYY-MM-DD cho input type="date"
    if(list.length > 0) {
        list.forEach((phieuNhap, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${formatDate(new Date(phieuNhap.thoiGianNhap))}</td>
                <td>${formatCurrency(phieuNhap.tongTien)}</td>
                <td>
                    <button class="btn btn-sm btn-info text-white btn-xem" 
                        data-bs-toggle="modal"
                        data-bs-target="#viewReceiptModal"
                        data-bs-tooltip="tooltip"
                        data-id="${phieuNhap.id}"
                        title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        })
    }
    else{
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" class="text-center">Không tìm thấy phiếu nhập kho nào</td>
        `;
        tableBody.appendChild(row);
    }
    // Khởi tạo tooltips
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    document.querySelectorAll('.btn-xem').forEach(button => {
        button.addEventListener('click', async function() {
            const id = this.dataset.id;
            const phieuNhap = list.find(item => item.id == id);
            document.getElementById('receiptDate').innerHTML = formatDate(new Date(phieuNhap.thoiGianNhap));
            document.getElementById('receiptDateTime').innerHTML = formatFullDateTime(new Date(phieuNhap.thoiGianNhap));
            document.getElementById('viewTotalAmount').innerHTML = formatCurrency(phieuNhap.tongTien);
            const listNguyenLieu = await getAPINguyenLieuByIdPhieu(id);
            renderNguyenLieuPhieuNhap(listNguyenLieu);
        });
    });
}
// Hàm render danh sách nguyên liệu của phiếu nhập
function renderNguyenLieuPhieuNhap(list) {
    const tableBody = document.querySelector('#receiptDetails');
    tableBody.innerHTML = ''; // Xóa nội dung hiện tại
    list.forEach((nguyenLieu, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${nguyenLieu.NguyenLieu.ten}</td>
            <td>${nguyenLieu.NguyenLieu.donVi}</td>
            <td>${nguyenLieu.soLuong}</td>
            <td>${formatCurrency(nguyenLieu.gia)}</td>
            <td>${formatCurrency(parseInt(nguyenLieu.soLuong) * parseInt(nguyenLieu.gia))}</td>
            <td>${formatDate(new Date(nguyenLieu.hanSuDung))}</td>
            <td>${nguyenLieu.ghiChu || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    })
}
// Hàm lấy API danh sách nguyên liệu của phiếu nhập
async function getAPINguyenLieuByIdPhieu(id) {
    try {
        const response = await fetch(`/api/chi-tiet-phieu-nhap?id=${id}`);
        const data = await response.json();
        if(data.status) {
            return data.list
        }
        else{
            showToastDanger(data.error)
            console.error('Lỗi khi tải danh sách nguyên liệu:', data.error);
            return [];
        }
    } catch (error) {
        showToastDanger()
        console.error('Lỗi khi tải danh sách nguyên liệu:', error);
        return [];
    }
}
// Hàm tìm kiếm phiếu nhập
async function timKiemPhieuNhap() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const minAmount = document.getElementById('minAmount').value;
    const maxAmount = document.getElementById('maxAmount').value;

    try{
        const res = await fetch(`/api/tim-kiem-phieu-nhap?startDate=${startDate}&endDate=${endDate}&minAmount=${minAmount}&maxAmount=${maxAmount}`);
        const data = await res.json();
        if(data.status) {
            thaoTacVoiBang(data.list);
        }
        else{
            showToastDanger(data.error)
            console.error('Lỗi khi tìm kiếm phiếu nhập:', data.error);
        }
    }
    catch (error) {
        showToastDanger()
        console.error('Lỗi khi tìm kiếm phiếu nhập:', error);
    }
}
// Hàm định dạng ngày tháng đầy đủ (ngày/tháng/năm giờ:phút:giây)
function formatFullDateTime(date) {
    if (!date || isNaN(date)) return 'N/A';
    
    // Lấy thông tin ngày tháng
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    // Lấy thông tin giờ phút giây
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    // Trả về chuỗi định dạng đầy đủ
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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
// Thiết lập giá trị mặc định cho input date (endDate: ngày hiện tại, startDate: 7 ngày trước)
function setupDefaultDates() {
    // Lấy ngày hiện tại
    const today = new Date();
    const endDateInput = document.getElementById('endDate');
    
    // Lấy ngày 7 ngày trước
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    const startDateInput = document.getElementById('startDate');
    
    // Format ngày dạng YYYY-MM-DD cho input type="date"
    const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Đặt giá trị cho input
    if (endDateInput) {
        endDateInput.value = formatDateForInput(today);
        // Đặt max date là ngày hiện tại
        endDateInput.max = formatDateForInput(today);
    }
    
    if (startDateInput) {
        startDateInput.value = formatDateForInput(lastWeek);
    }
}