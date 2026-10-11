import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [320, 768, 1024, 1440]) {
  test(`login fits at ${width}px and has no WCAG A/AA violations`, async ({
    page,
  }, testInfo) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Chào mừng trở lại" }),
    ).toBeVisible();
    await expect(
      page.getByText("admin@demo.local", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("DensoDemo@2026!", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({
      path: testInfo.outputPath(`login-${width}.png`),
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
}

test("demo fill, password visibility, pending state and authentication error work with keyboard", async ({
  page,
}) => {
  let releaseLogin;
  const responseGate = new Promise((resolve) => {
    releaseLogin = resolve;
  });
  await page.route("**/api/auth/login", async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "admin@demo.local",
      password: "DensoDemo@2026!",
    });
    await responseGate;
    await route.fulfill({
      status: 401,
      json: { error: { message: "Email hoặc mật khẩu không đúng." } },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Điền tài khoản dùng thử" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    "admin@demo.local",
  );
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveValue(
    "DensoDemo@2026!",
  );
  await expect(page.getByLabel("Email", { exact: true })).toBeFocused();
  const toggle = page.getByRole("button", { name: "Hiện mật khẩu" });
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Ẩn mật khẩu" }).click();
  await expect(page.getByLabel("Mật khẩu", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Đang kết nối…" }),
  ).toBeDisabled();
  await expect(page.getByLabel("Email", { exact: true })).toBeDisabled();
  releaseLogin();
  await expect(page.getByRole("alert")).toHaveText(
    "Email hoặc mật khẩu không đúng.",
  );
  await expect(
    page.getByRole("button", { name: "Đăng nhập", exact: true }),
  ).toBeEnabled();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
});
