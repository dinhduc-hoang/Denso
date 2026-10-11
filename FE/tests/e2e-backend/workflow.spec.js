import { expect, test } from "@playwright/test";

test("Express + MySQL: UI releases v1, uploads evidence, persists incident, reviews v2 and exports history", async ({
  page,
}) => {
  if (!process.env.E2E_PASSWORD)
    throw new Error(
      "Set E2E_PASSWORD for the seeded admin account and start BE before running this test.",
    );
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(process.env.E2E_EMAIL || "admin@demo.local");
  await page
    .getByLabel("Mật khẩu", { exact: true })
    .fill(process.env.E2E_PASSWORD);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("button", { name: "Đăng xuất" })).toBeVisible();
  await page.getByRole("button", { name: "Phiên mới", exact: true }).click();
  await page
    .getByRole("button", { name: "Bắt đầu phiên mới", exact: true })
    .click();
  await page.getByRole("button", { name: "Bắt đầu demo →" }).click();
  await page.getByRole("button", { name: "Tạo báo cáo mẫu →" }).click();
  await expect(page.getByText("Thiếu người / hạn")).toBeVisible();
  await page
    .getByLabel("Nội dung chuyên gia có thể chỉnh sửa")
    .fill("Kiểm tra ống kính theo SOP đã đối chiếu. Dừng nếu ảnh chưa đạt.");
  await page.getByRole("button", { name: "Lưu quyết định bản nháp" }).click();
  await expect(page.getByText("Đã lưu quyết định bản nháp.")).toBeVisible();
  await page.getByLabel(/Tôi đã đối chiếu nguồn/).check();
  await page.getByLabel(/Tôi xác nhận phạm vi/).check();
  await page.getByRole("button", { name: "Phê duyệt & phát hành v1" }).click();
  await page.getByRole("button", { name: "Xem kho tri thức →" }).click();
  await expect(page.getByText("Đã duyệt · v1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Thử tại sàn máy →" }).click();
  await page.getByRole("button", { name: "Tra cứu hướng dẫn →" }).click();
  await expect(
    page.getByRole("heading", { name: "Action Card · Ảnh mờ" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ghi nhận kết quả xử lý →" }).click();
  await page.getByRole("button", { name: /Chưa hiệu quả \/ chưa tự/ }).click();
  await page
    .getByLabel("Mô tả hiện trạng")
    .fill("Đã đối chiếu SOP, ảnh vẫn chưa đạt; cần kiểm tra ánh sáng.");
  await page.getByRole("button", { name: "Lưu mô tả hiện trạng" }).click();
  await expect(page.getByText("Đã lưu mô tả hiện trạng.")).toBeVisible();
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZvoAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .getByLabel("Ảnh hiện trường (tùy chọn)")
    .setInputFiles({
      name: "evidence.png",
      mimeType: "image/png",
      buffer: png,
    });
  await expect(page.getByText("Đã tải tệp lên máy chủ.")).toBeVisible();
  await page
    .getByRole("button", { name: "Kỹ sư tiếp nhận & ghi chú →" })
    .click();
  await page.getByRole("button", { name: "Điền ghi chú mẫu" }).click();
  await page
    .getByRole("button", { name: "Lưu ghi chú → tạo bản nháp" })
    .click();
  await expect(
    page.getByRole("button", { name: "Duyệt & phát hành v2" }),
  ).toBeDisabled();
  await page.getByLabel(/Tôi đã đối chiếu nội dung ghi chú/).check();
  await page.getByRole("button", { name: "Duyệt & phát hành v2" }).click();
  await page
    .getByRole("button", { name: "Xem v2 trong kho tri thức →" })
    .click();
  await expect(page.getByText("v1 · Quyết định từ cuộc họp")).toBeVisible();
  await expect(page.getByText("v2 · Bổ sung ghi chú kỹ sư")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất JSON tri thức" }).click();
  expect((await downloaded).suggestedFilename()).toMatch(
    /^knowledge-KB-.*\.json$/,
  );
  await page.reload();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Kho tri thức/ })
    .click();
  await expect(page.getByText("Đã duyệt · v2", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /Sự cố & phản hồi/ })
    .click();
  await expect(page.getByLabel("Mô tả hiện trạng")).toHaveValue(
    "Đã đối chiếu SOP, ảnh vẫn chưa đạt; cần kiểm tra ánh sáng.",
  );
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Đăng nhập", exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
