import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "@/App";
import { freshState, STORAGE_KEY } from "@/lib/demo";

function start(overrides = {}) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...freshState(), ...overrides }),
  );
  const user = userEvent.setup();
  render(<App />);
  return user;
}
async function navigate(user, label) {
  await user.click(
    within(screen.getByRole("navigation", { name: "Các bước demo" })).getByRole(
      "button",
      { name: new RegExp(label) },
    ),
  );
}
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY));
const reviewed = {
  processed: true,
  approved: true,
  confirmed: true,
  ack: true,
};

describe("Meeting-to-Shopfloor React migration", () => {
  it("blocks unreviewed approval and refuses operator guidance from a draft", async () => {
    const user = start({ processed: true });
    await navigate(user, "Báo cáo");
    expect(
      screen.getByRole("button", { name: "Phê duyệt & phát hành v1" }),
    ).toBeDisabled();
    await navigate(user, "Trợ lý");
    await user.click(
      screen.getByRole("button", { name: "Tra cứu hướng dẫn →" }),
    );
    expect(
      screen.getByText("Không có hướng dẫn đã duyệt phù hợp"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Action Card · Ảnh mờ")).not.toBeInTheDocument();
    expect(saved().found).toBe(false);
  });

  it("extracts a report while retaining dispute and missing assignments", async () => {
    const user = start();
    await user.click(screen.getByRole("button", { name: "Bắt đầu demo →" }));
    await user.click(screen.getByRole("button", { name: "Tạo báo cáo mẫu →" }));
    expect(screen.getByRole("status", { busy: true })).toHaveTextContent(
      "Trích xuất quyết định",
    );
    await screen.findByText("Thiếu người / hạn", {}, { timeout: 2500 });
    expect(
      screen.getByText("05. Rủi ro & ý kiến phản biện"),
    ).toBeInTheDocument();
    expect(saved().processed).toBe(true);
  });

  it("invalidates confirmations whenever the decision changes or a revision is requested", async () => {
    const user = start({ processed: true, confirmed: true, ack: true });
    await navigate(user, "Báo cáo");
    await user.type(
      screen.getByLabelText("Nội dung chuyên gia có thể chỉnh sửa"),
      " Bổ sung.",
    );
    expect(screen.getByLabelText(/Tôi đã đối chiếu nguồn/)).not.toBeChecked();
    expect(screen.getByLabelText(/Tôi xác nhận phạm vi/)).not.toBeChecked();
    await user.click(screen.getByLabelText(/Tôi đã đối chiếu nguồn/));
    await user.click(screen.getByLabelText(/Tôi xác nhận phạm vi/));
    await user.click(screen.getByRole("button", { name: "Yêu cầu chỉnh sửa" }));
    expect(saved()).toMatchObject({
      confirmed: false,
      ack: false,
      revisionRequested: true,
    });
  });

  it("publishes reviewed v1 and records effective feedback", async () => {
    const user = start({ processed: true });
    await navigate(user, "Báo cáo");
    await user.click(screen.getByLabelText(/Tôi đã đối chiếu nguồn/));
    await user.click(screen.getByLabelText(/Tôi xác nhận phạm vi/));
    await user.click(
      screen.getByRole("button", { name: "Phê duyệt & phát hành v1" }),
    );
    await navigate(user, "Trợ lý");
    await user.click(
      screen.getByRole("button", { name: "Tra cứu hướng dẫn →" }),
    );
    expect(screen.getByText("Action Card · Ảnh mờ")).toBeInTheDocument();
    expect(screen.getByText("Nguồn đã duyệt")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Ghi nhận kết quả xử lý →" }),
    );
    await user.click(screen.getByRole("button", { name: /✓ Hiệu quả/ }));
    expect(screen.getByText("Đã ghi nhận ✓")).toBeInTheDocument();
    expect(saved()).toMatchObject({ closed: true, feedback: "Hiệu quả" });
  });

  it("transfers failed guidance to an engineer, validates notes and publishes reviewed v2", async () => {
    const user = start(reviewed);
    await navigate(user, "Trợ lý");
    await user.click(
      screen.getByRole("button", { name: "Tra cứu hướng dẫn →" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Ghi nhận kết quả xử lý →" }),
    );
    await user.click(
      screen.getByRole("button", { name: /Chưa hiệu quả \/ chưa tự/ }),
    );
    expect(saved()).toMatchObject({ incident: true, closed: false, page: 5 });
    await user.click(
      screen.getByRole("button", { name: "Kỹ sư tiếp nhận & ghi chú →" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Lưu ghi chú → tạo bản nháp" }),
    );
    expect(saved().noteDraft).toBe(false);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Cần điền cả nguyên nhân",
    );
    await user.click(screen.getByRole("button", { name: "Điền ghi chú mẫu" }));
    await user.click(
      screen.getByRole("button", { name: "Lưu ghi chú → tạo bản nháp" }),
    );
    expect(
      screen.getByRole("button", { name: "Duyệt & phát hành v2" }),
    ).toBeDisabled();
    await navigate(user, "Trợ lý");
    await user.click(
      screen.getByRole("button", { name: "Tra cứu hướng dẫn →" }),
    );
    expect(screen.queryByText("Bổ sung từ kỹ sư · v2")).not.toBeInTheDocument();
    await navigate(user, "Ghi chú");
    await user.click(
      screen.getByLabelText(/Tôi đã đối chiếu nội dung ghi chú/),
    );
    await user.click(
      screen.getByRole("button", { name: "Duyệt & phát hành v2" }),
    );
    await navigate(user, "Kho tri thức");
    expect(screen.getByText("v1 · Quyết định từ cuộc họp")).toBeInTheDocument();
    expect(screen.getByText("v2 · Bổ sung ghi chú kỹ sư")).toBeInTheDocument();
    await navigate(user, "Trợ lý");
    await user.click(
      screen.getByRole("button", { name: "Tra cứu hướng dẫn →" }),
    );
    expect(screen.getByText("Bổ sung từ kỹ sư · v2")).toBeInTheDocument();
  });

  it("requires v1 before publishing field notes and resets review when notes are returned", async () => {
    const user = start({
      incident: true,
      cause: "Nguyên nhân mẫu",
      note: "Ghi chú mẫu",
      noteDraft: true,
    });
    await navigate(user, "Ghi chú");
    await user.click(
      screen.getByLabelText(/Tôi đã đối chiếu nội dung ghi chú/),
    );
    await user.click(
      screen.getByRole("button", { name: "Duyệt & phát hành v2" }),
    );
    expect(saved().noteApproved).toBe(false);
    expect(
      screen.getByRole("heading", { name: "Chưa có báo cáo" }),
    ).toBeInTheDocument();
    await navigate(user, "Ghi chú");
    await user.click(
      screen.getByRole("button", { name: "Trả lại để chỉnh sửa" }),
    );
    expect(
      screen.getByLabelText("Phương án xử lý & điều kiện áp dụng"),
    ).not.toHaveAttribute("readonly");
    await user.click(
      screen.getByRole("button", { name: "Lưu ghi chú → tạo bản nháp" }),
    );
    expect(
      screen.getByRole("button", { name: "Duyệt & phát hành v2" }),
    ).toBeDisabled();
  });

  it("routes unknown faults to an engineer and clears stale results after editing a query", async () => {
    const user = start(reviewed);
    await navigate(user, "Trợ lý");
    await user.click(
      screen.getByRole("button", { name: "Tra cứu hướng dẫn →" }),
    );
    await user.type(
      screen.getByLabelText("Nhập mã lỗi hoặc triệu chứng"),
      " mới",
    );
    expect(screen.queryByText("Action Card · Ảnh mờ")).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Thử lỗi chưa có trong hệ thống" }),
    );
    expect(
      screen.getByText("Không có hướng dẫn đã duyệt phù hợp"),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Tạo yêu cầu kỹ sư →" }),
    );
    expect(saved()).toMatchObject({ found: false, incident: true, page: 5 });
  });

  it("renders user markup as plain text and displays live evidence in an accessible dialog", async () => {
    const dangerous = "<img src=x onerror=alert(1)>";
    const user = start({
      ...reviewed,
      incident: true,
      cause: dangerous,
      note: dangerous,
      noteDraft: true,
    });
    await navigate(user, "Ghi chú");
    await user.click(
      screen.getByRole("button", { name: /Xem nguồn hiện trường/ }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(dangerous)).toBeInTheDocument();
    expect(dialog.querySelector("img")).toBeNull();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: /Xem nguồn hiện trường/ }),
    ).toHaveFocus();
  });

  it("records filenames, prints and downloads the approved knowledge JSON", async () => {
    const user = start(reviewed);
    await navigate(user, "Cuộc họp");
    await user.upload(
      screen.getByLabelText("Ghi âm cuộc họp"),
      new File(["sample"], "meeting.wav", { type: "audio/wav" }),
    );
    expect(saved().audio).toBe("meeting.wav");
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    await navigate(user, "Báo cáo");
    await user.click(screen.getByRole("button", { name: "In / lưu PDF" }));
    expect(print).toHaveBeenCalledOnce();
    URL.createObjectURL = vi.fn(() => "blob:demo");
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    await navigate(user, "Kho tri thức");
    await user.click(
      screen.getByRole("button", { name: "Xuất JSON tri thức" }),
    );
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });

  it("keeps persisted demo data on remount and clears it only after reset confirmation", async () => {
    const user = start({
      ...reviewed,
      incident: true,
      noteDraft: true,
      noteApproved: true,
      cause: "Mẫu",
      note: "Đã duyệt",
    });
    await user.click(screen.getByRole("button", { name: "Làm lại demo" }));
    await user.click(screen.getByRole("button", { name: "Hủy" }));
    expect(saved().approved).toBe(true);
    await user.click(screen.getByRole("button", { name: "Làm lại demo" }));
    await user.click(screen.getByRole("button", { name: "Xóa & bắt đầu lại" }));
    expect(saved()).toMatchObject({
      approved: false,
      noteDraft: false,
      noteApproved: false,
      page: 0,
    });
  });

  it("recovers safely from corrupt or incorrectly typed stored data", async () => {
    localStorage.setItem(STORAGE_KEY, "{bad json");
    const first = render(<App />);
    expect(saved().approved).toBe(false);
    first.unmount();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ decision: null, note: 1, approved: true, query: [] }),
    );
    render(<App />);
    expect(saved()).toMatchObject({
      approved: false,
      decision: freshState().decision,
      note: "",
    });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Quyết định trong họp.",
    );
  });

  it("opens and closes the presentation script", async () => {
    const user = start();
    await user.click(screen.getByRole("button", { name: "Kịch bản 3 phút" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "2:35–3:00 · Khép vòng",
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
});
