module.exports = (io, subscriber) => {
        // Lắng nghe sự kiện từ Redis
        subscriber.on("message", (channel, message) => {
            if (channel === "tin-nhan-khach-hang") {
                const data = JSON.parse(message);
                io.to('ho-tro-truc-tuyen').emit("tin-nhan-khach-hang", data);   
            }
            else if (channel === "tin-nhan-nha-hang") {
                const data = JSON.parse(message);
                const { idKhachHang, noiDung, thoiGianGui, socketId } = data;
                io.emit(`tin-nhan-nha-hang-${idKhachHang}`, data);
                if(socketId){
                    io.to('ho-tro-truc-tuyen').except(socketId).emit(`tin-nhan-nha-hang`, {idKhachHang, noiDung, thoiGianGui});
                } 
            }else if (channel === "phuc-vu-chon-hop-thoai") {
                const data = JSON.parse(message);
                const { id, idHoiThoaiCu, socketId } = data;
                io.to('ho-tro-truc-tuyen').except(socketId).emit(`phuc-vu-chon-hop-thoai`, {id, idHoiThoaiCu});
            }
            else if (channel === "khach-hang-online") {
                const data = JSON.parse(message);
                const { id } = data;
                io.to('ho-tro-truc-tuyen').emit(`khach-hang-online`, {id});
            }
            else if (channel === "khach-hang-offline") {
                const data = JSON.parse(message);
                const { id } = data;
                io.to('ho-tro-truc-tuyen').emit(`khach-hang-offline`, {id});
            }
            else if (channel === "dang-cap-nhat-du-lieu-chat") {
                io.to('ho-tro-truc-tuyen').emit("dang-cap-nhat-du-lieu-chat", {});
            }
        });
}