document.addEventListener('DOMContentLoaded', async function() {
    // Khởi tạo các biến
    let khachHang = await getAPIThongTinKhachHang();
    let provinces = [];
    let districts = [];
    let wards = [];
    let streets = [];

    hienThiThongTinKhachHang(khachHang);
    const profileForm = document.getElementById('profileForm');
    const avatarForm = document.getElementById('avatarForm');
    const avatarInput = document.getElementById('profileAvatarInput');
    const changeAvatarModal = new bootstrap.Modal(document.getElementById('changeAvatarModal'));
    
    // Xử lý khi chọn ảnh đại diện mới
    avatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('avatarPreview').innerHTML = `
                    <img src="${e.target.result}" alt="Ảnh đại diện" class="rounded-circle img-thumbnail" style="width: 150px; height: 150px; object-fit: cover;" id="avatarPreview">
                `;
            }
            reader.readAsDataURL(file);
        }
    });

    // Kiểm tra tên
    function validateName(name) {
        const fullNameInput = document.getElementById('profileFullName')
        const errorMessage = fullNameInput.closest('.input-group').nextElementSibling
        errorMessage.innerHTML = '&nbsp;'
        if (!name || name.trim() === '') {
            const message = 'Vui lòng nhập họ và tên'
            errorMessage.innerHTML = message
            return message;
        }
        return null;
    }

    // Kiểm tra ngày sinh
    function validateBirthday(birthday) {
        const birthdayInput = document.getElementById('profileBirthday')
        const errorMessage = birthdayInput.closest('.input-group').nextElementSibling
        errorMessage.innerHTML = '&nbsp;'
        if (birthday) {
            const today = new Date();
            const birthDate = new Date(birthday);
            
            if (birthDate > today) {
                const message = 'Ngày sinh không thể lớn hơn ngày hiện tại';
                errorMessage.innerHTML = message
                return message
            }
            
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 10) {
                const message = 'Bạn phải từ 10 tuổi trở lên';;
                errorMessage.innerHTML = message
                return message
            }
        }
        return null;
    }

    // Kiểm tra số điện thoại
    async function validatePhone(phone) {
        const phoneInput = document.getElementById('profilePhone')
        const errorMessage = phoneInput.closest('.input-group').nextElementSibling
        errorMessage.innerHTML = '&nbsp;'
        if (phone) {
            const phoneRegex = /^(0[3-9][0-9]{8})$/;
            if (!phoneRegex.test(phone)) {
                const message = 'Số điện thoại không hợp lệ.';
                errorMessage.innerHTML = message
                return message
            }
            try {
                const response = await fetch('/api/kiem-tra-so-dien-thoai-khach-hang-cap-nhat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ soDienThoai: phone })
                });
                const data = await response.json();
                if (data.status) {
                    const message = 'Số điện thoại đã tồn tại.';
                    errorMessage.innerHTML = message
                    return message
                }
            }
            catch (error) {
                console.error('Lỗi khi kiểm tra số điện thoại:', error);
                const message = 'Đã xảy ra lỗi khi kiểm tra số điện thoại.';
                errorMessage.innerHTML = message
                return message
            }
        }
        return null;
    }

    // Kiểm tra email
    async function validateEmail(email) {
        const emailInput = document.getElementById('profileEmail')
        const errorMessage = emailInput.closest('.input-group').nextElementSibling
        errorMessage.innerHTML = '&nbsp;'
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                const message = 'Email không hợp lệ.';
                errorMessage.innerHTML = message
                return message
            }
            try{
                const response = await fetch('/api/kiem-tra-email-khach-hang-cap-nhat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                if (data.status) {
                    const message = 'Email đã tồn tại.';
                    errorMessage.innerHTML = message
                    return message
                }
            }
            catch (error) {
                console.error('Lỗi khi kiểm tra email:', error);
                const message = 'Đã xảy ra lỗi khi kiểm tra email.';
                errorMessage.innerHTML = message
                return message
            }
        }
        return null;
    }

    // Kiểm tra địa chỉ
    async function validateAddress(province, district, ward, street) {
        const provinceInput = document.getElementById('profileProvince')
        const districtInput = document.getElementById('profileDistrict')
        const wardInput = document.getElementById('profileWard')
        const streetInput = document.getElementById('profileStreet')
        const errorMessageProvince = provinceInput.closest('.input-group').nextElementSibling
        const errorMessageDistrict = districtInput.closest('.input-group').nextElementSibling
        const errorMessageWard = wardInput.closest('.input-group').nextElementSibling
        const errorMessageStreet = streetInput.closest('.input-group').nextElementSibling
        errorMessageProvince.innerHTML = '&nbsp;'
        errorMessageDistrict.innerHTML = '&nbsp;'
        errorMessageWard.innerHTML = '&nbsp;'
        errorMessageStreet.innerHTML = '&nbsp;'
        // Kiểm tra tinh/thành phố hợp lệ
        provinces = await loadProvinces()
        if(province && provinces.findIndex(item => item.name == province) == -1){
            const message = 'Tỉnh/Thành phố không hợp lệ';
            errorMessageProvince.innerHTML = message
            return message
        }
        // Kiểm tra nếu có tỉnh/thành phố thì phải có quận/huyện
        districts = province ? await loadDistricts(provinces.find(item => item.name == province).id) : []
        if (province && !district) {
            const message = 'Vui lòng chọn quận/huyện';
            errorMessageDistrict.innerHTML = message
            return message
        }
        else if (district && districts.findIndex(item => item.name == district) == -1 && districts.length > 0){
            const message = 'Quận/Huyện không hợp lệ';
            errorMessageDistrict.innerHTML = message
            return message
        }
        
        // Kiểm tra nếu có quận/huyện thì phải có xã/phường
        wards = district ? await loadWards(districts.find(item => item.name == district).id) : []
        if (!ward && district) {
            const message = 'Vui lòng chọn xã/phường';
            errorMessageWard.innerHTML = message
            return message
        }
        else if (ward && wards.findIndex(item => item.name == ward) == -1 && wards.length > 0){
            const message = 'Xã/Phường không hợp lệ';
            errorMessageWard.innerHTML = message
            return message
        }
        
        // Kiểm tra địa chỉ chi tiết có chứa lat,lng
        streets = ward && street ? await loadStreet(provinceInput, districtInput, wardInput, streetInput) : []
        if (ward && !street) {
            return 'Vui lòng chọn số nhà/đường';
        }
        else if (street && ward) {
            const indexStreet = streets.findIndex(item => item.name == street)
            if (indexStreet == -1) {
                const message = 'Địa chỉ không hợp lệ. Vui lòng chọn địa chỉ từ danh sách gợi ý';
                errorMessageStreet.innerHTML = message
                return message
            }
            else{

                const location = streets[indexStreet].location
                const streetInput = document.getElementById('profileStreet')
                if(location.lat != streetInput.dataset.lat || location.lng != streetInput.dataset.lng){
                    const message = 'Địa chỉ không hợp lệ. Vui lòng chọn địa chỉ từ danh sách gợi ý';
                    errorMessageStreet.innerHTML = message
                    streetInput.dataset.lat = ''
                    streetInput.dataset.lng = ''
                    return message
                }
            }
        }
        return null
    }

    // Xử lý khi submit form cập nhật thông tin
    profileForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Lấy dữ liệu từ các input
        const fullName = document.getElementById('profileFullName').value;
        const gender = document.getElementById('profileGender').value;
        const birthday = document.getElementById('profileBirthday').value;
        const phone = document.getElementById('profilePhone').value;
        const email = document.getElementById('profileEmail').value;
        const province = document.getElementById('profileProvince').value;
        const district = document.getElementById('profileDistrict').value;
        const ward = document.getElementById('profileWard').value;
        const street = document.getElementById('profileStreet').value;
        const streetInput = document.getElementById('profileStreet');
        
        // Kiểm tra dữ liệu
        const nameError = validateName(fullName);
        const birthdayError = validateBirthday(birthday);
        const phoneError = await validatePhone(phone);
        const emailError = await validateEmail(email);
        const addressError = await validateAddress(province, district, ward, street);
        
        if (nameError || birthdayError || phoneError || emailError || addressError) {
            return;
        }
        
        try {
            // Chuẩn bị dữ liệu gửi đi
            const data = {
                fullName,
                gender,
                birthday,
                phone,
                email,
                address: {
                    province,
                    district,
                    ward,
                    street,
                    lat: streetInput.dataset.lat || '',
                    lng: streetInput.dataset.lng || ''
                }
            };
            
            // Gửi request cập nhật thông tin
            const response = await fetch('/api/cap-nhat-thong-tin-khach-hang', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if(result.status){
                hienThiThongTinKhachHang(result.khachHang);
                document.querySelector('#userDropdown span').textContent = result.khachHang.ten
                showToastPrimary("Cập nhật thông tin cá nhân thành công")
            }
            else{
                showToastDanger(result.error);
                console.error('Lỗi khi cập nhật thông tin:', result.error);
            }
        } catch (error) {
            showToastDanger("Lỗi cập nhật thông tin cá nhân")
            console.error('Lỗi khi cập nhật thông tin:', error);
            
        }
    });
    // Xử lý xác thực email
    document.getElementById('verifyEmailForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const emailCode = document.getElementById('emailVerificationCode').value;
        const email = document.getElementById('emailToVerify').textContent;
        try{
            const response = await fetch('/api/xac-thuc-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, emailCode })
            });
            const data = await response.json();
            if(data.status){
                document.getElementById('profileEmail').nextElementSibling.remove();
                document.getElementById('profileEmail').insertAdjacentHTML('afterend', `
                    <div class="d-flex align-items-center p-2 bg-light">
                        <span class="text-success">Đã xác thực</span>
                    </div>
                `);
                const verifyEmailModal = bootstrap.Modal.getInstance(document.getElementById('verifyEmailModal'));
                verifyEmailModal.hide();
                this.reset();
                showToastSuccess("Xác thực email thành công")
            }
            else{
                showToastDanger(data.error);
                console.error(data.error);
            }
        }
        catch (error) {
            showToastDanger("Lỗi xác thực email")
            console.error('Lỗi xác thực email:', error);
        }
    })
    // Xử lý xác thực số điện thoại
    document.getElementById('verifyPhoneForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const maXacThuc = document.getElementById('verificationCode').value;
        const soDienThoai = document.getElementById('phoneToVerify').textContent;
        try{
            const response = await fetch('/api/xac-thuc-so-dien-thoai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ soDienThoai, maXacThuc })
            });
            const data = await response.json();
            if(data.status){
                document.getElementById('profilePhone').nextElementSibling.remove();
                document.getElementById('profilePhone').insertAdjacentHTML('afterend', `
                    <div class="d-flex align-items-center p-2 bg-light">
                        <span class="text-success">Đã xác thực</span>
                    </div>
                `);
                const verifyPhoneModal = bootstrap.Modal.getInstance(document.getElementById('verifyPhoneModal'));
                verifyPhoneModal.hide();
                this.reset();
                showToastSuccess("Xác thực số điện thoại thành công")
            }
            else{
                showToastDanger(data.error);
                console.error(data.error);
            }
        }
        catch (error) {
            showToastDanger("Lỗi xác thực số điện thoại")
            console.error('Lỗi xác thực số điện thoại:', error);
        }
    })
    // Xử lý khi submit form cập nhật ảnh đại diện
    avatarForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hiển thị spinner và disable nút submit
        const submitBtn = this.querySelector('button[type="submit"]');
        const spinner = submitBtn.querySelector('.spinner-border');
        const btnText = submitBtn.querySelector('.btn-text');
        spinner.classList.remove('d-none');
        btnText.textContent = 'Đang tải lên...';
        submitBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('hinhAnh', document.getElementById('profileAvatarInput').files[0]);
        try {
            const response = await fetch('/api/cap-nhat-anh-dai-dien', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if(data.status){
                document.getElementById('profileAvatar').innerHTML = `
                    <img src="${data.hinhAnh}" alt="Ảnh đại diện" class="rounded-circle img-thumbnail" style="width: 150px; height: 150px; object-fit: cover;">
                `;
                document.getElementById('avatarPreview').innerHTML = `
                    <img src="${data.hinhAnh}" alt="Ảnh đại diện" class="rounded-circle img-thumbnail" style="width: 150px; height: 150px; object-fit: cover;" id="avatarPreview">
                `;
                if(document.querySelector('#userDropdown i')){
                    document.querySelector('#userDropdown i').remove()
                    document.getElementById('userDropdown').insertAdjacentHTML('afterbegin', `
                        <img src='${data.hinhAnh}' alt="Avatar" class="avatar-img">
                    `);
                }
                else{
                    document.querySelector('#userDropdown img').src = data.hinhAnh
                }
                
                showToastPrimary("Cập nhật ảnh đại diện thành công");
                // Đóng modal
                changeAvatarModal.hide();
                // Reset form
                avatarForm.reset();
                spinner.classList.add('d-none');
                btnText.textContent = '';
                submitBtn.disabled = false;
            }
            else {
                // Hiển thị thông báo lỗi
                showToastDanger(data.error);
            }
        } catch (error) {
            // Hiển thị thông báo lỗi
            showToastDanger("Lỗi cập nhật ảnh đại diện");
            console.error('Lỗi khi cập nhật ảnh đại diện:', error);
        } finally {
            // Ẩn spinner và enable lại nút submit
            spinner.classList.add('d-none');
            btnText.textContent = 'Lưu ảnh';
            submitBtn.disabled = false;
        }
    });

    // Xử lý nút gửi lại mã
    const resendCodeBtn = document.getElementById('resendCode');
    if(resendCodeBtn) {
        resendCodeBtn.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/gui-ma-xac-thuc', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ soDienThoai: document.getElementById('phoneToVerify').textContent })
                });
                
                const data = await response.json();
                if(data.status) {
                    // Reset đếm ngược
                    startCountdown();
                    // Ẩn nút gửi lại
                    this.classList.add('d-none');
                } else {
                    showToastDanger(data.error); // Hiển thị thông báo lỗi;
                }
            } catch (error) {
                showToastDanger("Lỗi gửi mã xác thực");
                console.error('Error:', error);
            }
        });
    }
    // Xử lý nút xác thực email
    const resendCodeBtnEmail = document.getElementById('resendCodeEmail');
    if(resendCodeBtnEmail) {
        resendCodeBtnEmail.addEventListener('click', async function() {
            try {
                const response = await fetch('/api/gui-ma-xac-thuc-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: document.getElementById('emailToVerify').textContent })
                });
                
                const data = await response.json();
                if(data.status) {
                    // Reset đếm ngược
                    startCountdownEmail();
                    // Ẩn nút gửi lại
                    this.classList.add('d-none');
                } else {
                    showToastDanger(data.error); // Hiển thị thông báo lỗi;
                }
            } catch (error) {
                showToastDanger("Lỗi gửi mã xác thực");
                console.error('Error:', error);
            }
        });
    }
    // Xử lý dropdown địa chỉ
    const provinceInput = document.getElementById('profileProvince');
    const districtInput = document.getElementById('profileDistrict');
    const wardInput = document.getElementById('profileWard');
    const streetInput = document.getElementById('profileStreet');
    const provinceDropdown = document.getElementById('provinceDropdown');
    const districtDropdown = document.getElementById('districtDropdown');
    const wardDropdown = document.getElementById('wardDropdown');
    const streetDropdown = document.getElementById('streetDropdown');

    // Mặc định disable các trường phụ thuộc khi trang được tải
    districtInput.disabled = true;
    wardInput.disabled = true;
    streetInput.disabled = true;

    // Hiển thị dropdown với xử lý disable
    function showDropdown(input, dropdown, items, onSelect) {
        const searchText = input.value.toLowerCase();
        const searchTextNoAccent = removeVietnameseAccent(searchText);
        
        // Lọc các item phù hợp (so sánh cả chuỗi có dấu và không dấu)
        const filteredItems = searchText ? items.filter(item => 
            item.name.toLowerCase().includes(searchText) || 
            removeVietnameseAccent(item.name).includes(searchTextNoAccent)
        ) : items;

        dropdown.innerHTML = '';
        
        filteredItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            
            // Highlight kết quả tìm kiếm
            if (searchText) {
                // Tạo regex để tìm kiếm không phân biệt dấu
                const pattern = searchText.split('').map(char => {
                    const accentChar = removeVietnameseAccent(char);
                    return `[${char}${accentChar}]`;
                }).join('.*?');
                
                const regex = new RegExp(`(${pattern})`, 'i');
                const highlightedText = item.name.replace(regex, '<span class="text-primary fw-bold">$1</span>');
                div.innerHTML = highlightedText;
            } else {
                div.textContent = item.name;
            }
            
            div.onclick = () => {
                input.value = item.name;
                input.dataset.id = item.id; // Lưu ID vào dataset để sử dụng sau này
                dropdown.classList.remove('show');
                onSelect(item);
            };
            dropdown.appendChild(div);
        });

        if (filteredItems.length > 0) {
            dropdown.classList.add('show');
        } else {
            dropdown.classList.remove('show');
        }
    }
    // Hàm hiển thị dropdown riêng cho đường/số nhà
    function showStreetDropdown(input, dropdown, items) {
        dropdown.innerHTML = '';
        
        if (items.length === 0) {
            dropdown.classList.remove('show');
            return;
        }
        
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'dropdown-item';
            
            // Hiển thị địa chỉ đầy đủ trong dropdown
            div.innerHTML = `
                <div class="d-flex flex-column">
                    <span class="fw-bold">${item.address}</span>
                    <small class="text-muted">${item.name}</small>
                </div>
            `;
            
            div.onclick = () => {
                // Khi chọn một item, đặt giá trị vào input là tên (name)
                input.value = item.name;
                
                // Lưu thêm dữ liệu vị trí vào dataset
                if (item.location) {
                    input.dataset.lat = item.location.lat;
                    input.dataset.lng = item.location.lng;
                }
                
                dropdown.classList.remove('show');
            };
            
            dropdown.appendChild(div);
        });
        
        dropdown.classList.add('show');
    }
    // Xử lý sự kiện cho input tỉnh/thành phố
    provinceInput.addEventListener('input', () => {
        // Nếu xóa tỉnh/thành phố, disable và xóa các trường con
        if (provinceInput.value.trim() === '') {
            districtInput.value = '';
            wardInput.value = '';
            streetInput.value = '';
            districtInput.disabled = true;
            wardInput.disabled = true;
            streetInput.disabled = true;
            districts = [];
            wards = [];
        }
        
        showDropdown(provinceInput, provinceDropdown, provinces, async (province) => {
            // Khi chọn tỉnh/thành phố, enable quận/huyện nhưng disable các trường nhỏ hơn
            districtInput.value = '';
            wardInput.value = '';
            streetInput.value = '';
            districtInput.disabled = false;
            wardInput.disabled = true;
            streetInput.disabled = true;
            districts = await loadDistricts(province.id);
        });
    });

    // Xử lý sự kiện cho input quận/huyện
    districtInput.addEventListener('input', () => {
        // Nếu xóa quận/huyện, disable và xóa các trường con
        if (districtInput.value.trim() === '') {
            wardInput.value = '';
            streetInput.value = '';
            wardInput.disabled = true;
            streetInput.disabled = true;
            wards = [];
        }
        
        showDropdown(districtInput, districtDropdown, districts, async (district) => {
            // Khi chọn quận/huyện, enable xã/phường nhưng disable số nhà
            wardInput.value = '';
            streetInput.value = '';
            wardInput.disabled = false;
            streetInput.disabled = true;
            wards = await loadWards(district.id);
        });
    });

    // Xử lý sự kiện cho input xã/phường
    wardInput.addEventListener('input', () => {
        // Nếu xóa xã/phường, disable số nhà
        if (wardInput.value.trim() === '') {
            streetInput.value = '';
            streetInput.disabled = true;
        }
        
        showDropdown(wardInput, wardDropdown, wards, (ward) => {
            // Khi chọn xã/phường, enable số nhà
            streetInput.disabled = false;
        });
    });
    // Cập nhật sự kiện input cho trường số nhà/đường
    streetInput.addEventListener('input', async () => {
        const searchText = streetInput.value.toLowerCase().trim();
        
        // Chỉ hiện dropdown khi người dùng đã nhập ít nhất 2 ký tự
        if (searchText.length >= 1) {
            streets = await loadStreet(provinceInput, districtInput, wardInput, streetInput);
            
            // Hiển thị dropdown với thông tin chi tiết hơn
            showStreetDropdown(streetInput, streetDropdown, streets);
        } else {
            streetDropdown.classList.remove('show');
        }
    });
    
    // Thêm sự kiện focus cho input tỉnh/thành phố
    provinceInput.addEventListener('focus', async () => {
        if (provinces.length === 0) {
            provinces = await loadProvinces();
        }
        showDropdown(provinceInput, provinceDropdown, provinces, async (province) => {
            // Enable district input khi đã chọn province
            districtInput.disabled = false;
            wardInput.disabled = true;
            streetInput.disabled = true;
            districts = await loadDistricts(province.id);
        });
    });

    // Thêm sự kiện focus cho input quận/huyện
    districtInput.addEventListener('focus', () => {
        if (!districtInput.disabled && districts.length > 0) {
            showDropdown(districtInput, districtDropdown, districts, async (district) => {
                // Enable ward input khi đã chọn district
                wardInput.disabled = false;
                streetInput.disabled = true;
                wards = await loadWards(district.id);
            });
        }
    });

    // Thêm sự kiện focus cho input xã/phường
    wardInput.addEventListener('focus', () => {
        if (!wardInput.disabled && wards.length > 0) {
            showDropdown(wardInput, wardDropdown, wards, (ward) => {
                // Enable street input khi đã chọn ward
                streetInput.disabled = false;
            });
        }
    });
    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-group')) {
            provinceDropdown.classList.remove('show');
            districtDropdown.classList.remove('show');
            wardDropdown.classList.remove('show');
        }
    });
});
// Lấy thông tin khách hàng từ cookie
async function getAPIThongTinKhachHang(){
    try{
        const response = await fetch('/api/lay-thong-tin-khach-hang');
        const data = await response.json();
        if(data.status){
            return data.khachHang;
        }
        else{
            window.location.href = '/dang-xuat';
        }
    }
    catch (error) {
        console.error('Lỗi khi lấy thông tin khách hàng:', error);
        return {}
    }
}
// Lấy danh sách tỉnh/thành phố
async function loadProvinces() {
    try {
        const response = await fetch('https://provinces.open-api.vn/api/p/');
        if(!response.ok){
            throw new Error('Không thể tải danh sách tỉnh/thành phố');
        }
        const data = await response.json();
        provinces = data.map(province => ({
            id: province.code,
            name: province.name
        }));
        return provinces;
    } catch (error) {
        console.error('Lỗi khi tải danh sách tỉnh/thành phố:', error);
        return {};
    }
}

