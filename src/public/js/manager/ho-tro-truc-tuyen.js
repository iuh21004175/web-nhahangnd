document.addEventListener('DOMContentLoaded', async function() {
    const socket = io();
    let listHoiThoai = [];
    let isInitialLoadComplete = false;
    let debounceTimeout = null;
    let isLoading = false;
    
    // Function để tải và hiển thị dữ liệu
    async function loadAndDisplayData() {
        if (isLoading) return;
        try {
            isLoading = true;
            console.log("Đang tải dữ liệu hội thoại...");
            
            listHoiThoai = await getAPIHoiThoai();
            thaoTacListHoiThoai(listHoiThoai);
            xuLyRealTime(socket, listHoiThoai);
            
            isInitialLoadComplete = true;
            console.log("Đã tải xong dữ liệu hội thoại");
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        }
    }
    
    /**
     * Function debounce cải tiến: cộng dồn thời gian chờ
     * Nếu có sự kiện mới đến trong lúc đang chờ, thêm thời gian vào
     */
    function accumulateDebounceLoadData() {
        let waitTime = 1000; // Thời gian chờ cơ bản
        
        // Nếu đang có timeout chờ
        if (debounceTimeout) {
            clearTimeout(debounceTimeout); // Xóa timeout cũ
        } 
        
        // Đặt timeout mới
        debounceTimeout = setTimeout(loadAndDisplayData, waitTime);
    }
    
    // Khi kết nối Socket.IO thành công
    socket.on('connect', () => {
        console.log('Đã kết nối đến server:', socket.id);
        socket.emit('phuc-vu-vao-ho-tro');
        
        // Lắng nghe sự kiện cập nhật database
        socket.on('dang-cap-nhat-du-lieu-chat', () => {
            console.log('Nhận sự kiện cập nhật database');
            
            // Luôn sử dụng debounce
            accumulateDebounceLoadData();
        });
        // Tải dữ liệu ban đầu ngay sau khi trang được tải xong
        if (!isInitialLoadComplete && !isLoading) {
            accumulateDebounceLoadData();
        }
    });
    
    
    // Lắng nghe sự kiện nhân viên click vào hội thoại
    document.querySelector('.conversations-section').addEventListener('click', async function(e) {
        const item = e.target.closest('.conversation-item');
        if (item && !item.classList.contains('being-served')) {
            const id = item.dataset.id;
            item.classList.add('active');
            
            document.querySelectorAll('.conversation-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
    
            await showTinNhanHopThoai(socket, id, listHoiThoai);
        }
    });
    
    // Tìm kiếm cuộc hội thoại
    const searchInput = document.getElementById('searchConversation');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const conversationItems = document.querySelectorAll('.conversation-item');
            
            conversationItems.forEach(item => {
                const name = item.querySelector('h6')?.textContent.toLowerCase();
                const message = item.querySelector('p')?.textContent.toLowerCase();
                const info = item.querySelector('small:last-child')?.textContent.toLowerCase();
                
                if ((name && name.includes(searchTerm)) || 
                    (message && message.includes(searchTerm)) || 
                    (info && info.includes(searchTerm))) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
});
async function getAPIHoiThoai(id = null) {
    try {
        const url = id ? `/api/hoi-thoai?id=${id}` : '/api/hoi-thoai';
        const response = await fetch(url);
        const data = await response.json();
        if(data.status){
            return id ? data.obj : data.list
        }
        else{
            console.error('Error fetching HoiThoai:', data.error);
            return []
        }
    } catch (error) {
        console.error('Error fetching HoiThoai:', error);
    }
}
async function getAPITinNhan(id, page) {
    try {
        const response = await fetch(`/api/tin-nhan?id=${id}&page=${page}`);
        const data = await response.json();
        if(data.status){
            return data.list
        }
        else{
            console.error('Error fetching TinNhan:', data.error);
            return []
        }
    } catch (error) {
        console.error('Error fetching TinNhan:', error);
        return []
    }
}
function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}
function scrollHoiThoaiToBottom(delta = null) {
    const htmlListHoiThoai = document.querySelector('.conversations-section')
    if(delta != null){
        htmlListHoiThoai.scrollTop += delta;
    }
    else{
        htmlListHoiThoai.scrollTop = htmlListHoiThoai.scrollHeight;
    }

}
function thaoTacListHoiThoai(list){
    console.log(list)
    const htmlListHoiThoai = document.querySelector('.conversations-section')
    const htmlKhuVucChat = document.querySelector('.chat-area-col')
    htmlListHoiThoai.innerHTML = ''
    list.forEach(item => {
        let time = ''
        if(item.thoiGianGuiCuoi != null){
            const date = new Date(item.thoiGianGuiCuoi);
            const options = { hour: '2-digit', minute: '2-digit', hour12: true };
            time = date.toLocaleTimeString('en-US', options)
        }
        const html = `
            <div class="conversation-item p-3 border-bottom ${item.dangTraLoi == 1 ? 'being-served' : ''}" data-id="${item.id}">
                <div class="d-flex">
                    <div>
                        <div class="avatar-wrapper me-3">
                            <div class="avatar">
                                ${
                                    item.KhachHang.hinhAnh
                                    ? `<img src="${item.KhachHang.hinhAnh}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%;">`
                                    : `<i class="fas fa-user-circle"></i>`
                                }
                            </div>
                            <span class="status-indicator ${item.KhachHang.hoatDong == 1 ? 'online' : 'offline'}"></span>
                        </div>
                    </div>
                    <div class="conversation-info flex-grow-1">
                            <div class="d-flex justify-content-between">
                                <h6 class="mb-0 ht-tieuDe">${item.tieuDe}</h6>
                                <small class="text-muted ht-thoiGian">${time}</small>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <p class="text-truncate text-muted mb-0 small ht-noiDung">
                                    ${item.nguoiGuiCuoi == 1 ? '' : 'Phục vụ: '} ${item.noiDungCuoi== null ? '' : item.noiDungCuoi }
                                </p>
                                <span class="badge rounded-pill bg-primary ms-2 ht-soChuaDoc">${parseInt(item.soChuaDoc) > 0 ? item.soChuaDoc : ''}</span>
                            </div>
                            <div class="conversation-status ${item.dangTraLoi == 1 ? 'show' : ''}">
                                <small class="text-danger">
                                    <i class="fas fa-user-clock"></i> Đang trả lời
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        htmlListHoiThoai.insertAdjacentHTML('beforeend', html);
    });
    // Hiển thị khu vực chat khi chưa click vào hội thoại nào
    htmlKhuVucChat.innerHTML = `
         <div style="display: flex; justify-content: center; align-items: center; height: 100%; width: 100%;">
            <p>Vui lòng chọn một cuộc hội thoại để bắt đầu trò chuyện.</p>
        </div>
    `;


}
function xuLyRealTime(socket, list){
    // Lắng nghe sự kiện khi có tin nhắn mới từ khách hàng
    socket.on('tin-nhan-khach-hang', async (data) => {

        // Giải nén dữ liệu
        const { idKhachHang, noiDung, thoiGianGui } = data;

        // Chuyển NodeList thành Array để dùng .find()
        const htmlHoiThoai = Array.from(document.querySelectorAll('.conversation-item')).find(item => item.dataset.id == idKhachHang);
        // Cập nhật thời gian
        const date = new Date(thoiGianGui);
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        // Nếu tìm thấy hội thoại thì cập nhật
        if (htmlHoiThoai) {
            // Cập nhật nội dung cuối cùng
            htmlHoiThoai.querySelector('.ht-noiDung').innerHTML = noiDung;
        
            // Cập nhật số tin chưa đọc
            const soChuaDocHT = htmlHoiThoai.querySelector('.ht-soChuaDoc').textContent;
            if(htmlHoiThoai.classList.contains('active')){
                htmlHoiThoai.querySelector('.ht-soChuaDoc').innerHTML = ''
            }
            else{
                htmlHoiThoai.querySelector('.ht-soChuaDoc').innerHTML = soChuaDocHT != '' ? parseInt(soChuaDocHT) + 1 : 1;
                document.querySelector('.conversations-section').prepend(htmlHoiThoai)
                
                scrollHoiThoaiToBottom(htmlHoiThoai.getBoundingClientRect().height)
            }
            // Cập nhật tin nhắn trong hộp đã chọn
            const chatMessages = document.getElementById('chatMessages');
            if (chatMessages && chatMessages.dataset.id == idKhachHang) {
                chatMessages.innerHTML += `
                    <div class="message-row customer mb-3">
                        <div class="message-content">
                            <div class="message-bubble">
                                ${noiDung}
                            </div>
                            <div class="message-info">
                                <small class="text-muted">${date.toLocaleTimeString('en-US', options)}</small>
                            </div>
                        </div>
                    </div>
                `
                scrollChatToBottom();
            }
        } 
        else {
            // Nếu không thấy thì thêm hộp thoại mới vào danh sách hồi thoại
            const hoiThoai = await getAPIHoiThoai(idKhachHang)
            const html = `
            <div class="conversation-item p-3 border-bottom ${hoiThoai.dangTraLoi == 1 ? 'being-served' : ''}" data-id="${hoiThoai.id}">
                <div class="d-flex">
                    <div>
                        <div class="avatar-wrapper me-3">
                            <div class="avatar">
                                ${
                                    hoiThoai.KhachHang.hinhAnh
                                    ? `<img src="${hoiThoai.KhachHang.hinhAnh}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%;">`
                                    : `<i class="fas fa-user-circle"></i>`
                                }
                            </div>
                            <span class="status-indicator ${hoiThoai.KhachHang.hoatDong == 1 ? 'online': 'offline'}"></span>
                        </div>
                    </div>
                    <div class="conversation-info flex-grow-1">
                            <div class="d-flex justify-content-between">
                                <h6 class="mb-0 ht-tieuDe">${hoiThoai.tieuDe}</h6>
                                <small class="text-muted ht-thoiGian">${date.toLocaleTimeString('en-US', options)}</small>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <p class="text-truncate text-muted mb-0 small ht-noiDung">
                                    ${hoiThoai.nguoiGuiCuoi == 1 ? '' : 'Phục vụ: '} ${hoiThoai.noiDungCuoi== null ? '' : hoiThoai.noiDungCuoi }
                                </p>
                                <span class="badge rounded-pill bg-primary ms-2 ht-soChuaDoc">${parseInt(hoiThoai.soChuaDoc) > 0 ? hoiThoai.soChuaDoc : ''}</span>
                            </div>
                            <div class="conversation-status ${hoiThoai.dangTraLoi == 1 ? 'show' : ''}">
                                <small class="text-danger">
                                    <i class="fas fa-user-clock"></i> Đang trả lời
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
            document.querySelector('.conversations-section').insertAdjacentHTML('afterbegin', html);
            list.unshift(hoiThoai)
            scrollHoiThoaiToBottom(document.querySelector('.conversation-item').getBoundingClientRect().height)
        }
        
    })
    socket.on('phuc-vu-chon-hop-thoai', (data) => {
        const {id, idHoiThoaiCu} = data
        const hoiThoaiCu = Array.from(document.querySelectorAll('.conversation-item')).find(item => item.dataset.id == idHoiThoaiCu);
        const hoiThoai = Array.from(document.querySelectorAll('.conversation-item')).find(item => item.dataset.id == id);
        if(hoiThoaiCu){
            hoiThoaiCu.classList.remove('being-served')
            hoiThoaiCu.querySelector('.conversation-status').classList.remove('show')
        }
        if(hoiThoai){
            hoiThoai.classList.add('being-served')
            hoiThoai.querySelector('.conversation-status').classList.add('show')
            hoiThoai.querySelector('.ht-soChuaDoc').innerHTML = ''
        }
    })
    socket.on('tin-nhan-nha-hang', (data) => {
        const { idKhachHang, noiDung, thoiGianGui } = data;
        const date = new Date(thoiGianGui);
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        // Nếu tìm thấy hội thoại thì cập nhật
        const htmlHoiThoai = Array.from(document.querySelectorAll('.conversation-item')).find(item => item.dataset.id == idKhachHang);
        if (htmlHoiThoai) {
            htmlHoiThoai.querySelector('.ht-noiDung').innerHTML = `Phuc vụ: ${noiDung}`;
            htmlHoiThoai.querySelector('.ht-thoiGian').innerHTML = date.toLocaleTimeString('en-US', options)
            htmlHoiThoai.querySelector('.ht-soChuaDoc').innerHTML = ''
        }
    })
    socket.on('khach-hang-online', (data) => {
        const { id } = data;
        const hoiThoai = list.find(item => item.id == id)
        const htmlHoiThoai = Array.from(document.querySelectorAll('.conversation-item')).find(item => item.dataset.id == id);
        if (htmlHoiThoai) {
            htmlHoiThoai.querySelector('.status-indicator').classList.remove('offline')
            htmlHoiThoai.querySelector('.status-indicator').classList.add('online')
            if(htmlHoiThoai.classList.contains('active')){
                document.querySelector('.chat-area-col .status-indicator').classList.remove('offline')
                document.querySelector('.chat-area-col .status-indicator').classList.add('online')
                document.getElementById('customerStatus').innerHTML = 'Online'
            }
            hoiThoai.KhachHang.hoatDong = 1
        }
       
        
    })
    socket.on('khach-hang-offline', (data) => {
        const { id } = data;
        const hoiThoai = list.find(item => item.id == id)
        const htmlHoiThoai = Array.from(document.querySelectorAll('.conversation-item')).find(item => item.dataset.id == id);
        if (htmlHoiThoai) {
            htmlHoiThoai.querySelector('.status-indicator').classList.remove('online')
            htmlHoiThoai.querySelector('.status-indicator').classList.add('offline')
            if(htmlHoiThoai.classList.contains('active')){
                document.querySelector('.chat-area-col .status-indicator').classList.remove('online')
                document.querySelector('.chat-area-col .status-indicator').classList.add('offline')
                document.getElementById('customerStatus').innerHTML = 'Offline'
            }
            hoiThoai.KhachHang.hoatDong = 0
        }
       
    })
}
async function showTinNhanHopThoai(socket, id, list){
    let page = 1;
    let isLoading = false;
    const listTinNhanHoiThoai = await getAPITinNhan(id, page++)
    const htmlKhuVucChat = document.querySelector('.chat-area-col')
    const hoiThoai = list.find(item => item.id == id)
    htmlKhuVucChat.innerHTML = `
                <!-- Header hội thoại -->
                <div class="chat-header p-3 border-bottom">
                    <div class="d-flex align-items-center">
                        <div class="avatar-wrapper me-3">
                            <div class="avatar">
                                ${
                                    hoiThoai.KhachHang.hinhAnh
                                    ? `<img src="${hoiThoai.KhachHang.hinhAnh}" alt="avatar" style="width: 40px; height: 40px; border-radius: 50%;">`
                                    : `<i class="fas fa-user-circle"></i>`
                                }
                            </div>
                            <span class="status-indicator ${hoiThoai.KhachHang.hoatDong == 1 ? 'online': 'offline'}"></span>
                        </div>
                        <div class="user-info">
                            <h6 class="mb-0">${hoiThoai.tieuDe}</h6>
                            <small class="text-muted">
                                <span id="customerStatus">${hoiThoai.KhachHang.hoatDong == 1 ? 'Online': 'Offline'}</span>
                            </small>
                        </div>
                    </div>
                </div>
                
                <!-- Khu vực tin nhắn -->
                <div class="chat-messages p-3" id="chatMessages" data-id="${hoiThoai.id}">
                </div>
                
                <!-- Khu vực nhập tin nhắn -->
                <div class="chat-input-area p-3 border-top mt-auto">
                    <div class="d-flex align-items-center">
                        <div class="dropdown me-2">
                            <button class="btn btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-reply"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item quick-reply" href="#">Xin chào quý khách, tôi có thể giúp gì cho bạn?</a></li>
                                <li><a class="dropdown-item quick-reply" href="#">Cảm ơn bạn đã liên hệ với nhà hàng chúng tôi.</a></li>
                                <li><a class="dropdown-item quick-reply" href="#">Vui lòng đợi tôi kiểm tra thông tin cho bạn.</a></li>
                                <li><a class="dropdown-item quick-reply" href="#">Xin lỗi vì đã để bạn đợi lâu.</a></li>
                                <li class="dropdown-divider"></li>
                                <li><a class="dropdown-item quick-reply" href="#">Bạn có cần tôi hỗ trợ thêm thông tin gì không?</a></li>
                                <li><a class="dropdown-item quick-reply" href="#">Dạ, nhà hàng hiện có các món đặc biệt bao gồm: Beefsteak Úc nhập khẩu và Cá hồi Na Uy.</a></li>
                                <li><a class="dropdown-item quick-reply" href="#">Dạ, đơn hàng online của bạn sẽ được giao trong khoảng 30-45 phút.</a></li>
                            </ul>
                        </div>
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="Nhập tin nhắn..." id="messageInput">
                            <button class="btn btn-primary" type="button" id="btnSendMessage">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
    `
    const chatMessages = document.getElementById('chatMessages');
    let lastDateLabel = '';
    listTinNhanHoiThoai.slice().reverse().forEach(item => {
        const dateLabel = getDateLabel(item.thoiGianGui);
        if (dateLabel !== lastDateLabel) {
            const dateDiv = document.createElement('div');
            dateDiv.className = 'chat-date-label text-center mb-2';
            dateDiv.innerHTML = `<span>${dateLabel}</span>`;
            chatMessages.appendChild(dateDiv);
            lastDateLabel = dateLabel;
        }
        const date = new Date(item.thoiGianGui);
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        const time = date.toLocaleTimeString('en-US', options)
        if(item.nguoiGui == 1){
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-row customer mb-3';
            messageDiv.setAttribute('data-date', item.thoiGianGui);
            messageDiv.innerHTML = `
                 <div class="message-content">
                    <div class="message-bubble">
                        ${item.noiDung}
                    </div>
                    <div class="message-info">
                        <small class="text-muted">${time}</small>
                    </div>
                </div>
            `
            chatMessages.appendChild(messageDiv);
        }
        else{
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-row staff mb-3';
            messageDiv.setAttribute('data-date', item.thoiGianGui);
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-bubble">
                        ${item.noiDung}
                    </div>
                    <div class="message-info text-end">
                        <small class="text-muted">${time}</small>
                    </div>
                </div>
            `
            chatMessages.appendChild(messageDiv);
        }
        scrollChatToBottom();
    })
    document.getElementById('chatMessages').addEventListener('scroll', async function() {
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages.scrollTop === 0 && !isLoading) {
            isLoading = true;
            let newMessages = await getAPITinNhan(id, page++);
            if (newMessages.length > 0) {
                newMessages = newMessages.slice().reverse()
                const oldScrollHeight = chatMessages.scrollHeight; // lưu chiều cao cũ

                // Lấy nhãn ngày của tin nhắn đầu tiên hiện tại (nếu có)
                let firstMsg = chatMessages.querySelector('.message-row, .message-row.staff, .message-row.customer');
                let firstDateLabel = '';
                if (firstMsg) {
                    // Tìm nhãn ngày ngay trước tin nhắn đầu tiên
                    let prev = firstMsg.previousElementSibling;
                    if (prev && prev.classList.contains('chat-date-label')) {
                        firstDateLabel = prev.textContent.trim();
                    } else {
                        // Nếu không có, lấy ngày của tin nhắn đầu tiên
                        let timeNode = firstMsg.querySelector('.message-info small, .message-info.text-end small');
                        if (timeNode) {
                            let msgDateStr = firstMsg.getAttribute('data-date');
                            if (msgDateStr) {
                                let msgDate = new Date(msgDateStr);
                                firstDateLabel = getDateLabel(msgDate);
                            }
                        }
                    }
                }

                // Duyệt từ cuối lên đầu để prepend đúng thứ tự
                let lastDateLabel = firstDateLabel;
                for (let i = newMessages.length - 1; i >= 0; i--) {
                    const item = newMessages[i];
                    const dateLabel = getDateLabel(item.thoiGianGui);

                    // Nếu khác ngày thì chèn nhãn ngày
                    if (dateLabel !== lastDateLabel) {
                        const dateDiv = document.createElement('div');
                        dateDiv.className = 'chat-date-label text-center mb-2';
                        dateDiv.innerHTML = `<span>${dateLabel}</span>`;
                        chatMessages.insertBefore(dateDiv, chatMessages.firstChild);
                        lastDateLabel = dateLabel;
                    }

                    const date = new Date(item.thoiGianGui);
                    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
                    const time = date.toLocaleTimeString('en-US', options);
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'message-row customer mb-3';
                    messageDiv.setAttribute('data-date', item.thoiGianGui);
                    messageDiv.innerHTML = `
                        <div class="message-content">
                            <div class="message-bubble">
                                ${item.noiDung}
                            </div>
                            <div class="message-info">
                                <small class="text-muted">${time}</small>
                            </div>
                        </div>
                    `;
                    chatMessages.insertBefore(messageDiv, chatMessages.firstChild);
                }

                // Sau khi prepend xong -> giữ nguyên vị trí scroll
                const newScrollHeight = chatMessages.scrollHeight;
                chatMessages.scrollTop += (newScrollHeight - oldScrollHeight);
            } else {
                // Nếu không còn tin nhắn cũ hơn nữa, luôn chèn nhãn ngày cho tin nhắn đầu tiên
                let firstMsg = chatMessages.querySelector('.message-row, .message-row.staff, .message-row.customer');
                if (firstMsg) {
                    // Lấy ngày của tin nhắn đầu tiên từ data-date
                    let msgDateStr = firstMsg.getAttribute('data-date');
                    if (msgDateStr) {
                        let msgDate = new Date(msgDateStr);
                        let dateLabel = getDateLabel(msgDate);

                        // Chèn nhãn ngày mới vào trước tin nhắn đầu tiên
                        const dateDiv = document.createElement('div');
                        dateDiv.className = 'chat-date-label text-center mb-2';
                        dateDiv.innerHTML = `<span>${dateLabel}</span>`;
                        chatMessages.insertBefore(dateDiv, firstMsg);

                        // Nếu nhãn ngày tiếp theo (sau nhãn vừa chèn) trùng với nhãn mới, thì xóa nhãn cũ đi
                        const dateDivs = chatMessages.querySelectorAll('.chat-date-label');
                        dateDivs.forEach((div, idx) => {
                            if (div !== dateDiv && div.textContent.trim() === dateDiv.textContent.trim()) {
                                chatMessages.removeChild(div);
                            }
                        });
                    }
                }
            }
            isLoading = false;
        }
    });
    // Xử lý các template tin nhắn nhanh
    const quickReplyItems = document.querySelectorAll('.quick-reply');
    quickReplyItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            messageInput.value = this.textContent;
            messageInput.focus();
        });
    });
    // Gửi tin nhắn khi nhấn nút hoặc Enter
    const btnSendMessage = document.getElementById('btnSendMessage');
    const messageInput = document.getElementById('messageInput');
    if (btnSendMessage && messageInput) {
        btnSendMessage.addEventListener('click', sendMessage);
        
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

    }
    // Hàm gửi tin nhắn
    function sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const date = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        const time = date.toLocaleTimeString('en-US', options)
        chatMessages.innerHTML += `
            <div class="message-row staff mb-3">
                <div class="message-content">
                    <div class="message-bubble">
                        ${messageInput.value.trim()}
                    </div>
                    <div class="message-info text-end">
                        <small class="text-muted">${time}</small>
                    </div>
                </div>
            </div>
        `
        socket.emit('nha-hang-gui-tin-nhan', {
            idKhachHang: id, 
            noiDung: messageInput.value,
            thoiGianGui: new Date().toISOString() 
        });
        const htmlHoiThoai = Array.from(document.querySelectorAll('.conversation-item')).find(item => item.classList.contains('active'));
        htmlHoiThoai.querySelector('.ht-noiDung').innerHTML = `Phuc vụ: ${messageInput.value}`;
        htmlHoiThoai.querySelector('.ht-thoiGian').innerHTML = time
        messageInput.value = '';
        scrollChatToBottom();
    }
    socket.emit('nha-hang-doc-tin-nhan', {
        id
    })
    // Cập nhật số tin chưa đọc về 0
    let listHTMLHoiThoai = document.querySelectorAll('.conversation-item');
    const htmlHoiThoai = Array.from(listHTMLHoiThoai).find(item => item.dataset.id == id);
    if (htmlHoiThoai) {
        htmlHoiThoai.querySelector('.ht-soChuaDoc').innerHTML = ''
    }
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