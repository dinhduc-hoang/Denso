# Database mẫu đầy đủ

`npm run db:seed` nạp dữ liệu cho toàn bộ vòng nghiệp vụ. Dữ liệu là minh họa,
không phải SOP, kết quả sửa chữa hoặc danh tính nhân sự DENSO thật.

| Bảng | Bản ghi mẫu |
| --- | ---: |
| users | 8 |
| meetings | 7 |
| reports | 6 |
| knowledge | 5 |
| knowledge_versions | 6 |
| incidents | 6 |
| notes | 4 |
| feedback | 4 |
| files | 7 |
| audit_events | 41 |

`sessions` được tạo khi đăng nhập; không chứa phiên đăng nhập giả trong seed.
`schema_migrations` được điền bởi lệnh migration.

## Các tình huống có sẵn

| Tình huống | Bản ghi |
| --- | --- |
| Vòng đã phát hành v2, giữ v1, có ghi chú đã duyệt | DR-DEMO-024 / KB-VIS-024 / INC-DEMO-01 |
| Hướng dẫn v1 ở CAM-03 / Demo B / S-02, ghi chú chờ duyệt | DR-DEMO-023 / KB-VIS-023 / NOTE-DEMO-02 |
| Báo cáo nháp chưa được đưa vào tri thức | DR-DEMO-025 / REP-DEMO-025 |
| Báo cáo cần chỉnh sửa | DR-DEMO-026 / REP-DEMO-026 |
| Hướng dẫn hết hạn, không xuất hiện trong tra cứu | KB-VIS-021 |
| Hướng dẫn đã thu hồi, không xuất hiện trong tra cứu | KB-VIS-022 |
| Lỗi chưa có hướng dẫn, chờ kỹ sư | INC-DEMO-03 / E-NEW-99 |
| Sự cố đã xử lý, phản hồi hiệu quả của v2 | INC-DEMO-04 / FB-DEMO-02 |
| Ghi chú bị trả lại để bổ sung bằng chứng | INC-DEMO-05 / NOTE-DEMO-03 |
| Hướng dẫn v1 từ hiện trường cho lỗi ánh sáng | INC-DEMO-06 / KB-LIGHT-001 / E-LIGHT-02 |
| Cuộc họp đầu vào để bắt đầu luồng từ đầu | DR-024 |

FE mở vòng `DR-DEMO-024` khi chưa chọn phiên. Chọn **Phiên mới** để tạo một vòng mới;
database giữ nguyên các tình huống mẫu và lịch sử.

8 tài khoản gồm admin, coordinator, expert, engineer, worker, quality, engineer.b,
worker.b tại domain `demo.local`. Tài khoản mới dùng `SEED_PASSWORD` trong `BE/.env`.
Chạy seed lại giữ nguyên mật khẩu và mọi bản ghi có cùng ID, không đặt lại trạng thái duyệt.
Các ID cố định cho phép chạy nhiều lần mà không tạo dữ liệu trùng.

## Tệp mẫu

Seed tạo metadata và byte tệp thật trong `BE/uploads`: một WAV im lặng 1 giây,
hai PDF minh họa và bốn PNG phác thảo camera. Đây là fixtures cho upload/download,
không phải ghi âm cuộc họp hay ảnh kiểm tra tại nhà máy. Tệp mất có thể được tạo lại
bằng seed; tệp đang có không bị ghi đè. Download yêu cầu đăng nhập.

## MySQL local trong workspace

Phiên local hiện tại dùng MySQL có sẵn trong Ubuntu/WSL:

- Host `127.0.0.1`, port `33316`, database `denso_shopfloor`.
- Tài khoản ứng dụng `shopfloor`; thông tin kết nối nằm trong `BE/.env`.
- Data directory `BE/.local/mysql`; giữ thư mục này để giữ dữ liệu.
- Cấu hình quản trị nằm trong `BE/.local/mysql-admin.json`, không đưa vào source ZIP.

Sau khi khởi động lại máy:

```powershell
cd BE
npm.cmd run db:local:start
npm.cmd run db:local:status
npm.cmd run dev
```

`db:local:start` dành cho Windows có Ubuntu/WSL và thư mục data đã được khởi tạo;
lệnh không tự cài MySQL. Có thể dùng MySQL/Docker khác bằng cách đổi `BE/.env`.

Dừng MySQL local và giữ dữ liệu:

```powershell
npm.cmd run db:local:stop
```

Chỉ cần `npm run db:migrate` rồi `npm run db:seed` để nạp bộ dữ liệu này vào database khác.
Muốn bắt đầu với tài khoản và đầu vào, dùng `npm run db:seed:minimal` trên database mới;
lệnh đó không xóa dữ liệu full đã có.
