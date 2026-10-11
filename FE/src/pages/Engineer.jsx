import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ActButton,
  DemoField,
  Divider,
  Locked,
  Note,
  PageHead,
  Panel,
  Pill,
  ReviewCheck,
  SourceButton,
} from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";

function NoteApproval() {
  const { state, act, backend, user, serverData } = useDemo();
  const releaseVersion = backend
    ? (serverData?.knowledge?.version || 0) + (state.noteApproved ? 0 : 1)
    : 2;
  const [reviewed, setReviewed] = useState(false);
  return (
    <Panel>
      <div className="panel-head">
        <h2>Kiểm duyệt tri thức mới</h2>
        <Pill tone="red">Chuyên gia</Pill>
      </div>
      {state.noteApproved ? (
        <>
          <Note tone="green">
            <b>v{releaseVersion} đã hiệu lực</b>
            <br />
            Phiên bản trước được giữ trong lịch sử. Tra cứu tiếp theo sẽ hiển
            thị ghi chú đã duyệt.
          </Note>
          <ActButton action="knowledge">Xem v2 trong kho tri thức →</ActButton>
        </>
      ) : state.noteDraft ? (
        <>
          <Note tone="amber">
            <b>Bản nháp từ kỹ sư không tự trở thành quy trình chuẩn.</b> Chuyên
            gia cần đối chiếu phương án, bằng chứng và phạm vi.
          </Note>
          <ReviewCheck
            id="note-review"
            checked={reviewed}
            onCheckedChange={(value) => setReviewed(value === true)}
          >
            Tôi đã đối chiếu nội dung ghi chú mẫu, xác nhận giới hạn áp dụng và
            cho phép phát hành phiên bản mới.
          </ReviewCheck>
          <div className="row-actions">
            <Button
              disabled={
                !reviewed ||
                (backend && !["expert", "admin"].includes(user.role))
              }
              onClick={() => act("approve-note", { reviewed })}
            >
              Duyệt & phát hành v{releaseVersion}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReviewed(false);
                act("return-note");
              }}
            >
              Trả lại để chỉnh sửa
            </Button>
          </div>
          <p className="tiny muted mt-3">
            {backend
              ? "Server kiểm tra phạm vi, phiên bản gốc và danh tính người duyệt trước khi phát hành."
              : "Demo yêu cầu duyệt báo cáo v1 trước khi phát hành v2 từ ghi chú hiện trường."}
          </p>
        </>
      ) : (
        <p className="tiny muted">
          Lưu nguyên nhân và phương án xử lý trước. Bản nháp sẽ xuất hiện tại
          đây để chuyên gia duyệt.
        </p>
      )}
    </Panel>
  );
}

export default function Engineer() {
  const { state, backend, serverData } = useDemo();
  const version =
    serverData?.knowledge?.version || (state.noteApproved ? 2 : 1);
  if (!state.incident)
    return (
      <Locked
        title="Chưa có sự cố chuyển kỹ sư"
        description="Từ trợ lý sàn máy, chọn lỗi chưa có hướng dẫn hoặc phản hồi chưa hiệu quả."
        page={4}
        label="Mở trợ lý sàn máy"
      />
    );
  return (
    <>
      <PageHead
        tag="06 / Kỹ sư hiện trường"
        title="Giữ lại cách xử lý vừa tìm được"
        description="Ghi chú được lưu thành bản nháp. Chỉ sau kiểm duyệt, tri thức mới trở thành hướng dẫn tái sử dụng."
      >
        <Pill tone={state.noteApproved ? "green" : "amber"}>
          {state.noteApproved
            ? `Đã phát hành v${version}`
            : state.noteDraft
              ? `v${backend ? (serverData?.knowledge?.version || 0) + 1 : 2} · Chờ duyệt`
              : "Ghi chú mới"}
        </Pill>
      </PageHead>
      <div className="grid2">
        <Panel>
          <div className="panel-head">
            <h2>{serverData?.incident?.id || "INC-DEMO-01"} · CAM-02</h2>
            <Pill>Nguồn hiện trường</Pill>
          </div>
          <p className="tiny muted">
            {backend
              ? "Nguyên nhân, phương án và ảnh của sự cố được lưu thành bản nháp. Chuyên gia duyệt trước khi phát hành."
              : "Chỉ minh họa thao tác lưu ghi chú. Không có xác nhận sửa chữa hoặc bằng chứng thực từ máy."}
          </p>
          <DemoField
            field="cause"
            label="Nguyên nhân thực tế do kỹ sư xác nhận"
            multiline
            readOnly={state.noteDraft}
            placeholder="Ghi nhận điều đã kiểm tra và bằng chứng..."
          />
          <DemoField
            field="note"
            id="field-note"
            label="Phương án xử lý & điều kiện áp dụng"
            multiline
            readOnly={state.noteDraft}
            placeholder="Các bước đã làm, kết quả và giới hạn áp dụng..."
          />
          {!state.noteDraft ? (
            <div className="row-actions">
              <ActButton action="sample-note" secondary>
                Điền ghi chú mẫu
              </ActButton>
              <ActButton action="save-note">
                Lưu ghi chú → tạo bản nháp
              </ActButton>
            </div>
          ) : (
            <>
              <Note tone={state.noteApproved ? "green" : "amber"}>
                {state.noteApproved
                  ? `Ghi chú đã được duyệt và phát hành v${version}.`
                  : "Ghi chú đang chờ chuyên gia. Công nhân vẫn chỉ thấy hướng dẫn v1 đã duyệt (nếu đã có)."}
              </Note>
              <SourceButton source="field">Xem nguồn hiện trường</SourceButton>
            </>
          )}
          <Divider />
          <h3>Bằng chứng và phạm vi</h3>
          <p className="tiny muted">
            CAM-02 / Demo A / S-01. Ghi chú minh họa đính kèm với case, kết quả
            kiểm tra và người phụ trách. Khi triển khai thật cần ảnh/log và chữ
            ký người có thẩm quyền.
          </p>
        </Panel>
        <aside>
          <NoteApproval key={state.noteDraft ? "draft" : "edit"} />
          <div className="next-block">
            <h2 className="text-sm">Vòng lặp đã khép kín</h2>
            <p>
              Cuộc họp tạo tri thức. Hiện trường kiểm chứng và bổ sung. Chuyên
              gia kiểm soát mỗi lần phát hành.
            </p>
            <ActButton action="overview">Quay lại workflow</ActButton>
          </div>
        </aside>
      </div>
    </>
  );
}
