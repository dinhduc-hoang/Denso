# Deploy bằng Docker: Render + Aiven MySQL

Ứng dụng chạy FE và Express trong một Docker image trên Render Web Service `free`. Dockerfile dùng Node 22.22.0, build frontend ở stage riêng, chỉ đưa backend dependencies production và frontend đã build vào image chạy bằng user `node`. MySQL dùng Aiven; file upload lưu trong bảng `file_contents` để giữ dữ liệu khi Render restart hoặc redeploy.

## Chuẩn bị

1. Push mã nguồn lên GitHub, gồm `Dockerfile`, `.dockerignore`, `render.yaml`, `FE`, `BE` và `deploy`.
2. Đăng nhập [Render Dashboard](https://dashboard.render.com) và cấp quyền đọc repository khi tạo Blueprint.
3. Tạo MySQL bên ngoài, ví dụ tại [Aiven Console](https://console.aiven.io). Lấy host, port, user, password, database và CA Certificate trong Connection information. Cấu hình hiện dùng database `defaultdb` và TLS.

## Deploy trên Render

1. Chọn **New → Blueprint**, chọn repository và branch đã có cấu hình Docker.
2. Render đọc `render.yaml`: một Web Service **Free**, runtime **Docker**, region **Singapore**, Dockerfile `./Dockerfile`, build context là thư mục gốc repository. Cấu hình không tạo database hoặc disk trả phí.
3. Điền `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_CA` theo MySQL của bạn. Sửa `DB_NAME` nếu database không tên `defaultdb`. CA là toàn bộ nội dung PEM, không phải tên file; có thể dán nhiều dòng hoặc dùng ký tự `\n`. Không đưa mật khẩu database vào GitHub hoặc ZIP mã nguồn.
4. Chọn **Deploy Blueprint**, theo dõi logs đến khi health check thành công rồi mở URL `https://<service-name>.onrender.com` do Render cấp.

Nếu tạo thủ công bằng **New → Web Service**, chọn repository, **Language: Docker**, **Dockerfile Path: ./Dockerfile**, để **Root Directory** trống, chọn **Free** và **Singapore**. Chép các environment variables trong `render.yaml` vào service; điền giá trị thật cho các biến `sync: false`. Đặt health check `/api/health`, để **Docker Command** trống để dùng `CMD` của image. Không điền Build/Start Command của Node.

Render build image từ Dockerfile và tự cấp `PORT`; ứng dụng lắng nghe `0.0.0.0` trên port này (mặc định image là `10000`). Health check `/api/health` kiểm tra kết nối MySQL. Frontend luôn build với `/api` và chế độ backend thật. `DB_SSL=true` xác thực CA và hostname, `FILE_STORAGE=mysql`, `SERVE_FRONTEND=true`, `TRUST_PROXY=1`. Upload tối đa 5 MB. Biến database và `SEED_PASSWORD` chỉ dùng lúc chạy container, không truyền vào Docker build.

Startup chạy migration có khóa chống chạy đồng thời, sau đó seed nếu có `SEED_PASSWORD`. Seed bổ sung bản ghi còn thiếu, giữ nguyên dữ liệu và mật khẩu đã có. Không gọi script reset database. Cấu hình demo dùng `SEED_PASSWORD=DensoDemo@2026!`, khớp tài khoản hiển thị trên frontend.

Local mặc định dùng filesystem; muốn chuyển dữ liệu local có sẵn sang chế độ MySQL phải nhập cả file bytes vào `file_contents` trước, không chỉ đổi biến môi trường.

## Chạy Docker tại máy local

Cần Docker đang chạy và MySQL có thể truy cập từ container. Chạy từ thư mục gốc repository:

```powershell
docker build -t denso-meeting-shopfloor .
Copy-Item deploy/.env.example deploy/.env.docker
# Điền host, port, user, password và CA của MySQL vào deploy/.env.docker.
docker run --rm --name denso-meeting-shopfloor -p 10000:10000 --env-file deploy/.env.docker denso-meeting-shopfloor
```

Mở `http://localhost:10000`. Với MySQL chạy trên máy Windows dùng Docker Desktop, đặt `DB_HOST=host.docker.internal`, `DB_PORT=3306`, `DB_SSL=false`, `DB_SSL_CA=` và `DB_NAME` theo database local. Không dùng `127.0.0.1` làm database host vì đó là địa chỉ của container. File `deploy/.env.docker` được loại khỏi Git và Docker build context; với `--env-file`, ghi CA trên một dòng dùng ký tự `\n` giữa các dòng PEM. Dừng bằng `docker stop denso-meeting-shopfloor` ở terminal khác.

Kiểm tra image bằng `docker inspect --format '{{.State.Health.Status}}' denso-meeting-shopfloor` và API bằng `curl.exe http://localhost:10000/api/health`. Build thành công chưa đủ: cần database kết nối được để container migrate, seed và mở HTTP server.

## Kiểm tra sau deploy

- URL gốc hiển thị trang đăng nhập; `/api/health` trả `data.status: ok` và `data.database: mysql`.
- Đăng nhập bằng `admin@demo.local` / `DensoDemo@2026!` với database vừa seed bằng cấu hình mặc định.
- Mở đủ 7 màn hình, tra cứu `E-VIS07` với `CAM02 / DemoA / S01`.
- Tạo cuộc họp, upload ảnh/PDF/audio; restart hoặc redeploy rồi tải lại file và kiểm tra dữ liệu vẫn còn.
- API yêu cầu xác thực; đường dẫn API sai trả JSON, không trả trang HTML.

Kiểm thử tự động với MySQL thử riêng: trong `BE`, đặt `DB_NAME` kết thúc `_test`, `FILE_STORAGE=mysql`, rồi chạy `npm run test:cloud`. Bộ test kiểm tra seed, quyền, luồng duyệt, tệp và restart. E2E từ `FE`: đặt `E2E_BASE_URL` bằng URL cần kiểm tra và `E2E_PASSWORD` bằng mật khẩu đã seed, chạy `npm run test:e2e:cloud`. Test tạo cuộc họp/sự cố mới để kiểm tra đủ workflow.

## Vận hành và rollback

Xem [giới hạn Render Free](https://render.com/docs/free) trước khi chọn gói. Dung lượng upload phụ thuộc gói MySQL; theo dõi dung lượng database. Nếu nhà cung cấp dừng database, bật lại ở Console rồi kiểm tra `/api/health`.

Nếu deploy lỗi, giữ service và database hiện có, kiểm tra logs, sửa environment rồi redeploy. Nếu bản code mới lỗi, dùng Rollback của Render về deploy tốt trước đó; migration 002 chỉ thêm bảng, không xóa dữ liệu. Sao lưu MySQL trước các thay đổi dữ liệu về sau. Không xóa database để chữa lỗi build.

Tham khảo: [Docker trên Render](https://render.com/docs/docker), [cấu hình Blueprint cho Docker](https://render.com/docs/blueprint-spec#docker), [host và port của Web Service](https://render.com/docs/web-services#port-binding).
