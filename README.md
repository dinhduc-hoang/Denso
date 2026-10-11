# Meeting-to-Shopfloor Loop — DENSO Hackathon A2.1

Dự án gồm frontend [`FE`](FE/README.md) và backend **Express + MySQL** [`BE`](BE/README.md).
FE mặc định đăng nhập và gọi backend. Xem [hướng dẫn cài database, seed và chạy toàn bộ ứng dụng](BE/README.md).

```powershell
cd BE
npm.cmd ci
Copy-Item .env.example .env
# Điền cấu hình MySQL và SEED_PASSWORD vào .env
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Mở terminal thứ hai chạy FE theo hướng dẫn dưới đây. Muốn dùng demo độc lập,
đặt `VITE_DEMO_MODE=true` trong `FE/.env`.

```bash
cd FE
npm ci
npm run dev
```

Build: `npm run build` → `FE/dist`.

Kiểm tra FE: `npm run lint`, `npm test`. E2E backend: `npm run test:e2e:backend` sau build mặc định,
cần BE đang chạy và `E2E_PASSWORD`. E2E demo độc lập: `npm run build:demo` rồi `npm run test:e2e`.
Các E2E cần Google Chrome. Kiểm tra BE: `npm test`, `npm run check`, `npm run test:integration`
(database riêng kết thúc `_test`; xem BE/README.md).

Xem [hướng dẫn đầy đủ](FE/README.md) và [tài liệu migration](FE/docs/MIGRATION.md). Ứng dụng giữ đủ 7 màn hình và các luồng demo hiện có; lần chuyển đổi này tập trung giao diện desktop.
