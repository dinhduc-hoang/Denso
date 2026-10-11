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
  Scope,
  SourceButton,
  Steps,
} from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";

function Approval() {
  const { state, edit, backend, user } = useDemo();
  return (
    <aside className="approval self-start xl:sticky xl:top-5">
      <Panel>
        <div className="panel-head">
          <h2>Chốt kiểm duyệt</h2>
          <Pill tone="red">HUMAN-IN-THE-LOOP</Pill>
        </div>
        <p className="tiny muted">
          {backend
            ? `Tài khoản hiện tại: ${user.name} · ${user.role}. Chỉ chuyên gia hoặc quản trị được phê duyệt.`
            : "Người duyệt minh họa: Nam · Chủ trì kỹ thuật. Vai trò thật cần được phân quyền ở backend."}
        </p>
        {state.approved ? (
          <>
            <Note tone="green">
              <b>Đã phát hành v1</b>
              <br />
              Hướng dẫn được đưa vào kho tri thức. Báo cáo và nguồn gốc được lưu
              cùng phiên bản.
            </Note>
            <ActButton action="knowledge">Xem kho tri thức →</ActButton>
          </>
        ) : (
          <>
            <ReviewCheck
              id="confirmed"
              checked={state.confirmed}
              onCheckedChange={(value) => edit("confirmed", value === true)}
            >
              Tôi đã đối chiếu nguồn, sửa nội dung và xác nhận quyết định này.
            </ReviewCheck>
            <ReviewCheck
              id="ack"
              checked={state.ack}
              onCheckedChange={(value) => edit("ack", value === true)}
            >
              Tôi xác nhận phạm vi CAM-02 / Demo A / S-01 và quy tắc chuyển kỹ
              sư.
            </ReviewCheck>
            <Note tone="amber">
              Không duyệt bằng một cú bấm thiếu ngữ cảnh. Nguồn, cảnh báo và
              phạm vi đi cùng hướng dẫn.
            </Note>
            <div className="row-actions">
              <ActButton
                action="approve"
                disabled={
                  !state.confirmed ||
                  !state.ack ||
                  !state.decision.trim() ||
                  (backend && !["expert", "admin"].includes(user.role))
                }
              >
                Phê duyệt & phát hành v1
              </ActButton>
              <ActButton action="revision" secondary>
                Yêu cầu chỉnh sửa
              </ActButton>
            </div>
            {state.revisionRequested && (
              <p className="tiny mt-3 text-primary" role="status">
                Yêu cầu đã được ghi nhận. Chỉnh nội dung rồi xác nhận lại các
                mục kiểm duyệt.
              </p>
            )}
          </>
        )}
      </Panel>
      <Panel>
        <h2 className="text-sm">Tri thức được chuẩn hóa</h2>
        <p className="tiny muted">
          Triệu chứng → quyết định → điều kiện → nguồn → người duyệt → phiên
          bản.
        </p>
        <Note>
          Phần chưa rõ luôn hiển thị riêng. Ý kiến trong cuộc họp chưa trở thành
          hướng dẫn cho công nhân cho tới khi được duyệt.
        </Note>
      </Panel>
    </aside>
  );
}

