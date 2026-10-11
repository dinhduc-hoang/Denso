# Meeting-to-Shopfloor Loop — DENSO Hackathon A2.1

Frontend **ReactJS (JavaScript/JSX), Tailwind CSS 4 và shadcn/ui**, chạy bằng Vite. Toàn bộ mã nguồn, assets, tài liệu và kiểm thử nằm trong thư mục `FE`; có thể sao chép riêng thư mục này để phát triển hoặc build.

## Kết nối backend

FE mặc định dùng backend Express + MySQL trong [`../BE`](../BE/README.md).
Khởi chạy BE ở cổng 3001 trước, rồi chạy Vite; `/api` được proxy tới BE.
Đăng nhập bằng tài khoản seed và mật khẩu đã cấu hình. Dữ liệu nghiệp vụ lưu trên server;
`sessionStorage` giữ session của tab và `localStorage` chỉ giữ ID phiên đang xem.
Quyết định bản nháp và mô tả sự cố có nút lưu; phê duyệt kiểm tra quyền tại server.
Chọn tệp trong chế độ backend tải nội dung thật lên server, chưa phiên âm audio.

Để chạy demo độc lập như hướng dẫn cũ bên dưới, đặt `VITE_DEMO_MODE=true` trong `.env`.
Build mặc định dùng backend. Kiểm tra demo cũ bằng `npm run build:demo` rồi `npm run test:e2e`.
Kiểm tra backend bằng `npm run build` rồi `npm run test:e2e:backend` với `E2E_PASSWORD` đã đặt;
chi tiết trong BE/README.md. Unit tests kiểm tra cả demo và phép chuyển dữ liệu từ server sang UI.

Các phần mô tả prototype và `localStorage` bên dưới áp dụng cho chế độ demo độc lập.

## Giao diện và kiểm tra responsive

Sidebar dùng nền slate, màu đỏ DENSO nhấn vào thao tác chính. Đăng nhập có tài khoản demo công khai, nút điền nhanh và hiện/ẩn mật khẩu. Các trang dùng chung kiểu panel, trạng thái và tiến trình phê duyệt; workflow có bản tóm tắt dễ đọc trên điện thoại.

`npm run test:e2e:login` kiểm tra đăng nhập ở 320/768/1024/1440px, thao tác bàn phím, trạng thái chờ và lỗi xác thực; không cần MySQL. `npm run build:demo` rồi `npm run test:e2e` kiểm tra cả 7 trang ở các kích thước trên, ảnh minh họa, WCAG A/AA và luồng phát hành v1 → v2. Build cuối để chạy backend dùng `npm run build`.

Quyết định thiết kế và kết quả thử skill Archify được ghi trong [`design/UI-NOTES.md`](design/UI-NOTES.md).

Nút **Mã nguồn** tải ZIP gồm FE, BE và README gốc; bỏ qua `.env`, uploads, database thử và node_modules.

## Chạy local

Yêu cầu Node.js 22.12+ (hoặc Node.js 24 LTS) và npm.

```bash
cd FE
npm ci
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal (mặc định `http://127.0.0.1:5173`). Nếu đã ở trong thư mục `FE`, bỏ qua `cd FE`. Trên Windows có PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay `npm`.

## Build và xem bản production

```bash
npm run build
npm run preview
```

Build tạo `FE/dist`. Đưa nội dung thư mục này lên static hosting. Phải phục vụ qua HTTP; không mở trực tiếp `index.html` bằng `file://`. Vite dùng `base: './'` để hỗ trợ host trong thư mục con. Điều hướng các màn hình được quản lý bằng trạng thái React, không yêu cầu rewrite URL ở server.

`npm run build` cũng tạo `public/source-code.zip` với mã nguồn trong một thư mục `FE` để nút **Mã nguồn** hoạt động. ZIP không chứa `node_modules`, build, kết quả test hoặc `.env`. Chạy `npm run build` trước nếu cần dùng nút tải mã nguồn ở dev server.

## Kiểm tra

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

Unit/integration test dùng Vitest + React Testing Library. E2E dùng Playwright với Google Chrome được cài trên máy, kiểm tra bản production, vòng v1 → v2, JSON download, bàn phím, dialog, 7 màn hình desktop ở 1024/1440px và accessibility với axe. E2E tự chạy preview trên cổng 4173. Nếu chỉ có Chromium của Playwright, bỏ `channel: 'chrome'` trong `playwright.config.js` và cài browser bằng `npx playwright install chromium`. Mobile không thuộc phạm vi nghiệm thu của lần chuyển đổi này.

## Cấu trúc

```text
FE/
  src/
    App.jsx                     Layout, điều hướng và thông báo
    main.jsx                    React entry point
    index.css                   Tailwind, theme và giao diện in
    pages/                      7 màn hình nghiệp vụ
    components/
      ui/                       Component chính thức từ shadcn/ui
      shared.jsx                Component nghiệp vụ dùng chung
      DemoDialog.jsx            Nguồn, kịch bản và xác nhận reset
    hooks/                      React context, reducer và persistence
    lib/                        Dữ liệu mẫu, chuyển trạng thái, xuất JSON
  public/                       SVG, workflow.drawio và ZIP sinh khi build
  docs/                         Kịch bản demo, contract AI, hướng dẫn migration
  tests/                        React integration, logic và Playwright E2E
  scripts/package-source.js     Đóng gói mã nguồn phục vụ nút download
  components.json               Cấu hình shadcn cho JavaScript
  jsconfig.json                 Alias @/*
  package.json
  package-lock.json
```

Thêm component shadcn từ thư mục `FE`: `npx shadcn@latest add <component>`. Nếu CLI tạo import `cn` từ package `cn`, đổi về `@/lib/utils` để dùng helper chung của project.

## Chức năng được giữ lại

- Tổng quan, workflow có file draw.io tải về và kịch bản thuyết trình 3 phút.
- Chọn audio/ảnh để ghi nhận tên, mô phỏng tạo báo cáo từ transcript mẫu.
- Báo cáo có nguồn, ý kiến phản biện, đầu việc thiếu người/hạn; sửa quyết định và yêu cầu chỉnh sửa.
- Phê duyệt v1 với hai xác nhận, khóa quyết định đã phát hành, in/lưu PDF qua trình duyệt.
- Kho tri thức, tra E-VIS-07, Action Card đúng tình huống mẫu và truy nguồn.
- Nhánh hiệu quả, chưa hiệu quả và lỗi chưa biết; chuyển kỹ sư và lưu phản hồi/ảnh.
- Ghi chú kỹ sư → bản nháp → duyệt v2; giữ lịch sử v1 và xuất JSON.
- Trạng thái lưu bằng `localStorage`; chỉ reset khi xác nhận trong dialog.

## Phạm vi prototype

Dữ liệu, SOP, vai trò, mã lỗi và nguồn đều minh họa, không phải dữ liệu/quy trình DENSO thật. Máy cố định CAM-02 / Demo A / S-01. Chọn tệp chỉ ghi tên, không upload hoặc xử lý nội dung. Báo cáo và tìm kiếm dùng dữ liệu mẫu. STT, LLM, RAG, database, xác thực/phân quyền, email, on-premise và PLC chưa kết nối. Phản hồi chưa phải RLHF.

Xem [kịch bản demo](docs/DEMO_SCRIPT.md), [contract AI và lộ trình](docs/IMPLEMENTATION.md), [hướng dẫn migration](docs/MIGRATION.md). Cấu hình stack theo [shadcn cho Vite](https://ui.shadcn.com/docs/installation/vite) và [Tailwind với Vite](https://tailwindcss.com/docs/installation/using-vite).
