document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('togglePassword').addEventListener('click', function() {
        const passwordInput = document.getElementById('password');
        const icon = this.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
    
    document.querySelector('#loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        // Xử lý logic đăng nhập ở đây
        const tenDangNhap = document.getElementById('username').value;
        const matKhau = document.getElementById('password').value;
        const response = await fetch('/api/dang-nhap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tenDangNhap, matKhau })
        })
        const cloneText = await response.clone();
        const cloneJson = await response.clone();
        try {
            const data = await cloneJson.json();
            if(data.status){
                window.location.href = data.link;
            }
            else{
                document.getElementById('loginError').style.visibility = 'visible';
            }
        }
        catch (error) {
            console.error('Lỗi khi đăng nhập:', error);
            console.log(await cloneText.text());
        }
    });
})