export default function Report() {
  const { state, backend, serverData } = useDemo();
  if (!state.processed)
    return (
      <Locked
        title="Chưa có báo cáo"
        description="Tạo báo cáo từ cuộc họp mẫu trước khi chuyên gia kiểm duyệt."
        page={1}
        label="Đến cuộc họp"
      />
    );
  return (
    <>
      <PageHead
        tag="02 / Chuyên gia phê duyệt"
        title="Báo cáo có nguồn. Con người quyết định."
        description="Kiểm tra nội dung, xử lý điểm chưa rõ và xác nhận phạm vi trước khi phát hành."
      >
        <ActButton action="print" secondary>
          In / lưu PDF
        </ActButton>
      </PageHead>
      <Steps report approved={state.approved} />
      <div className="grid2">
        <Panel>
          <div className="panel-head">
            <div>
              <div className="eyebrow">
                TECHNICAL REVIEW / {serverData?.meeting?.id || "DR-024"}
              </div>
              <h2 className="mt-2 text-xl">Lỗi ảnh mờ tại trạm kiểm tra</h2>
            </div>
            <Pill tone={state.approved ? "green" : "amber"}>
              {state.approved
                ? "Đã duyệt"
                : state.revisionRequested
                  ? "Cần chỉnh sửa"
                  : "Bản nháp AI"}
            </Pill>
          </div>
          <p className="tiny muted">
            10/10/2026 · Minh / Bảo dưỡng · Lan / Chất lượng · Nam / Chủ trì
          </p>
          <Divider />
          <h3>01. Tóm tắt điều hành</h3>
          <p className="tiny">
            Camera CAM-02 báo ảnh mờ. Nhóm thống nhất kiểm tra bề mặt ống kính
            theo SOP; chưa kết luận hỏng cảm biến. Nếu ảnh vẫn mờ hoặc ngoài
            phạm vi, chuyển kỹ sư và giữ xử lý chất lượng theo SOP.
          </p>
          <div className="row-actions">
            <SourceButton source="root">02:14 · Nguyên nhân</SourceButton>
            <SourceButton source="decision">08:42 · Kết luận</SourceButton>
          </div>
          <Divider />
          <h3>02. Vấn đề & giả thuyết nguyên nhân</h3>
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Bảng báo cáo kỹ thuật"
          >
            <table>
              <thead>
                <tr>
                  <th>VẤN ĐỀ</th>
                  <th>NHẬN ĐỊNH</th>
                  <th>MỨC XÁC NHẬN</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>E-VIS-07 / ảnh mờ</td>
                  <td>Bụi bề mặt ống kính có thể ảnh hưởng ảnh</td>
                  <td>
                    <Pill tone="amber">Chưa xác nhận</Pill>{" "}
                    <SourceButton source="root">02:14</SourceButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Divider />
          <h3>03. Quyết định & điều kiện áp dụng</h3>
          <div className="decision">
            <DemoField
              field="decision"
              label="Nội dung chuyên gia có thể chỉnh sửa"
              multiline
              readOnly={state.approved}
            />
            {backend && !state.approved && (
              <ActButton action="save-report" secondary>
                Lưu quyết định bản nháp
              </ActButton>
            )}
            <Scope />
            <p>
              Tiêu chí tiếp tục: chất lượng ảnh đạt SOP hiện hành và người có
              thẩm quyền xác nhận. Không trích được giá trị số đã chốt; hệ thống
              không tự tạo setpoint.
            </p>
            <div className="row-actions">
              <SourceButton source="decision">08:42 · Quyết định</SourceButton>
              <SourceButton source="image">Phác thảo A-01</SourceButton>
            </div>
          </div>
          <h3>04. Action Items</h3>
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Bảng báo cáo kỹ thuật"
          >
            <table>
              <thead>
                <tr>
                  <th>ĐẦU VIỆC</th>
                  <th>NGƯỜI / HẠN</th>
                  <th>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Đối chiếu SOP hiện hành{" "}
                    <SourceButton source="action">10:05</SourceButton>
                  </td>
                  <td>Lan · 11/10/2026 16:00</td>
                  <td>
                    <Pill>Chưa thực hiện</Pill>
                  </td>
                </tr>
                <tr>
                  <td>Kiểm tra điều kiện ánh sáng</td>
                  <td>Chưa được nêu</td>
                  <td>
                    <Pill tone="amber">Thiếu người / hạn</Pill>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Note tone="amber">
            Đầu việc ánh sáng được giữ trong danh sách tồn đọng. Phê duyệt bên
            phải chỉ phát hành hướng dẫn kiểm tra ống kính, không đánh dấu mọi
            action item đã hoàn thành.
          </Note>
          <h3>05. Rủi ro & ý kiến phản biện</h3>
          <Note tone="red">
            <b>Lan / Chất lượng:</b> Nếu ảnh vẫn mờ, không tiếp tục dựa vào
            hướng dẫn này. Chuyển kỹ sư; áp dụng quy trình chất lượng hiện hành.{" "}
            <SourceButton source="dissent">05:38 · Bất đồng</SourceButton>
          </Note>
        </Panel>
        <Approval />
      </div>
    </>
  );
}
