# Chuyển từ HTML/JavaScript sang React

## Ánh xạ mã nguồn

| Trước | Sau |
| --- | --- |
| `dist/index.html` | `FE/index.html` + `src/main.jsx` |
| Hàm render và bind trong `dist/app.js` | `src/App.jsx`, JSX và React event handlers |
| 7 hàm màn hình trong `dist/app.js` | `src/pages/*.jsx` |
| State toàn cục và switch action | `src/lib/demo.js` + `src/hooks/DemoProvider.jsx` |
| Bằng chứng và dialog HTML | `src/lib/sources.js` + `src/components/DemoDialog.jsx` |
| HTML helpers button/pill/input/checkbox | shadcn/ui + `src/components/shared.jsx` |
| `dist/styles.css` | Tailwind utilities, theme và print styles trong `src/index.css` |
| SVG inline + `workflow.drawio` | `public/*.svg`, `public/workflow.drawio` |
| `tests/flow.test.cjs` với DOM giả | React Testing Library/Vitest + Playwright/axe |
| `docs/` | `FE/docs/` |

## Chạy và deploy

1. Sao chép toàn bộ thư mục `FE`.
2. Chạy `npm ci` trong `FE`, sau đó `npm run dev` để phát triển.
3. Chạy `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e` (cần Google Chrome).
4. Host nội dung `FE/dist` qua HTTP thay cho `dist` cũ. `npm run preview` kiểm tra bản build local.

## Dữ liệu demo hiện có

Khóa `meeting-shopfloor-demo-v1` và shape dữ liệu cũ được giữ lại. Nếu ứng dụng mới được phục vụ ở cùng origin (protocol/hostname/port), trạng thái demo hiện có được đọc tự động. Khi đổi origin, browser có localStorage riêng, không tự chuyển dữ liệu.

React kiểm tra kiểu dữ liệu, bắt lỗi JSON và bắt đầu ở Tổng quan khi tải lại, giống bản cũ. Trạng thái đã duyệt tiếp tục tồn tại qua reload. Trường hợp storage bị chặn vẫn dùng được phiên demo trong bộ nhớ.

Không dùng `innerHTML`, HTML template runtime hoặc `dangerouslySetInnerHTML`. Nội dung người dùng được React render thành text. Sửa quyết định xóa cả hai xác nhận; sửa truy vấn xóa kết quả cũ ngay. Ghi chú chưa duyệt chỉ xuất hiện trong màn hình kỹ sư/hàng đợi; chỉ bản đã duyệt mới vào Action Card.

## Verification

- Test luồng tạo báo cáo, duyệt v1, phản hồi hiệu quả/chưa hiệu quả, chuyển kỹ sư, bản nháp và duyệt v2.
- Test yêu cầu chỉnh sửa, ghi chú rỗng, yêu cầu v1 trước v2, trả lại bản nháp, escaping, tệp, in/PDF, JSON, reset và dữ liệu storage hỏng.
- E2E chạy production build, kiểm tra reload giữ dữ liệu, dialog có nguồn và download.
- E2E kiểm tra 7 màn hình desktop tại 1024/1440px, không tràn ngang toàn trang, axe WCAG A/AA và focus bàn phím. Mobile không thuộc phạm vi nghiệm thu.
- UI vẫn là prototype; chưa triển khai production hoặc tích hợp backend.
