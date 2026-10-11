# Backend Meeting-to-Shopfloor

Express 5, Node.js 22.12+ và MySQL 8.0+. Backend lưu dữ liệu cho 7 màn hình FE:
đăng nhập, cuộc họp/transcript, báo cáo có nguồn, kiểm duyệt, tri thức có phiên bản,
tra cứu theo phạm vi, phản hồi, sự cố, ghi chú kỹ sư, bằng chứng và xuất JSON.

## Chạy local

```powershell
cd BE
npm.cmd ci
Copy-Item .env.example .env
```

Điền `.env`:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: kết nối MySQL của bạn.
- `SEED_PASSWORD`: mật khẩu ít nhất 12 ký tự cho tài khoản mẫu.
- `MYSQL_ROOT_PASSWORD`: mật khẩu root khác `DB_PASSWORD` nếu dùng Docker Compose.

Nếu chưa có MySQL và đã cài Docker, tạo database bằng:

```powershell
docker compose up -d --wait
```

Compose chỉ mở cổng MySQL trên `127.0.0.1`. Mặc định DB_USER là `shopfloor`.
Nếu sử dụng MySQL có sẵn, tạo user/database và cấp quyền cho database này trước.
Lần migration đầu cần quyền tạo database và bảng; các lần sau không thay đổi dữ liệu.

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Backend mặc định `http://127.0.0.1:3001`; `GET /api/health` kiểm tra MySQL.
Mở terminal thứ hai:

```powershell
cd FE
npm.cmd ci
npm.cmd run dev
```

FE mặc định gọi `/api` qua proxy Vite tới cổng 3001. Nếu BE dùng cổng khác,
điền `VITE_API_URL=http://127.0.0.1:<port>/api` trong `FE/.env` và bổ sung origin FE
vào `CORS_ORIGINS` của BE. Production cần HTTPS và reverse proxy `/api` tới BE
hoặc cấu hình `VITE_API_URL` trước build.

## Tài khoản và quyền

Sau seed, đăng nhập bằng mật khẩu `SEED_PASSWORD` đã đặt:

| Email | Quyền |
| --- | --- |
| `admin@demo.local` | Thực hiện toàn bộ vòng để kiểm thử |
| `coordinator@demo.local` | Tạo cuộc họp, tải đầu vào, tạo/sửa báo cáo |
| `expert@demo.local` | Sửa, trả lại và duyệt báo cáo/ghi chú |
| `engineer@demo.local` | Tiếp nhận sự cố, tải bằng chứng, tạo ghi chú |
| `worker@demo.local` | Tra cứu, phản hồi, tạo sự cố và tải ảnh cho sự cố mình tạo |

Seed mặc định nạp bộ dữ liệu đầy đủ: 8 tài khoản, 7 cuộc họp, 6 báo cáo,
5 hướng dẫn / 6 phiên bản, 6 sự cố, 4 ghi chú, 4 phản hồi, 7 tệp và 41 audit events.
Có cả bản nháp, yêu cầu chỉnh sửa, v1/v2 đã duyệt, hướng dẫn hết hạn/thu hồi
và các nhánh phản hồi. Chi tiết trong [docs/DATASET.md](docs/DATASET.md).

Tài khoản bổ sung: `quality@demo.local` (expert), `engineer.b@demo.local` (engineer),
`worker.b@demo.local` (worker). Muốn chỉ nạp tài khoản và cuộc họp `DR-024`,
dùng `npm run db:seed:minimal` trên database mới.
Seed chạy lại không ghi đè tài khoản, mật khẩu hoặc dữ liệu đã có.
Các tài khoản mẫu dùng cho phát triển; thay thế bằng danh tính cá nhân khi triển khai.
Mật khẩu băm scrypt; session token ngẫu nhiên được băm trong database, hết hạn sau 8 giờ.
Thay đổi vai trò trên FE không thể cấp quyền phê duyệt ở server.

## Chức năng và quy tắc

