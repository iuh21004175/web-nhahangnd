const HoiThoai = require("../models/HoiThoai");
const KhachHang = require("../models/KhachHang");
const TinNhan = require("../models/TinNhan");
const chatService = (socket,redis) => {
    capNhatTraLoiHoiThoai(redis);
    // Lắng nghe sự kiện socket
    socket.on("khach-hang-gui-tin-nhan", async(data) => {
        const { idKhachHang, noiDung, thoiGianGui } = data;
        const hoiThoai = await HoiThoai.findOne({
            where: {
                id: idKhachHang,
            },
        });
        if(hoiThoai){
            const ids = await redis.smembers('list-hop-thoai-mo');
            const index = ids.findIndex(id => id == idKhachHang);
            if(index == -1){
                hoiThoai.soChuaDoc += 1;
            }
            else{
                
                hoiThoai.soChuaDoc = 0;
            }
            // console.log(index);
            // console.log(ids);
            hoiThoai.soChuaDocKhach = 0;
            hoiThoai.noiDungCuoi = noiDung;
            hoiThoai.thoiGianGuiCuoi = thoiGianGui;
            hoiThoai.nguoiGuiCuoi = 1;
            await hoiThoai.save();
            await TinNhan.create({
                idHoiThoai: parseInt(idKhachHang),
                nguoiGui: 1,
                noiDung: noiDung,
                thoiGianGui: thoiGianGui
            });

            // Kiểm tra nếu là tin nhắn đầu tiên
            const soTinNhan = await TinNhan.count({ where: { idHoiThoai: idKhachHang } });
            if (soTinNhan === 1) {
                // Gửi trả lời tự động
                const autoReply = "Xin chào, cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi đã nhận được tin nhắn của bạn và sẽ sớm trả lời.";
                await TinNhan.create({
                    idHoiThoai: parseInt(idKhachHang),
                    nguoiGui: 0, // 0 là nhà hàng
                    noiDung: autoReply,
                    thoiGianGui: new Date()
                });
                // Gửi tin nhắn tự động về cho khách hàng
                redis.publish("tin-nhan-nha-hang", JSON.stringify({
                    idKhachHang,
                    noiDung: autoReply,
                    thoiGianGui: new Date(),
                    socketId: null
                }));
            }
        }
         // Gửi tin nhắn đến Redis
         redis.publish("tin-nhan-khach-hang", JSON.stringify(data));
         redis.publish('dang-cap-nhat-du-lieu-chat', 'ok');
    });
    socket.on("nha-hang-gui-tin-nhan", async(data) => {
        const { idKhachHang, noiDung, thoiGianGui } = data;
        
        const hoiThoai = await HoiThoai.findOne({
            where: {
                id: idKhachHang,
            },
        });
        if(hoiThoai){
            const trangThai = await redis.get(`trang-thai-chat-khach-hang-${idKhachHang}`);
            if(trangThai == 1){
               hoiThoai.soChuaDocKhach = 0;
            }
            else{
                hoiThoai.soChuaDocKhach += 1;
            }
            hoiThoai.soChuaDoc = 0;
            hoiThoai.noiDungCuoi = noiDung;
            hoiThoai.thoiGianGuiCuoi = thoiGianGui;
            hoiThoai.nguoiGuiCuoi = 0;
            await hoiThoai.save();
            await TinNhan.create({
                idHoiThoai: parseInt(idKhachHang),
                nguoiGui: 0,
                noiDung: noiDung,
                thoiGianGui: thoiGianGui
            });
        }
        // Gửi tin nhắn đến Redis
        redis.publish("tin-nhan-nha-hang", JSON.stringify({idKhachHang, noiDung, thoiGianGui, socketId: socket.id}));
        redis.publish('dang-cap-nhat-du-lieu-chat', 'ok');
    });
    // Lắng nghe sự kiện nhà hàng đọc tin nhắn từ khách hàng
    socket.on("nha-hang-doc-tin-nhan", async(data) => {
        const { id } = data;
        // Lấy id  hội thoại cữ nếu có
        const idHoiThoaiCu = await redis.get(`${socket.id}-mo-hop-thoai`);
        redis.set(`${socket.id}-mo-hop-thoai`, id);
        redis.sadd('list-hop-thoai-mo', id);
        if(idHoiThoaiCu != null && idHoiThoaiCu != id){
            redis.srem('list-hop-thoai-mo', idHoiThoaiCu);
            HoiThoai.update(
                {
                  dangTraLoi: 0
                },
                {
                  where: {
                    id: idHoiThoaiCu
                  }
                }
            )
        }
        // console.log(id);
        // console.log(`idHoiThoaiCu: ${idHoiThoaiCu}`);
        // console.log(await redis.smembers('list-hop-thoai-mo'))
        HoiThoai.update(
            {
              soChuaDoc: 0,
              dangTraLoi: 1
            },
            {
              where: { id: id }
            }
        );
        redis.publish('phuc-vu-chon-hop-thoai', JSON.stringify({ id, idHoiThoaiCu, socketId: socket.id }));
        redis.publish('dang-cap-nhat-du-lieu-chat', 'ok');
    });

    socket.on("khach-hang-doc-tin-nhan", (data) => {
        const { idKhachHang, status } = data;
        redis.set(`trang-thai-chat-khach-hang-${idKhachHang}`, status ? "1" : "0");
        if(status){
            HoiThoai.update(
                {
                  soChuaDocKhach: 0
                },
                {
                  where: {
                    id: idKhachHang
                  }
                }
            )
        }
    });
    // Lắng nghe sự kiện phục vụ tham gia room hỗ trợ trực tuyến.
    socket.on("phuc-vu-vao-ho-tro",() => {
        socket.join("ho-tro-truc-tuyen");
        // console.log("Phục vụ vào hỗ trợ trực tuyến: ", socket.id);
        if (!Array.isArray(socket.data.rooms)) {
            socket.data.rooms = [];
        }
        if (!socket.data.rooms.includes('ho-tro-truc-tuyen')) {
            socket.data.rooms.push('ho-tro-truc-tuyen');
        }
        // console.log(socket.data.rooms);
    });
    // Lắng nghe sự kiện khách hàng vào chat
    socket.on("khach-hang-vao-chat",  (data) => {
        const { id } = data;
        if (!Array.isArray(socket.data.rooms)) {
            socket.data.rooms = [];
        }
        if (!socket.data.rooms.includes('nhan-ho-tro')) {
            socket.data.rooms.push('nhan-ho-tro');
        }
        socket.data.idKhachHang = id;
        redis.sadd(`danh-sach-khach-hang-online`, id);
        redis.publish("khach-hang-online", JSON.stringify({id}));
        KhachHang.update({
            hoatDong: 1
        }, {
            where: {
                id: id
            }
        })
        redis.publish('dang-cap-nhat-du-lieu-chat', 'ok');
    })
    // Lắng nghe sự kiện client ngắt kết nối
    socket.on("disconnect", async () => {
        // Nếu Phục vụ rời khỏi room hỗ trợ trực tuyến
        if(socket.data.rooms && socket.data.rooms.includes('ho-tro-truc-tuyen')) {
            const idHoiThoaiCu = await redis.get(`${socket.id}-mo-hop-thoai`);
            if(idHoiThoaiCu != null){
                redis.del(`${socket.id}-mo-hop-thoai`);
                redis.srem('list-hop-thoai-mo', idHoiThoaiCu);
                HoiThoai.update({
                    dangTraLoi: 0
                }, {
                    where: {
                        id: idHoiThoaiCu
                    }
                });
                redis.publish('phuc-vu-chon-hop-thoai', JSON.stringify({ id: null, idHoiThoaiCu, socketId: socket.id }));
                redis.publish('dang-cap-nhat-du-lieu-chat', 'ok');
            }
            // console.log('idHoiThoaiCu: ', idHoiThoaiCu);
            // console.log(await redis.smembers('list-hop-thoai-mo'));
        }
        else if(socket.data.rooms && socket.data.rooms.includes('nhan-ho-tro')) {
            const idKhachHang = socket.data.idKhachHang;
            await redis.del(`trang-thai-chat-khach-hang-${idKhachHang}`);
            redis.srem(`danh-sach-khach-hang-online`, idKhachHang);
            setTimeout(async () => {
                
                const onlines = await redis.smembers(`danh-sach-khach-hang-online`);
                const index = onlines.findIndex(id => id == idKhachHang);
                if(index == -1){
                    redis.publish("khach-hang-offline", JSON.stringify({ id: idKhachHang}));
                    KhachHang.update({
                        hoatDong: 0
                    }, {
                        where: {
                            id: idKhachHang
                        }
                    });
                    redis.publish('dang-cap-nhat-du-lieu-chat', 'ok');
                }
            }, 1500);
        }
        // console.log(socket.data)
    });



};
async function capNhatTraLoiHoiThoai(redis) {
    await redis.flushall();
    await HoiThoai.update({
        dangTraLoi: 0
    },
    {
        where: {
            
        }
    });
}
module.exports = chatService;
