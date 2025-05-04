/**
 * Chat Widget Functionality
 */
document.addEventListener('DOMContentLoaded', async function() {
    // DOM Elements
    let page = 1;
    let isLoading = false;
    const chatButton = document.getElementById('chatButton');
    const chatContainer = document.getElementById('chatContainer');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatSpinner = document.getElementById('chatSpinner');
    const chatMessages = document.getElementById('chatMessages');
    const userId = await getAPIIDKhachHang();
    const socket = io();
    socket.on('connect', async () => {
        console.log('Kết nối thành công:', socket.id);
        socket.emit('khach-hang-vao-chat', {id: userId});
        // Toggle chat open/close
            
        // Lắng nghe tin nhắn nhà hàng gửi đến hồi thoại
        socket.on(`tin-nhan-nha-hang-${userId}`, function(data) {
            if (!chatContainer.classList.contains('active')) {
                const unreadBadge = document.getElementById('unreadBadge');
                unreadBadge.classList.add('show');
                document.getElementById('chatButton').classList.add('new-message');
                unreadBadge.innerHTML = parseInt(unreadBadge.textContent) + 1 || 1;
            }
            addMessage(data, 'admin');
        });
            
             
            
    });
    if(userId) {
        const listTinNhan = await getAPITinNhan(userId, page);
        page++;
        await renderTinNhan(listTinNhan);
        const hoiThoai = await getAPIHoiThoai(userId);
        if(hoiThoai.nguoiGuiCuoi == 0 && parseInt(hoiThoai.soChuaDocKhach) > 0) {
            const unreadBadge = document.getElementById('unreadBadge');
            unreadBadge.classList.add('show');
            document.getElementById('chatButton').classList.add('new-message');
            unreadBadge.innerHTML = hoiThoai.soChuaDocKhach;
        }
        // Send message on button click
        chatSend.addEventListener('click', sendMessage);
                
        // Send message on Enter key
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
        
    chatClose.addEventListener('click', function() {
        socket.emit('khach-hang-doc-tin-nhan', { 
            idKhachHang: userId,
            status: false
        });
        chatContainer.classList.remove('active');
    });
    // Hiển thị tin nhắn chưa đọc khi vửa vào trang web
    chatButton.addEventListener('click', function() {
        chatSpinner.style.display = 'block';
        chatContainer.style.display = 'none';
        if(socket){
            socket.emit('khach-hang-doc-tin-nhan', {
                idKhachHang: userId,
                status: true
            });
            chatSpinner.style.display = 'none';
            chatContainer.style.display = 'block';
        }
        chatContainer.classList.add('active');
        const unreadBadge = document.getElementById('unreadBadge');
        unreadBadge.classList.remove('show');
        unreadBadge.innerHTML = 0;
        document.getElementById('chatButton').classList.remove('new-message');
        scrollToBottom();
    });
    // Load more messages on scroll
    chatMessages.addEventListener('scroll', async function() {
        if (chatMessages.scrollTop === 0 && !isLoading) {
            isLoading = true;
            const newMessages = await getAPITinNhan(userId, page);
            if (newMessages.length > 0) {
                page++;
                prependTinNhan(newMessages);
            }
            isLoading = false;
        }
    });
    /**
    * Add a message to the chat
    */
    function sendMessage() {
        const chatInput = document.getElementById('chatInput');
        const messageText = chatInput.value.trim();
        
        if (messageText) {
            socket.emit('khach-hang-gui-tin-nhan', { 
                idKhachHang: userId, 
                noiDung: messageText,
                thoiGianGui: new Date().toISOString() 
            });
            addMessage({noiDung: messageText, thoiGianGui: new Date()}, 'user');
            chatInput.value = ''; // Clear input field
        }
    }
    

});
async function getAPIIDKhachHang() {
    try {
        const response = await fetch('/api/lay-id-khach-hang');
        const data = await response.json();
        if (data.status) {
            return data.id;
        } else {
            console.error('Lỗi khi lấy ID khách hàng:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return null;
    }
}
async function getAPITinNhan(id, page) {
    try {
        const response = await fetch(`/api/tin-nhan?id=${id}&page=${page}`);
        const data = await response.json();
        if (data.status) {
            return data.list;
        } else {
            console.error('Lỗi khi lấy tin nhắn:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return [];
    }
}
async function getAPIHoiThoai(id){
    try {
        const response = await fetch(`/api/hoi-thoai?id=${id}`);
        const data = await response.json();
        if (data.status) {
            return data.obj;
        } else {
            console.error('Lỗi khi lấy hội thoại:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return null;
    }
}
async function renderTinNhan(list) {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.innerHTML = ''; // Clear existing messages

    let lastDateLabel = '';
    list.slice().reverse().forEach(tinNhan => {
        const dateLabel = getDateLabel(tinNhan.thoiGianGui);
        if (dateLabel !== lastDateLabel) {
            // Thêm nhãn ngày
            const dateDiv = document.createElement('div');
            dateDiv.className = 'chat-date-label text-center mb-2';
            dateDiv.innerHTML = `<span>${dateLabel}</span>`;
            chatMessages.appendChild(dateDiv);
            lastDateLabel = dateLabel;
        }
        const sender = tinNhan.nguoiGui === 1 ? 'user' : 'admin';
        addMessage(tinNhan, sender, false); // false: không scrollToBottom ở đây
    });
    scrollToBottom();
}
function addMessage(tinNhan, sender, scroll = true) {
    const time = new Date(tinNhan.thoiGianGui).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.innerHTML = `
        <div class="message-content">${tinNhan.noiDung}</div>
        <div class="message-time">${time}</div>
    `;
    chatMessages.appendChild(messageDiv);
    if (scroll) scrollToBottom();
}
function prependTinNhan(list) {
    const chatMessages = document.getElementById('chatMessages');
    const oldScrollHeight = chatMessages.scrollHeight; // lưu chiều cao cũ

    // Lấy nhãn ngày của tin nhắn đầu tiên hiện tại (nếu có)
    let firstMsg = chatMessages.querySelector('.message, .message.user, .message.admin');
    let firstDateLabel = '';
    if (firstMsg) {
        let prev = firstMsg.previousElementSibling;
        if (prev && prev.classList.contains('chat-date-label')) {
            firstDateLabel = prev.textContent.trim();
        } else {
            let msgDateStr = firstMsg.getAttribute('data-date');
            if (msgDateStr) {
                let msgDate = new Date(msgDateStr);
                firstDateLabel = getDateLabel(msgDate);
            }
        }
    }

    // Duyệt từ cuối lên đầu để prepend đúng thứ tự
    let lastDateLabel = firstDateLabel;
    for (let i = list.length - 1; i >= 0; i--) {
        const tinNhan = list[i];
        const dateLabel = getDateLabel(tinNhan.thoiGianGui);
        if (dateLabel !== lastDateLabel) {
            // Thêm nhãn ngày
            const dateDiv = document.createElement('div');
            dateDiv.className = 'chat-date-label text-center mb-2';
            dateDiv.innerHTML = `<span>${dateLabel}</span>`;
            chatMessages.insertBefore(dateDiv, chatMessages.firstChild);
            lastDateLabel = dateLabel;
        }
        const sender = tinNhan.nguoiGui === 1 ? 'user' : 'admin';
        prependMessage(tinNhan, sender, tinNhan.thoiGianGui);
    }

    // Sau khi prepend xong -> giữ nguyên vị trí scroll
    const newScrollHeight = chatMessages.scrollHeight;
    chatMessages.scrollTop += (newScrollHeight - oldScrollHeight);

    // Nếu không còn tin nhắn cũ hơn nữa, luôn chèn nhãn ngày cho tin nhắn đầu tiên
    if (list.length === 0) {
        let firstMsg = chatMessages.querySelector('.message, .message.user, .message.admin');
        if (firstMsg) {
            let msgDateStr = firstMsg.getAttribute('data-date');
            if (msgDateStr) {
                let msgDate = new Date(msgDateStr);
                let dateLabel = getDateLabel(msgDate);

                // Chèn nhãn ngày mới vào trước tin nhắn đầu tiên
                const dateDiv = document.createElement('div');
                dateDiv.className = 'chat-date-label text-center mb-2';
                dateDiv.innerHTML = `<span>${dateLabel}</span>`;
                chatMessages.insertBefore(dateDiv, firstMsg);

                // Xóa tất cả các nhãn ngày trùng (trừ nhãn mới vừa chèn)
                const dateDivs = chatMessages.querySelectorAll('.chat-date-label');
                dateDivs.forEach(div => {
                    if (div !== dateDiv && div.textContent.trim() === dateDiv.textContent.trim()) {
                        chatMessages.removeChild(div);
                    }
                });
            }
        }
    }
}

function prependMessage(tinNhan, sender, thoiGianGui) {
    const time = new Date(tinNhan.thoiGianGui).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.setAttribute('data-date', thoiGianGui || tinNhan.thoiGianGui); // Lưu ngày gốc
    messageDiv.innerHTML = `
        <div class="message-content">${tinNhan.noiDung}</div>
        <div class="message-time">${time}</div>
    `;
    chatMessages.insertBefore(messageDiv, chatMessages.firstChild);
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getDateLabel(date) {
    const now = new Date();
    const msgDate = new Date(date);
    // Đặt giờ về 0 để so sánh ngày
    now.setHours(0,0,0,0);
    msgDate.setHours(0,0,0,0);

    const diff = (now - msgDate) / (1000 * 60 * 60 * 24);

    if (diff === 0) return 'Hôm nay';
    if (diff === 1) return 'Hôm qua';

    // Lấy thứ
    const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const weekday = weekdays[msgDate.getDay()];
    const day = msgDate.getDate().toString().padStart(2, '0');
    const month = (msgDate.getMonth() + 1).toString().padStart(2, '0');
    const year = msgDate.getFullYear();
    return `${weekday}, ${day}/${month}/${year}`;
}