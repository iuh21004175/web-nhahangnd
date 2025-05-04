/**
 * Authentication JavaScript
 */
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const registerForm = document.getElementById('registerForm');
    
    // Xử lý hiển thị/ẩn mật khẩu
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    // --- Quên mật khẩu ---
    let forgotAccount = '';
    let forgotPhone = '';
    let forgotCode = '';
    let forgotTimer = null;
    let forgotTimeLeft = 120;

    // Bước 1: Gửi mã xác thực
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const accountInput = document.getElementById('forgotAccount');
            forgotAccount = accountInput.value.trim();
            if (!forgotAccount) {
                showToastDanger("Vui lòng nhập tên đăng nhập hoặc số điện thoại");
                return;
            }
            try {
                const res = await fetch('/api/gui-ma-xac-thuc-quen-mat-khau', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account: forgotAccount })
                });
                const data = await res.json();
                if (data.status) {
                    showToastSuccess("Đã gửi mã xác thực về số điện thoại");
                    forgotPhone = data.soDienThoai || forgotAccount; // backend trả về số điện thoại thực tế
                    document.getElementById('forgotPhoneDisplay').textContent = forgotPhone;
                    bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal')).hide();
                    const verifyModal = new bootstrap.Modal(document.getElementById('verifyForgotCodeModal'));
                    verifyModal.show();
                    startForgotCountdown();
                } else {
                    showToastDanger(data.error || "Không gửi được mã xác thực");
                }
            } catch (error) {
                showToastDanger("Lỗi gửi mã xác thực");
            }
        });
    }

    // Bước 2: Xác thực mã OTP
    const verifyForgotCodeForm = document.getElementById('verifyForgotCodeForm');
    if (verifyForgotCodeForm) {
        verifyForgotCodeForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const code = document.getElementById('forgotVerificationCode').value.trim();
            if (!code) {
                showToastDanger("Vui lòng nhập mã xác thực");
                return;
            }
            try {
                const res = await fetch('/api/xac-thuc-ma-quen-mat-khau', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ soDienThoai: forgotPhone, maXacThuc: code })
                });
                const data = await res.json();
                if (data.status) {
                    showToastSuccess("Xác thực thành công, vui lòng đặt lại mật khẩu mới");
                    bootstrap.Modal.getInstance(document.getElementById('verifyForgotCodeModal')).hide();
                    const resetModal = new bootstrap.Modal(document.getElementById('resetPasswordModal'));
                    resetModal.show();
                    forgotCode = code;
                    verifyForgotCodeForm.reset();
                    clearInterval(forgotTimer);
                } else {
                    showToastDanger(data.error || "Mã xác thực không đúng hoặc đã hết hạn");
                }
            } catch (error) {
                showToastDanger("Lỗi xác thực mã");
            }
        });
    }

    // Bước 3: Đặt lại mật khẩu mới
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value.trim();
            const confirmNewPassword = document.getElementById('confirmNewPassword').value.trim();
            if (newPassword !== confirmNewPassword) {
                showToastDanger("Mật khẩu xác nhận không khớp");
                return;
            }
            try {
                const res = await fetch('/api/dat-lai-mat-khau', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        soDienThoai: forgotPhone,
                        maXacThuc: forgotCode,
                        matKhauMoi: newPassword
                    })
                });
                const data = await res.json();
                if (data.status) {
                    showToastSuccess("Đặt lại mật khẩu thành công");
                    setTimeout(() => {
                        bootstrap.Modal.getInstance(document.getElementById('resetPasswordModal')).hide();
                        resetPasswordForm.reset();
                    }, 1000);
                } else {
                    showToastDanger(data.error || "Không đặt lại được mật khẩu");
                }
            } catch (error) {
                showToastDanger("Lỗi đặt lại mật khẩu");
            }
        });
    }

    // Đếm ngược 2 phút cho mã xác thực
    function startForgotCountdown() {
        forgotTimeLeft = 120;
        const countdownElement = document.getElementById('forgotCountdown');
        const resendBtn = document.getElementById('resendForgotCode');
        resendBtn.disabled = true;
        resendBtn.classList.add('disabled');
        if (forgotTimer) clearInterval(forgotTimer);
        forgotTimer = setInterval(() => {
            const minutes = Math.floor(forgotTimeLeft / 60);
            const seconds = forgotTimeLeft % 60;
            countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            if (forgotTimeLeft <= 0) {
                clearInterval(forgotTimer);
                resendBtn.disabled = false;
                resendBtn.classList.remove('disabled');
            }
            forgotTimeLeft--;
        }, 1000);

        // Xử lý gửi lại mã
        resendBtn.onclick = async function() {
            if (resendBtn.disabled) return;
            try {
                const res = await fetch('/api/gui-ma-xac-thuc-quen-mat-khau', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ account: forgotAccount })
                });
                const data = await res.json();
                if (data.status) {
                    showToastSuccess("Đã gửi lại mã xác thực");
                    startForgotCountdown();
                } else {
                    showToastDanger(data.error || "Không gửi được mã xác thực");
                }
            } catch (error) {
                showToastDanger("Lỗi gửi lại mã xác thực");
            }
        }
    }
    // Xử lý form đăng nhập
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const txtTenDangNhap = document.getElementById('loginUsername');
            const txtMatKhau = document.getElementById('loginPassword'); 
            const luuDangNhap = document.getElementById('rememberMe');
            try {
                const res = await fetch('/api/dang-nhap-khach-hang', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tenDangNhap: txtTenDangNhap.value.trim(), matKhau: txtMatKhau.value.trim(), luuDangNhap: luuDangNhap.checked })
                });
                const data = await res.json();
                if(data.status){
                    // Đăng nhập thành công
                    showToastPrimary("Đăng nhập thành công"); // Hiển thị thông báo thành công
                    // Đóng modal
                    bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide(); // Đóng modal
                    this.reset(); // Reset form
                    setTimeout(() => {
                        window.location.reload(); // Tải lại trang
                    }, 2000); // Chuyển hướng sau 2 giây
                }
                else{
                    showToastDanger(data.error); // Hiển thị thông báo lỗi
                    // Đăng nhập thất bại
                    console.error(data.error); // In ra lỗi để kiểm tra
                }
                    
            } catch (error) {
                showToastDanger("Lỗi đăng nhập: ", error); ; // Hiển thị thông báo lỗi
                console.error('Error:', error); // In ra lỗi để kiểm tra
            }
        })
    }

    // Biến lưu trữ thông tin đăng ký tạm thời
    let tempRegisterData = null;

    if(registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const txtTen = document.getElementById('fullName');
            const selectGioiTinh = document.getElementById('gender');
            const txtNgaySinh = document.getElementById('birthday');
            const txtSDT = document.getElementById('phone');
            const txtTenDangNhap = document.getElementById('username');
            const txtMatKhau = document.getElementById('password');
            const txtXacNhanMatKhau = document.getElementById('confirmPassword');

            const isValidTen = kiemTraTen(txtTen);
            const isValidNgaySinh = kiemTraNgaySinh(txtNgaySinh);
            const isValidSDT = await kiemTraSDT(txtSDT);
            const isValidTenDangNhap = await kiemTraTenDangNhap(txtTenDangNhap);
            const isValidMatKhau = kiemTraMatKhau(txtMatKhau);
            const isValidXacNhanMatKhau = kiemTraXacNhanMatKhau(txtMatKhau, txtXacNhanMatKhau);

            if(isValidTen && isValidNgaySinh && isValidSDT && isValidTenDangNhap && isValidMatKhau && isValidXacNhanMatKhau) {
                
                // Lưu thông tin đăng ký tạm thời
                tempRegisterData = {
                    ten: txtTen.value.trim(),
                    gioiTinh: selectGioiTinh.value,
                    ngaySinh: txtNgaySinh.value,
                    soDienThoai: txtSDT.value.trim(),
                    tenDangNhap: txtTenDangNhap.value.trim(),
                    matKhau: txtMatKhau.value.trim()
                };

                // Gửi mã xác thực
                try {
                    const response = await fetch('/api/gui-ma-xac-thuc', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ soDienThoai: txtSDT.value.trim() })
                    });
                    
                    const data = await response.json();
                    if(data.status) {
                        // Hiển thị số điện thoại cần xác thực
                        document.getElementById('phoneToVerify').textContent = txtSDT.value.trim();
                        // Hiển thị modal xác thực số điện thoại
                        bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide(); // Đóng modal đăng ký
                        const verifyModal = new bootstrap.Modal(document.getElementById('verifyPhoneModal'));
                        verifyModal.show();
                        // Bắt đầu đếm ngược
                        startCountdown();
                    } else {
                        showToastDanger(data.error); // Hiển thị thông báo lỗi;
                    }
                } catch (error) {
                    showToastDanger("Lỗi gửi mã xác thực");
                    console.error('Error:', error);
                }
            }
        });
    }
    // Xử lý form xác thực số điện thoại
    const verifyPhoneForm = document.getElementById('verifyPhoneForm');
    if(verifyPhoneForm) {
        verifyPhoneForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (tempRegisterData) {// Kiểm tra xem có dữ liệu đăng ký tạm thời không
                const verificationCode = document.getElementById('verificationCode').value.trim();
                try {
                    const response = await fetch('/api/xac-thuc-so-dien-thoai', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            soDienThoai: tempRegisterData.soDienThoai,
                            maXacThuc: verificationCode
                        })
                    });
                    const data = await response.json();
                    if(data.status) {
                        // Xác thực thành công, tiếp tục đăng ký
                        try {
                            const registerResponse = await fetch('/api/dang-ky', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(tempRegisterData)
                            });
                            
                            const registerData = await registerResponse.json();
                            if(registerData.status) {
                                // Đóng modal
                                bootstrap.Modal.getInstance(document.getElementById('verifyPhoneModal')).hide();
                                // Thông báo thành công
                                showToastSuccess("Xác thực số điện thoại thành công") // Hiển thị thông báo thành công
                                alert('Đăng ký thành công!'); // Thông báo thành công
                                // Reset form
                                document.getElementById('registerForm').reset();
                                document.getElementById('verificationCode').value = ''; // Reset mã xác thực
                                // Reset biến tạm
                                tempRegisterData = null;
                            } else {
                                showToastDanger(data.error); // Hiển thị thông báo lỗi;
                                document.getElementById('verifyError').textContent = registerData.error;
                                document.getElementById('verifyError').classList.remove('d-none');
                            }
                        } catch (error) {
                            showToastDanger("Lỗi đăng ký");
                            console.error('Error:', error);
                        }
                    } else {
                        showToastDanger(data.error); // Hiển thị thông báo lỗi;
                    }
                } catch (error) {
                    showToastDanger("Lỗi xác thực số điện thoại");
                    console.error('Error:', error);
                }
            }
            
        });
    }

    // Xử lý nút gửi lại mã
    const resendCodeBtn = document.getElementById('resendCode');
    if(resendCodeBtn ) {
        resendCodeBtn.addEventListener('click', async function() {
            // Kiểm tra xem có dữ liệu đăng ký tạm thời không
            if (!tempRegisterData) {
                return;
            }

            try {
                const response = await fetch('/api/gui-ma-xac-thuc', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ soDienThoai: tempRegisterData.soDienThoai })
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
});

function kiemTraTen(txtTen){
    let isValid = true;
    const errorMessage = txtTen.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;"; // Reset error message
    if(txtTen.value.trim() === ""){
        isValid = false;
        errorMessage.innerHTML = "Tên không được để trống";
    }
    return isValid;
}
async function kiemTraTenDangNhap(txtTenDangNhap){
    let isValid = true;
    const errorMessage = txtTenDangNhap.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;"; // Reset error message
    if(txtTenDangNhap.value.trim() === ""){
        isValid = false;
        errorMessage.innerHTML = "Tên đăng nhập không được để trống";
    }else if(txtTenDangNhap.value.length < 6){
        isValid = false;
        errorMessage.innerHTML = "Tên đăng nhập phải có ít nhất 6 ký tự";
    }else if(txtTenDangNhap.value.length > 20){
        isValid = false;
        errorMessage.innerHTML = "Tên đăng nhập không được quá 20 ký tự";
    }else if(!/^[a-zA-Z0-9]+$/.test(txtTenDangNhap.value)){
        isValid = false;
        errorMessage.innerHTML = "Tên đăng nhập chỉ được chứa chữ cái và số";
    }else if(!/^[a-zA-Z]/.test(txtTenDangNhap.value)){
        isValid = false;
        errorMessage.innerHTML = "Tên đăng nhập phải bắt đầu bằng chữ cái";
    }
    else{
        try{
            const res = await fetch('/api/kiem-tra-ten-dang-nhap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tenDangNhap: txtTenDangNhap.value.trim() })
            });
            const data = await res.json();
            if(data.status){
                isValid = false;
                errorMessage.innerHTML = "Tên đăng nhập đã tồn tại";
            }
            else{
                if(data.error){
                    showToastDanger(data.error); // Hiển thị thông báo lỗi
                }
            }
        }
        catch(error){
            showToastDanger("Lỗi kiểm tra tên đăng nhập"); // Hiển thị thông báo lỗi
            // In ra lỗi để kiểm tra
            console.error('Error:', error);
            isValid = false;
            errorMessage.innerHTML = "Lỗi kiểm tra tên đăng nhập";
        }

    }
    return isValid;
}
async function kiemTraSDT(txtSDT){
    let isValid = true;
    const errorMessage = txtSDT.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;"; // Reset error message
    const regex = /(0[3|5|7|8|9])+([0-9]{8})\b/;
    if(txtSDT.value.trim() === ""){
        isValid = false;
        errorMessage.innerHTML = "Số điện thoại không được để trống";
    }else if(!regex.test(txtSDT.value)){
        isValid = false;
        errorMessage.innerHTML = "Số điện thoại không hợp lệ";
    }
    else{
        try{
            const res = await fetch('/api/kiem-tra-so-dien-thoai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ soDienThoai: txtSDT.value.trim() })
            });
            const data = await res.json();
            if(data.status){
                isValid = false;
                errorMessage.innerHTML = "Số điện thoại đã tồn tại";
            }
            else{
                if(data.error){
                    showToastDanger(data.error); // Hiển thị thông báo lỗi
                }
            }
        }
        catch(error){
            showErrorToast("Lỗi kiểm tra số điện thoại"); // Hiển thị thông báo lỗi
            // In ra lỗi để kiểm tra
            console.error('Error:', error);
            isValid = false;
            errorMessage.innerHTML = "Lỗi kiểm tra số điện thoại";
        }

    }
    return isValid;
}
function kiemTraMatKhau(txtMatKhau){
    let isValid = true;
    const errorMessage = txtMatKhau.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;"; // Reset error message
    if(txtMatKhau.value.trim() === ""){
        isValid = false;
        errorMessage.innerHTML = "Mật khẩu không được để trống";
    }else if(txtMatKhau.value.length < 6){
        isValid = false;
        errorMessage.innerHTML = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    return isValid;
}
function kiemTraXacNhanMatKhau(txtMatKhau, txtXacNhanMatKhau){
    let isValid = true;
    const errorMessage = txtXacNhanMatKhau.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;"; // Reset error message
    if(txtXacNhanMatKhau.value.trim() === ""){
        isValid = false;
        errorMessage.innerHTML = "Xác nhận mật khẩu không được để trống";
    }else if(txtMatKhau.value !== txtXacNhanMatKhau.value){
        isValid = false;
        errorMessage.innerHTML = "Mật khẩu xác nhận không khớp";
    }
    return isValid;
}
function kiemTraDiaChi(txtDiaChi){
    let isValid = true;
    const errorMessage = txtDiaChi.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;"; // Reset error message
    if(txtDiaChi.value.trim() === ""){
        isValid = false;
        errorMessage.innerHTML = "Địa chỉ không được để trống";
    }
    return isValid;
}
function kiemTraNgaySinh(txtNgaySinh){
    let isValid = true;
    const errorMessage = txtNgaySinh.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;"; // Reset error message
    if(txtNgaySinh.value.trim() === ""){
        isValid = false;
        errorMessage.innerHTML = "Ngày sinh không được để trống";
    }
    else{
        const today = new Date();
        const birthDate = new Date(txtNgaySinh.value);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        if(age < 18){
            isValid = false;
            errorMessage.innerHTML = "Bạn phải từ 18 tuổi trở lên để đăng ký tài khoản";
        }
    }
    
    return isValid;
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
function showToastPrimary(content = null) { //showSuccessToastDangNhap()
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


function kiemTraNgaySinh(txtNgaySinh) {
    let isValid = true;
    const errorMessage = txtNgaySinh.closest('.input-group').nextElementSibling;
    errorMessage.innerHTML = "&nbsp;";
    
    if (txtNgaySinh.value === "") {
        isValid = false;
        errorMessage.innerHTML = "Vui lòng chọn ngày sinh";
    } else {
        const ngaySinh = new Date(txtNgaySinh.value);
        const today = new Date();
        const age = today.getFullYear() - ngaySinh.getFullYear();
        
        if (age < 18) {
            isValid = false;
            errorMessage.innerHTML = "Bạn phải từ 18 tuổi trở lên để đăng ký";
        }
    }
    
    return isValid;
}