document.addEventListener('DOMContentLoaded', async function() {
    // Thiết lập giá trị mặc định cho ngày bắt đầu và ngày kết thúc
    setDefaultDate();
    // Biến lưu trữ danh sách nguyên liệu
    let inventoryList = [];
    let receiverList = [];
    let listPhieuXuat = await getAPIPhieuXuat();
    thaoTacVoiBang(listPhieuXuat)
    // Khởi tạo ứng dụng
    init();

    // Hàm khởi tạo
    function init() {
        // Tải danh sách nguyên liệu
        loadInventoryData();
        
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
        const addExportForm = document.getElementById('addExportForm');
        if (addExportForm) {
            addExportForm.addEventListener('submit', submitPhieuXuat);
        }
        
        // Khởi tạo dropdown tìm kiếm
        initializeCustomDropdowns();

        // Tải danh sách nhân viên (người nhận)
        loadReceiverData();
        
        // Thiết lập tìm kiếm người nhận
        setupReceiverSearch();
    }
    // Hàm tải danh sách nhân viên từ API
    async function loadReceiverData() {
        try {
            const response = await fetch('/api/nhan-vien');
            if (!response.ok) throw new Error('Không thể tải danh sách nhân viên');
            
            // Lưu danh sách nhân viên vào biến toàn cục
            const data = await response.json();
            receiverList = data.list || [];
            
            console.log('Đã tải thành công danh sách nhân viên:', receiverList.length);
        } catch (error) {
            console.error("Lỗi khi tải danh sách nhân viên:", error);
        }
    }

    // Hàm thiết lập tìm kiếm người nhận
    function setupReceiverSearch() {
        const input = document.getElementById('receiverName');
        if (!input) return;
        
        const container = input.closest('.receiver-container');
        if (!container) return;
        
        // Tạo dropdown container nếu chưa có
        let dropdown = container.querySelector('.receiver-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'dropdown-menu receiver-dropdown';
            container.appendChild(dropdown);
        }
        
        // Tạo kết quả tìm kiếm container nếu chưa có
        let resultsContainer = dropdown.querySelector('.receiver-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'dropdown-search-results receiver-results';
            dropdown.appendChild(resultsContainer);
        }
        
        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            // Đóng tất cả dropdown khác
            document.querySelectorAll('.inventory-dropdown.active, .receiver-dropdown.active')
                .forEach(d => d.classList.remove('active'));
            
            // Hiển thị dropdown
            dropdown.classList.add('active');
            filterReceivers(input.value, resultsContainer);
        });
        
        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            filterReceivers(input.value, resultsContainer);
        });
        
        // Xử lý click bên ngoài để đóng dropdown
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Xử lý click vào dropdown arrow nếu có
        const arrow = container.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.addEventListener('click', function() {
                input.focus();
            });
        }
    }

    // Lọc danh sách người nhận theo từ khóa tìm kiếm
    function filterReceivers(keyword, resultsContainer) {
        // Xóa nội dung hiện tại
        resultsContainer.innerHTML = '';
        
        // Nếu không có từ khóa và không có danh sách
        if (keyword.length === 0 && (!receiverList || receiverList.length === 0)) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Nhập để tìm kiếm nhân viên...</div>';
            return;
        }
        
        // Nếu danh sách trống
        if (!receiverList || receiverList.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không có dữ liệu nhân viên</div>';
            return;
        }
        
        // Chuẩn hóa từ khóa tìm kiếm
        const normalizedKeyword = removeDiacritics(keyword.toLowerCase());
        
        // Lọc danh sách người nhận
        let filteredReceivers;
        if (normalizedKeyword.length > 0) {
            // Lọc theo từ khóa
            filteredReceivers = receiverList.filter(nv => {
                // Giả sử mỗi nhân viên có tên trong thuộc tính "ten" hoặc "hoTen"
                const tenNhanVien = nv.ten || nv.hoTen || '';
                const normalizedName = removeDiacritics(tenNhanVien.toLowerCase());
                return normalizedName.includes(normalizedKeyword);
            });
        } else {
            // Hiển thị tất cả nhân viên nếu không có từ khóa
            filteredReceivers = [...receiverList];
        }
        
        // Nếu không có kết quả
        if (filteredReceivers.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không tìm thấy nhân viên phù hợp</div>';
            return;
        }
        
        // Hiển thị kết quả
        filteredReceivers.forEach(nv => {
            const element = document.createElement('div');
            element.className = 'dropdown-item';
            element.dataset.id = nv.id || nv.maNV || '';
            element.dataset.name = nv.ten || nv.hoTen || '';
            
            // Format mã nhân viên
            let id = nv.id || nv.maNV || '';
            id = `NV${id.toString().padStart(8, '0')}`; // Thêm NV và các số 0 vào trước để đảm bảo đủ 10 ký tự
            
            // Highlight từ khóa tìm kiếm nếu có
            const name = nv.ten || nv.hoTen || '';
            if (normalizedKeyword.length > 0) {
                const normalizedName = removeDiacritics(name.toLowerCase());
                const start = normalizedName.indexOf(normalizedKeyword);
                if (start !== -1) {
                    const end = start + normalizedKeyword.length;
                    element.innerHTML = name.substring(0, start) + 
                    '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' + 
                    name.substring(end) + ` (${id})`;
                } else {
                    element.textContent = `${name} (${id})`;
                }
            } else {
                element.textContent = `${name} (${id})`;
            }
            
            // Xử lý khi chọn một nhân viên
            element.addEventListener('click', function() {
                const input = document.getElementById('receiverName');
                const hiddenInput = document.getElementById('receiverId'); // Nếu bạn muốn lưu ID người nhận
                const dropdown = this.closest('.receiver-dropdown');
                
                // Cập nhật giá trị
                input.value = this.dataset.name;
                if (hiddenInput) hiddenInput.value = this.dataset.id;
                dropdown.classList.remove('active');
            });
            
            resultsContainer.appendChild(element);
        });
    }
    // Hàm loại bỏ dấu tiếng Việt để tìm kiếm
    function removeDiacritics(str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    
    // Hàm tải danh sách nguyên liệu từ API
    async function loadInventoryData() {
        try {
            const response = await fetch('/api/kho-nguyen-lieu');
            if (!response.ok) throw new Error('Không thể tải danh sách nguyên liệu');
            
            // Lưu danh sách nguyên liệu vào biến toàn cục
            const data = await response.json();
            inventoryList = data.list;
            
            console.log('Đã tải thành công danh sách nguyên liệu:', inventoryList.length);
            
            // Khởi tạo dropdown
            initializeCustomDropdowns();
            
        } catch (error) {
            showToastDanger()
            console.error("Lỗi khi tải danh sách nguyên liệu:", error);
        }
    }
    
    // Khởi tạo dropdown tùy chỉnh
    function initializeCustomDropdowns() {
        document.querySelectorAll('.inventory-search').forEach(input => {
            if (!input.dataset.initialized) {
                setupInventorySearch(input);
                input.dataset.initialized = "true";
            }
        });
    }
    
    // Thiết lập tìm kiếm nguyên liệu
    function setupInventorySearch(input) {
        const container = input.closest('.custom-dropdown-container');
        const dropdown = container.querySelector('.inventory-dropdown');
        const resultsContainer = dropdown.querySelector('.dropdown-search-results');
        
        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            closeAllDropdowns();
            
            // Tính toán và đặt vị trí cho dropdown
            positionDropdownAbsolute(dropdown, input);
            
            // Hiển thị dropdown
            dropdown.classList.add('active');
            filterInventory(input.value, resultsContainer);
        });
        
        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            filterInventory(input.value, resultsContainer);
        });
        
        // Xử lý click bên ngoài để đóng dropdown
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Xử lý click vào dropdown arrow
        const arrow = container.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.addEventListener('click', function() {
                input.focus();
            });
        }
    }
    // Hàm tính toán vị trí chính xác cho dropdown
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
        const activeDropdown = document.querySelector('.inventory-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.inventory-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    }, true);

    // Cập nhật khi thay đổi kích thước cửa sổ
    window.addEventListener('resize', function() {
        const activeDropdown = document.querySelector('.inventory-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.inventory-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    });

    // Cập nhật khi cuộn trong table-responsive
    document.querySelectorAll('.table-responsive').forEach(table => {
        table.addEventListener('scroll', function() {
            const activeDropdown = document.querySelector('.inventory-dropdown.active');
            if (activeDropdown) {
                const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.inventory-search');
                if (input) {
                    positionDropdownAbsolute(activeDropdown, input);
                }
            }
        });
    });
    // Xử lý sự kiện khi nhấn nút tìm kiếm
    document.querySelector('.btn-timKiem').addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const minAmount = document.getElementById('minAmount').value;
            const maxAmount = document.getElementById('maxAmount').value;
            const response = await fetch(`/api/tim-kiem-phieu-xuat?startDate=${startDate}&endDate=${endDate}&minAmount=${minAmount}&maxAmount=${maxAmount}`);
            const data = await response.json();
            if(data.status){
               
                thaoTacVoiBang(data.list);
            }
            else{
                showToastDanger(data.error)
                console.error('Lỗi khi gọi API:', data.error);
                thaoTacVoiBang([]);
            }
        }
        catch (error) {
            showToastDanger()
            console.error('Lỗi khi gọi API:', error);
            thaoTacVoiBang([]);
        }
    })
    // Đặt lại tìm kiếm
    document.querySelector('.btn-datLai').addEventListener('click', function(e) {
        e.preventDefault();
        console.log(123)
        // Đặt lại giá trị của các input
        setDefaultDate();
        document.getElementById('minAmount').value = '';
        document.getElementById('maxAmount').value = '';
        thaoTacVoiBang(listPhieuXuat)
    })
    // Đóng tất cả dropdown đang mở
    function closeAllDropdowns() {
        document.querySelectorAll('.inventory-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    // Lọc danh sách nguyên liệu trong kho theo từ khóa tìm kiếm
    function filterInventory(keyword, resultsContainer) {
        // Xóa nội dung hiện tại
        resultsContainer.innerHTML = '';
        
        // Nếu không có từ khóa, hiển thị tất cả
        const normalizedKeyword = removeDiacritics(keyword.toLowerCase());
        
        // Lọc danh sách nguyên liệu
        const filteredInventory = normalizedKeyword.length > 0 
            ? inventoryList.filter(item => {
                const normalizedName = removeDiacritics(item.NguyenLieu.ten.toLowerCase());
                return normalizedName.includes(normalizedKeyword);
              })
            : inventoryList;
        
        // Nếu không có kết quả
        if (filteredInventory.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không tìm thấy nguyên liệu</div>';
            return;
        }
        
        // Hiển thị kết quả
        filteredInventory.forEach(item => {
            const element = document.createElement('div');
            element.className = 'dropdown-item';
            element.dataset.id = item.idNguyenLieu;
            element.dataset.idPhieuNhap = item.idPhieu || '';
            element.dataset.name = item.NguyenLieu.ten;
            element.dataset.unit = item.NguyenLieu.donVi || '';
            element.dataset.price = item.gia || '0';
            element.dataset.maxQuantity = item.soLuong || '0';
            
            // Highlight từ khóa tìm kiếm
            const name = item.NguyenLieu.ten;
            if (normalizedKeyword.length > 0) {
                const normalizedName = removeDiacritics(name.toLowerCase());
                const start = normalizedName.indexOf(normalizedKeyword);
                if (start !== -1) {
                    const end = start + normalizedKeyword.length;
                    element.innerHTML = name.substring(0, start) + 
                        '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' + 
                        name.substring(end);
                } else {
                    element.textContent = name;
                }
            } else {
                element.textContent = name;
            }
            
            // Xử lý khi chọn một nguyên liệu
            element.addEventListener('click', function() {
                const input = this.closest('.custom-dropdown-container').querySelector('.inventory-search');
                const hiddenInput = this.closest('.custom-dropdown-container').querySelector('.inventory-id');
                const hiddenInputIdPhieuNhap = this.closest('.custom-dropdown-container').querySelector('.id-phieuNhap');
                const dropdown = this.closest('.inventory-dropdown');
                
                // Cập nhật giá trị
                input.value = this.dataset.name;
                hiddenInput.value = this.dataset.id;
                hiddenInputIdPhieuNhap.value = this.dataset.idPhieuNhap;
                dropdown.classList.remove('active');
                
                // Cập nhật đơn vị và đơn giá
                const row = input.closest('.ingredient-row');
                const unitInput = row.querySelector('.unit-input');
                const priceInput = row.querySelector('.price-input');
                const quantityInput = row.querySelector('.quantity-input');
                
                if (unitInput && this.dataset.unit) {
                    // Đảm bảo input đơn vị hiển thị và được cập nhật
                    unitInput.style.display = '';
                    unitInput.value = this.dataset.unit;
                }
                
                if (priceInput && this.dataset.price) {
                    priceInput.value = formatCurrency(this.dataset.price);
                }
                
                if (quantityInput && this.dataset.maxQuantity) {
                    quantityInput.setAttribute('max', this.dataset.maxQuantity);
                    quantityInput.setAttribute('min', 0);
                    quantityInput.value = 1;
                }
                // Tính lại thành tiền
                calculateAmount(row);
            });
            
            resultsContainer.appendChild(element);
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
            if (input.classList.contains('inventory-search')) {
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
        
        // Đảm bảo input đơn vị hiển thị
        const unitInput = row.querySelector('.unit-input');
        if (unitInput) {
            unitInput.style.display = '';
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
        const quantity = parseInt(row.querySelector('.quantity-input').value) || 0;
        const price = parseInt(parseFormattedCurrency(row.querySelector('.price-input').value)) || 0;
        const amount = quantity * price;
        
        row.querySelector('.amount-cell').textContent = formatCurrency(amount);
        calculateTotal();
    }
    
    // Tính tổng tiền
    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const amountText = row.querySelector('.amount-cell').textContent;
            const amount = parseFormattedCurrency(amountText);
            total += amount;
        });
        
        const totalElement = document.getElementById('exportTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(total);
        }
    }
    

    // Hàm chuyển chuỗi tiền tệ thành số nguyên
    function parseFormattedCurrency(formattedValue) {
        // Loại bỏ tất cả các ký tự không phải số từ chuỗi
        const numericString = formattedValue.replace(/[^\d]/g, '');
        
        // Chuyển đổi chuỗi số thành số nguyên
        return parseInt(numericString) || 0;
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
    
    // Thêm hàm xử lý submit phiếu xuất
    async function submitPhieuXuat(e) {
        e.preventDefault();
        
        try {
            // Trong hàm submitPhieuXuat - cập nhật phần lấy thông tin người nhận
            const phieuXuat = {
                thoiGianXuat: new Date().toISOString(),
                tongTien: parseInt(document.getElementById('exportTotalAmount')?.textContent.replace(/[^\d]/g, '')) || 0,
                idNguoiNhan: document.getElementById('receiverId')?.value || null, // Thêm id người nhận nếu cần
                lyDoXuat: document.getElementById('exportReason')?.value || '',
                chiTiet: [] // Chi tiết các nguyên liệu
            };
            // Kiểm tra xem có nguyên liệu nào không              
            // Lặp qua tất cả các hàng để lấy thông tin chi tiết
            const rows = document.querySelectorAll('.ingredient-row');
            let hasError = false;
            
            rows.forEach((row, index) => {
                const inventoryId = row.querySelector('.inventory-id')?.value;
                const idPhieuNhap = row.querySelector('.id-phieuNhap')?.value;
                const inventoryName = row.querySelector('.inventory-search')?.value;
                const quantity = parseFloat(row.querySelector('.quantity-input')?.value) || 0;
                const note = row.querySelector('.note-input')?.value || '';
                
                // Kiểm tra dữ liệu hợp lệ
                if (!inventoryId || !inventoryName) {
                    alert(`Vui lòng chọn nguyên liệu ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!quantity || quantity <= 0) {
                    alert(`Vui lòng nhập số lượng hợp lệ ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                
                // Thêm chi tiết vào phiếu xuất
                phieuXuat.chiTiet.push({
                    idNguyenLieu: inventoryId,
                    idPhieuNhap: idPhieuNhap,
                    soLuong: quantity,
                    ghiChu: note
                });
            });
            console.log('Chi tiết phiếu xuất:', phieuXuat);
            // Kiểm tra lý do xuất
            if (!phieuXuat.lyDoXuat) {
                alert('Vui lòng nhập lý do xuất kho');
                hasError = true;
            }
            
            // Nếu có lỗi, dừng việc gửi API
            if (hasError) {
                return;
            }
            
            // Gọi API để tạo phiếu xuất
            const response = await fetch('/api/phieu-xuat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(phieuXuat)
            });
            
            const data = await response.json();
            if (data.status){
                // Reset form hoặc đóng modal
                showToastSuccess("Tạo phiếu xuất thành công!")
                const modal = bootstrap.Modal.getInstance(document.getElementById('addExportModal'));
                if (modal) {
                    modal.hide();
                }
                listPhieuXuat.unshift(data.obj)
                thaoTacVoiBang(listPhieuXuat)
                resetPhieuXuatForm();
            }
            else {
                showToastDanger(data.error)
                console.error('Lỗi khi tạo phiếu xuất:', data.error);
            }
            
        } catch (error) {
            showToastDanger()
            console.error('Lỗi khi tạo phiếu xuất:', error);
            alert('Lỗi khi tạo phiếu xuất: ' + error.message);
        }
    }

    // Hàm reset form phiếu xuất
    function resetPhieuXuatForm() {
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
                if (input.classList.contains('inventory-search')) {
                    input.removeAttribute('data-initialized');
                }
            });
            
            // Reset thành tiền
            const amountCell = firstRow.querySelector('.amount-cell');
            if (amountCell) amountCell.textContent = '0đ';
            
            // Reset ghi chú
            const noteInput = firstRow.querySelector('.note-input');
            if (noteInput) noteInput.value = '';
            
            // Reset select boxes nếu có
            firstRow.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Reset STT
            const sttCell = firstRow.querySelector('td:first-child');
            if (sttCell) sttCell.textContent = '1';
        }
        
        // Reset các trường thông tin khác
        document.getElementById('receiverName').value = '';
        document.getElementById('exportReason').value = '';
        
        // Reset tổng tiền
        const totalElement = document.getElementById('exportTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(0);
        }
        
        // Khởi tạo lại dropdown
        initializeCustomDropdowns();
    }
});
async function getAPIPhieuXuat() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    try{
        const response = await fetch(`/api/phieu-xuat?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        if(data.status){
            return data.list;
        }
        else{
            console.error('Lỗi khi gọi API:', data.error);
            return []
        }
    }
    catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return []
    }
}
function thaoTacVoiBang(list){
    const tableBody = document.querySelector('.table-danhSach tbody');
    tableBody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
    if(list.length > 0){
        list.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.idNhanVien ? item.NhanVien.ten : 'Không có'}</td>
                <td>${formatDate(new Date(item.thoiGianXuat))}</td>
                <td>${formatCurrency(item.tongTien)}</td>
                <td>
                    <button class="btn btn-sm btn-info btn-xem text-white" 
                        data-bs-toggle="modal"
                        data-bs-target="#viewExportModal"
                        data-bs-tooltip="tooltip"
                        data-id = "${item.id}"
                        title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
    else{
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="text-center">Không tìm thấy phiếu xuất kho</td>
        `;
        tableBody.appendChild(row);
    }
    // Khởi tạo tooltips
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    // Gắn sự kiện cho nút xem chi tiết
    document.querySelectorAll('.btn-xem').forEach(button => {
        button.addEventListener('click', async function() {
            const id = this.dataset.id;
            const phieuXuat = list.find(item => item.id == id);
            document.getElementById('viewExportReason').innerHTML = phieuXuat.lyDo
            document.getElementById('viewExportDate').innerHTML = formatDate(new Date(phieuXuat.thoiGianXuat))
            document.getElementById('viewReceiverName').innerHTML = phieuXuat.idNhanVien ? phieuXuat.NhanVien.ten : 'Không có'
            document.getElementById('viewTotalAmount').innerHTML = formatCurrency(phieuXuat.tongTien)
            const listNguyenLieu = await getAPINguyenLieuByIdPhieu(id);
            renderNguyenLieuPhieuXuat(listNguyenLieu);
        });
    });
}
function renderNguyenLieuPhieuXuat(list){
    const tableBody = document.getElementById('viewExportDetails')
    tableBody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
    list.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.ChiTietPhieuNhap.NguyenLieu.ten}</td>
            <td>${item.ChiTietPhieuNhap.NguyenLieu.donVi}</td>
            <td>${item.soLuong}</td>
            <td>${formatCurrency(item.ChiTietPhieuNhap.gia)}</td>
            <td>${formatCurrency(item.ChiTietPhieuNhap.gia * item.soLuong)}</td>
            <td>${item.ghiChu || 'N/A'}</td>
        `;
        tableBody.appendChild(row);
    })
}
async function getAPINguyenLieuByIdPhieu(id){
    try{
        const response = await fetch(`/api/chi-tiet-phieu-xuat?id=${id}`);
        const data = await response.json();
        if(data.status){
            return data.list;
        }
        else{
            console.error('Lỗi khi gọi API:', data.error);
            return []
        }
    }
    catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return []
    }
}
function formatDate (date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
};

function setDefaultDate(){
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput && endDateInput) {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
        endDateInput.value = today.toISOString().split('T')[0];
    }
}
// Format số tiền
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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