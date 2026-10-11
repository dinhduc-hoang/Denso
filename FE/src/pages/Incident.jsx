import { Button } from "@/components/ui/button";
import {
  ActButton,
  DemoField,
  FileField,
  Locked,
  Note,
  PageHead,
  Panel,
  Pill,
  SourceButton,
} from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";

export default function Incident() {
  const { state, act, backend, serverData } = useDemo();
  if (!state.found && !state.incident)
    return (
      <Locked
        title="Chưa có phiên xử lý lỗi"
        description="Tra cứu một mã lỗi tại sàn máy để ghi nhận kết quả hoặc chuyển kỹ sư."
        page={4}
        label="Đến trợ lý sàn máy"
      />
    );
  return (
    <>
      <PageHead
        tag="05 / Phản hồi hiện trường"
        title="Một kết quả xử lý. Một vòng tri thức."
        description="Ghi nhận hiệu quả hoặc tạo yêu cầu kỹ sư khi công nhân chưa thể giải quyết."
      >
        <Pill tone={state.incident ? "amber" : ""}>
          {state.incident
            ? serverData?.incident?.id || "INC-DEMO-01"
            : "Phiên xử lý"}
        </Pill>
      </PageHead>
      <div className="grid2">
        <Panel>
          <h2>
            {state.incident
              ? "Yêu cầu kỹ sư hiện trường"
              : "Kết quả sử dụng hướng dẫn"}
          </h2>
          <div className="meta">
            <span>
              Máy <b>CAM-02</b>
            </span>
            <span className="break-all">
              Lỗi <b>{state.query}</b>
            </span>
          </div>
          {state.closed ? (
            <>
              <Note tone="green">
                <b>Đã ghi nhận hiệu quả trong demo</b>
                <br />
                Phản hồi gắn với hướng dẫn {state.noteApproved ? "v2" : "v1"}.
                Việc cho máy chạy lại vẫn theo quyền hạn và quy trình nhà máy.
              </Note>
              <div
                className="my-3 text-3xl font-bold text-success"
                role="status"
              >
                Đã ghi nhận ✓
              </div>
              <p className="tiny muted">
                Hướng dẫn có thể tái sử dụng trong cùng phạm vi khi còn hiệu
                lực.
              </p>
              <ActButton action="retry" secondary>
                Thử nhánh chưa hiệu quả
              </ActButton>
            </>
          ) : state.incident ? (
            <>
              <Note tone="amber">
                <b>Đã tạo yêu cầu · Chờ kỹ sư</b>
                <br />
                {backend
                  ? "Tóm tắt lỗi, thiết bị, phiên bản đã thử và phản hồi được lưu trên máy chủ."
                  : "Tóm tắt lỗi, thiết bị, phiên bản hướng dẫn đã thử và phản hồi được đính kèm trong bản ghi demo."}
              </Note>
              <DemoField
                field="feedback"
                id="incident-note"
                label="Mô tả hiện trạng"
                multiline
                placeholder="Ảnh vẫn mờ sau kiểm tra theo hướng dẫn..."
              />
              {backend && (
                <ActButton action="save-feedback" secondary>
                  Lưu mô tả hiện trạng
                </ActButton>
              )}
              <FileField
                id="field-image"
                field="attachment"
                label="Ảnh hiện trường (tùy chọn)"
                accept="image/*"
              />
              <p className="tiny muted break-all">
                {state.attachment ||
                  (backend
                    ? "Chọn ảnh để tải lên và lưu cùng sự cố."
                    : "Tệp chỉ ghi nhận tên; chưa tải lên máy chủ.")}
              </p>
              <ActButton action="engineer">
                Kỹ sư tiếp nhận & ghi chú →
              </ActButton>
            </>
          ) : (
            <>
              <p className="tiny muted">
                Công nhân đã thực hiện bước được phép trong Action Card và đối
                chiếu SOP.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left whitespace-normal"
                  onClick={() => act("effective")}
                >
                  <b>✓ Hiệu quả</b>
                  <span className="tiny muted font-normal">
                    Ghi nhận hướng dẫn đã giúp xử lý tình huống.
                  </span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 text-left whitespace-normal"
                  onClick={() => act("ineffective")}
                >
                  <b>↗ Chưa hiệu quả / chưa tự xử lý được</b>
                  <span className="tiny muted font-normal">
                    Chuyển kỹ sư kèm ngữ cảnh và bằng chứng.
                  </span>
                </Button>
              </div>
              <Note>
                Phản hồi được lưu theo case và phiên bản. Chưa có huấn luyện
                RLHF trong prototype.
              </Note>
            </>
          )}
        </Panel>
        <aside>
          <Panel>
            <h2>Ngữ cảnh đi cùng yêu cầu</h2>
            <div className="timeline">
              {[
                ["Mã lỗi & thiết bị", `${state.query} · CAM-02`],
                [
                  "Hướng dẫn đã thử",
                  state.found
                    ? `${serverData?.incident?.knowledgeId || serverData?.retrievedCard?.id || "KB-VIS-024"} · v${serverData?.incident?.version || serverData?.retrievedCard?.version || (state.noteApproved ? 2 : 1)} đã duyệt`
                    : "Không tìm thấy hướng dẫn phù hợp",
                ],
                [
                  "Ý kiến cần lưu ý",
                  "Giữ xử lý theo SOP nếu ảnh chưa đạt; không tự đổi PLC.",
                ],
                [
                  "Người xử lý tiếp theo",
                  "Kỹ sư hiện trường (vai trò minh họa)",
                ],
              ].map(([title, description]) => (
                <div className="event" key={title}>
                  <b>{title}</b>
                  <small className="break-words">{description}</small>
                </div>
              ))}
            </div>
            <SourceButton source="dissent">Nguồn cảnh báo</SourceButton>
          </Panel>
          <div className="next-block">
            <h2 className="text-sm">Không để cách sửa mới mất đi</h2>
            <p>
              Kỹ sư ghi lại nguyên nhân và phương án. Hệ thống tạo bản nháp tri
              thức mới, chờ chuyên gia duyệt.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