- Báo cáo mẫu giữ nguyên nguồn segment, ý kiến phản biện; người/hạn/setpoint thiếu giữ `null`.
- Sửa bản nháp có `revision`; bản cũ trả 409. Yêu cầu chỉnh sửa phải được xử lý trước khi duyệt.
- Duyệt v1 yêu cầu hai xác nhận; duyệt ghi chú yêu cầu xác nhận đã đối chiếu.
  Danh tính và thời điểm duyệt do server lấy từ session và MySQL.
- Duyệt diễn ra trong transaction, khóa bản ghi. Hai request đồng thời chỉ phát hành một lần.
- Phiên bản đã phát hành không bị sửa; v2/v3 giữ nguyên v1 và toàn bộ nguồn, người duyệt.
- Tra cứu chỉ lấy phiên bản hiện hành đã duyệt, còn hiệu lực, đúng máy/trạm/sản phẩm.
  Mã lỗi chưa biết không khớp hướng dẫn khác chỉ vì có cùng từ “ảnh mờ”.
- Phản hồi gắn với phiên bản thực sự đã sử dụng. Chưa hiệu quả tạo sự cố và lưu phản hồi cùng transaction.
- Sự cố chưa có hướng dẫn có thể tạo tri thức v1 mới sau chuyên gia duyệt ghi chú.
- Upload lưu byte thật trong `BE/uploads`, metadata trong MySQL; tệp được kiểm tra loại/đầu tệp,
  giới hạn mặc định 20 MB. Download yêu cầu đăng nhập, không phục vụ uploads như thư mục public.
- “Phiên mới” trên FE giữ dữ liệu và lịch sử ở server. Sửa quyết định/mô tả có nút lưu rõ ràng.
- PDF dùng chức năng in của trình duyệt; workflow/draw.io là assets FE.

Contract và quyền chi tiết: [docs/API.md](docs/API.md).

## Kiểm thử

```powershell
npm.cmd test
npm.cmd run check
```

Kiểm thử tích hợp gọi HTTP và MySQL thật. Bắt buộc database thử riêng có tên kết thúc `_test`:

```powershell
$env:DB_NAME='denso_shopfloor_test'
$env:NODE_ENV='test'
npm.cmd run db:migrate
npm.cmd run test:integration
```

Các lần chạy giữ dữ liệu thử trong database này và dùng tài khoản có ID riêng;
không xóa hoặc sửa dữ liệu ngoài database thử. Chạy lệnh trong terminal riêng để tránh
vô tình dùng `DB_NAME` thử cho server phát triển.

Kiểm thử FE với backend, sau khi khởi chạy BE và build FE ở chế độ mặc định:

```powershell
cd FE
npm.cmd run build
$env:E2E_EMAIL='admin@demo.local'
$env:E2E_PASSWORD='<mật khẩu seed của bạn>'
npm.cmd run test:e2e:backend
```

E2E cần Chrome, backend chạy ở 3001 và user admin. Test tạo cuộc họp/sự cố/bằng chứng mới;
dùng database thử riêng nếu không muốn thêm bản ghi vào dữ liệu phát triển.

## Giới hạn tích hợp

Tạo báo cáo hiện xử lý **transcript mẫu** theo logic có kiểm tra nguồn, gắn `mode: sample`.
Upload audio lưu tệp, chưa có phiên âm STT. Chưa gọi LLM/RAG, gửi email hay điều khiển PLC.
Transcript khác vẫn lưu được qua API nhưng tạo báo cáo bằng chế độ mẫu sẽ trả 422,
tránh thay thế dữ liệu người dùng bằng nội dung mẫu. FE hiển thị rõ phạm vi này.

Các bản ghi DB và uploads cần được backup cùng nhau. Dừng server bằng Ctrl+C.
`docker compose down` giữ volume database; khôi phục backup để quay lại dữ liệu cũ.
Không dùng `down -v` khi cần giữ lịch sử. Migrations là additive và không tự xóa dữ liệu.

Tham khảo triển khai: [Express error handling](https://expressjs.com/en/5x/guide/error-handling/),
[mysql2 prepared statements](https://sidorares.github.io/node-mysql2/docs/documentation/prepared-statements),
[MySQL locking reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html).