// Lấy danh sách quận/huyện theo tỉnh/thành phố
async function loadDistricts(provinceId) {
    try {
        const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceId}?depth=2`);
        if(!response.ok){
            throw new Error('Không thể tải danh sách quận/huyện');
        }
        const data = await response.json();
        districts = data.districts.map(district => ({
            id: district.code,
            name: district.name
        }));
        return districts;
    } catch (error) {
        console.error('Lỗi khi tải danh sách quận/huyện:', error);
        return [];
    }
}

// Lấy danh sách xã/phường theo quận/huyện
async function loadWards(districtId) {
    try {
        const response = await fetch(`https://provinces.open-api.vn/api/d/${districtId}?depth=2`);
        if(!response.ok){
            throw new Error('Không thể tải danh sách xã/phường');
        }
        const data = await response.json();
        wards = data.wards.map(ward => ({
            id: ward.code,
            name: ward.name
        }));
        return wards;
    } catch (error) {
        console.error('Lỗi khi tải danh sách xã/phường:', error);
        return [];
    }
}
async function loadStreet(provinceInput, districtInput, wardInput, streetInput) {
    const province = provinceInput.value;
    const district = districtInput.value;
    const ward = wardInput.value;
    const street = streetInput.value;
    
    try {
        // Tạo địa chỉ tìm kiếm từ thông tin đã nhập
        const diaChi = street ? 
            `${street}, ${ward}, ${district}, ${province}` : 
            `${ward}, ${district}, ${province}`;
            
        // Gửi yêu cầu đến API Map4D
        const url = `https://api-app.map4d.vn/map/v2/search/place?text=${encodeURIComponent(diaChi)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Không thể tải danh sách đường');
        }
        
        const data = await response.json();
        
        if (data.code === 'ok' && data.result && data.result.data) {
            // Chuyển đổi kết quả từ API thành định dạng phù hợp để hiển thị trong dropdown
            const streets = data.result.data.map(item => ({
                id: item.id,
                name: item.name,
                address: item.address
                    .replace(/Phường\s+Phường/g, 'Phường')
                    .replace(/Xã\s+Xã/g, 'Xã'),
                location: item.location
            }));
            
            return streets;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi tải danh sách đường:', error);
        return [];
    }
}
function hienThiThongTinKhachHang(khachHang){
    document.getElementById('profileFullName').value = khachHang.ten;
    document.getElementById('profileId').textContent = `ID: #${khachHang.id}`;
    document.getElementById('profileName').textContent = khachHang.ten;
    document.getElementById('profileGender').value = khachHang.gioiTinh ? khachHang.gioiTinh : '';
    document.getElementById('profileBirthday').value = khachHang.ngaySinh ? khachHang.ngaySinh : '';
    document.getElementById('profileEmail').value = khachHang.email ? khachHang.email : '';
    if(khachHang.email){
        if (document.getElementById('profileEmail').nextElementSibling) {
            document.getElementById('profileEmail').nextElementSibling.remove();
        }
        document.getElementById('profileEmail').insertAdjacentHTML('afterend', khachHang.emailDaXacThuc == 0 ? 
            `
                <button type="button" class="btn btn-outline-danger" id="btnVerifyEmail" data-bs-toggle="modal" data-bs-target="#verifyEmailModal">
                    Xác thực
                </button>
            `
            :
            `
               <div class="d-flex align-items-center p-2 bg-light">
                    <span class="text-success">Đã xác thực</span>
                </div>
            `
        )
    }
    document.getElementById('profilePhone').value = khachHang.soDienThoai ? khachHang.soDienThoai : '';
    if(khachHang.soDienThoai){
        if (document.getElementById('profilePhone').nextElementSibling) {
            document.getElementById('profilePhone').nextElementSibling.remove();
        }
        document.getElementById('profilePhone').insertAdjacentHTML('afterend', khachHang.soDaXacThuc == 0 ? 
            `
                <button type="button" class="btn btn-outline-danger" id="btnVerifyPhone" data-bs-toggle="modal" data-bs-target="#verifyPhoneModal">
                    Xác thực
                </button>
            `
            :
            `
                <div class="d-flex align-items-center p-2 bg-light">
                    <span class="text-success">Đã xác thực</span>
                </div>
            `
        )
    }
    if(khachHang.hinhAnh){
        document.getElementById('profileAvatar').innerHTML = `
            <img src="${khachHang.hinhAnh}" alt="Ảnh đại diện" class="rounded-circle img-thumbnail" style="width: 150px; height: 150px; object-fit: cover;">
        `;
        document.getElementById('avatarPreview').innerHTML = `
            <img src="${khachHang.hinhAnh}" alt="Ảnh đại diện" class="rounded-circle img-thumbnail" style="width: 150px; height: 150px; object-fit: cover;" id="avatarPreview">
        `;
    }
    khachHang.diaChi = khachHang.diaChi ? JSON.parse(khachHang.diaChi) : {};
    document.getElementById('profileProvince').value = khachHang.diaChi.province ?  khachHang.diaChi.province : '';
    document.getElementById('profileDistrict').value = khachHang.diaChi.district ?  khachHang.diaChi.district : '';
    document.getElementById('profileWard').value = khachHang.diaChi.ward ?  khachHang.diaChi.ward : '';
    document.getElementById('profileStreet').value = khachHang.diaChi.street ?  khachHang.diaChi.street : '';
    document.getElementById('profileStreet').dataset.lat = khachHang.diaChi.lat ?  khachHang.diaChi.lat : '';
    document.getElementById('profileStreet').dataset.lng = khachHang.diaChi.lat ?  khachHang.diaChi.lng : '';

    const btnVerifyEmail = document.getElementById('btnVerifyEmail');
    if (btnVerifyEmail) {
        btnVerifyEmail.addEventListener('click', async function() {
            document.getElementById('emailToVerify').innerHTML = document.getElementById('profileEmail').value;
            startCountdownEmail();
            try{
                const res = await fetch('/api/gui-ma-xac-thuc-email', {

                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: document.getElementById('profileEmail').value })
                });
                const data = await res.json();
                if(!data.status){
                    showToastDanger(data.error);
                    console.error(data.error);
                }
            }
            catch (error) {
                showToastDanger("Lỗi gửi mã xác thực email")
                console.error('Lỗi gửi mã xác thực email:', error);
            }
        });
    }
    const btnVerifyPhone = document.getElementById('btnVerifyPhone');
    if (btnVerifyPhone) {
        btnVerifyPhone.addEventListener('click', async function() {
            document.getElementById('phoneToVerify').innerHTML = document.getElementById('profilePhone').value;
            startCountdown();
            try{
                const res = await fetch('/api/gui-ma-xac-thuc', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ soDienThoai: document.getElementById('profilePhone').value })
                });
                const data = await res.json();
                if(!data.status){
                    showToastDanger(data.error);
                    console.error(data.error);
                }
            }
            catch (error) {
                showToastDanger("Lỗi gửi mã xác thực số điện thoại")
                console.error('Lỗi gửi mã xác thực số điện thoại:', error);
            }
        })
    }

}
function removeVietnameseAccent(str) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}
// Hàm đếm ngược
function startCountdown() {
    let timeLeft = 120; // 2 phút
    const countdownElement = document.getElementById('countdown');
    const resendBtn = document.getElementById('resendCode');
    
    // Hiển thị nút gửi lại
    resendBtn.classList.add('d-none');
    
    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            resendBtn.classList.remove('d-none');
        }
        
        timeLeft--;
    }, 1000);
}
function startCountdownEmail() {
    let timeLeft = 120; // 2 phút
    const countdownElement = document.getElementById('emailCountdown');
    const resendBtn = document.getElementById('resendEmailCode');
    
    // Hiển thị nút gửi lại
    resendBtn.classList.add('d-none');
    
    const timer = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            resendBtn.classList.remove('d-none');
        }
        
        timeLeft--;
    }, 1000);
}
function showToastDanger(content = null) {//showErrorToast
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
function showToastSuccess(content = null) {//showSuccessToastThem
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
function showToastPrimary(content = null) { //showSuccessToastChinhSua
    if (content) {
        document.querySelector('#primaryToast .toastMessage').textContent = content;
    }
    else{
        document.querySelector('#primaryToast .toastMessage').textContent = 'Chỉnh sửa thành công.';
    }
    const toastElement = document.getElementById('primaryToast');
    const toast = new bootstrap.Toast(toastElement, {
        delay: 2000 // Tự động ẩn sau 3 giây
    });
    
    // Hiển thị toast
    toast.show();
}