import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { freshState, labels, STORAGE_KEY } from "../../src/lib/demo.js";

async function navigate(page, label) {
  await page
    .getByRole("navigation", { name: "Các bước demo" })
    .getByRole("button", { name: new RegExp(label) })
    .click();
}

test("complete v1 → failed feedback → reviewed v2, persistence, source and export", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Bắt đầu demo →" }).click();
  await page.getByRole("button", { name: "Tạo báo cáo mẫu →" }).click();
  await expect(page.getByText("Thiếu người / hạn")).toBeVisible();
  await page.getByRole("button", { name: /05:38 · Bất đồng/ }).click();
  await expect(page.getByRole("dialog")).toContainText("giữ lô và gọi kỹ sư");
  await page.keyboard.press("Escape");
  await page.getByLabel(/Tôi đã đối chiếu nguồn/).check();
  await page.getByLabel(/Tôi xác nhận phạm vi/).check();
  await page.getByRole("button", { name: "Phê duyệt & phát hành v1" }).click();
  await page.getByRole("button", { name: "Xem kho tri thức →" }).click();
  await page.getByRole("button", { name: "Thử tại sàn máy →" }).click();
  await page.getByLabel("Nhập mã lỗi hoặc triệu chứng").press("Enter");
  await expect(
    page.getByRole("heading", { name: "Action Card · Ảnh mờ" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ghi nhận kết quả xử lý →" }).click();
  await page.getByRole("button", { name: /Chưa hiệu quả \/ chưa tự/ }).click();
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
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất JSON tri thức" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "knowledge-demo.json",
  );
  await page.reload();
  await navigate(page, "Trợ lý");
  await page.getByRole("button", { name: "Tra cứu hướng dẫn →" }).click();
  await expect(page.getByText("Bổ sung từ kỹ sư · v2")).toBeVisible();
  await page
    .getByRole("button", { name: "Thử lỗi chưa có trong hệ thống" })
    .click();
  await expect(
    page.getByText("Không có hướng dẫn đã duyệt phù hợp"),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

for (const width of [320, 768, 1024, 1440]) {
  test(`all seven screens fit at ${width}px and have no WCAG A/AA violations`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const complete = {
      ...freshState(),
      processed: true,
      approved: true,
      confirmed: true,
      ack: true,
      searched: true,
      found: true,
      incident: true,
      noteDraft: true,
      noteApproved: true,
      cause: "Nguyên nhân mẫu.",
      note: "Ghi chú kỹ sư đã duyệt.",
    };
    await page.addInitScript(
      ({ key, state }) => localStorage.setItem(key, JSON.stringify(state)),
      { key: STORAGE_KEY, state: complete },
    );
    await page.goto("/");
    for (const label of labels) {
      await navigate(page, label);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath(
          `screen-${labels.indexOf(label)}-${width}.png`,
        ),
        fullPage: true,
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `Page overflow: ${label} at ${width}px`).toBe(false);
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(accessibility.violations, `${label} at ${width}px`).toEqual([]);
    }
  });
}

test("keyboard opens script, traps dialog focus and returns focus on Escape", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Kịch bản 3 phút" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => !!document.activeElement.closest('[role="dialog"]'),
      ),
    ).toBe(true);
  }
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
