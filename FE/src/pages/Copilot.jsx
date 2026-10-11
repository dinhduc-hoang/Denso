import {
  ActButton,
  DemoField,
  Divider,
  Note,
  PageHead,
  Panel,
  Pill,
  SourceButton,
} from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";

function Instruction({ number, title, children }) {
  return (
    <div className="instruction">
      <span className="number">{number}</span>
      <div>
        <strong className="text-[13px]">{title}</strong>
        {children}
      </div>
    </div>
  );
}

function ActionCard() {
  const { state, serverData } = useDemo();
  const card = serverData?.retrievedCard;
  const version = card?.version || (state.noteApproved ? 2 : 1);
  const fieldOnly = card?.document.mode === "field";
  return (
    <>
      <div
        className="my-4 border-l-[3px] border-success bg-emerald-50 px-4 py-3 text-xs"
        role="status"
      >
        <b>Tìm thấy 1 hướng dẫn phù hợp</b> · CAM-02 / Demo A / S-01 · v
        {version} đã duyệt
      </div>
      <div className="grid2">
        <Panel>
          <div className="panel-head">
            <h2>
              {card && card.errorCode !== "E-VIS-07"
                ? `Action Card · ${card.title}`
                : "Action Card · Ảnh mờ"}
            </h2>
            <Pill tone="green">Nguồn đã duyệt</Pill>
          </div>
          <Note tone="amber">
            Chỉ thực hiện các bước trong quyền hạn, theo SOP hiện hành. Nếu cần
            tháo máy hoặc ngoài phạm vi được đào tạo, chuyển kỹ sư.
          </Note>
          <Instruction number="1" title="Xác nhận đúng thiết bị và phạm vi">
            <p>
              CAM-02 · Trạm Demo A · Sản phẩm mẫu S-01. Xử lý trạng thái trạm
              theo SOP; không tự thay đổi PLC.
            </p>
          </Instruction>
          <Instruction
            number="2"
            title={
              fieldOnly
                ? "Thực hiện hướng dẫn đã được chuyên gia duyệt"
                : "Kiểm tra vùng ống kính được đánh dấu"
            }
          >
            <p>{card?.document.decision || state.decision}</p>
            <SourceButton source={fieldOnly ? "field" : "decision"}>
              {fieldOnly
                ? "Ghi chú hiện trường đã duyệt"
                : "08:42 · Quyết định"}
            </SourceButton>
          </Instruction>
          {state.noteApproved && !fieldOnly && (
            <Instruction number="3" title={`Bổ sung từ kỹ sư · v${version}`}>
              <p>{state.note}</p>
              <SourceButton source="field">Ghi chú đã duyệt</SourceButton>
            </Instruction>
          )}
          <Instruction
            number={state.noteApproved && !fieldOnly ? "4" : "3"}
            title="Đánh giá lại theo tiêu chí của SOP"
          >
            <p>
              {fieldOnly
                ? card.document.stopCondition
                : "Người có thẩm quyền xác nhận trước khi tiếp tục. Nếu chưa đạt, giữ trạng thái và chuyển kỹ sư."}
            </p>
            <SourceButton source={fieldOnly ? "field" : "dissent"}>
              {fieldOnly
                ? "Điều kiện kỹ sư ghi nhận"
                : "05:38 · Điều kiện dừng"}
            </SourceButton>
          </Instruction>
          <div className="mt-5">
            <ActButton action="feedback">Ghi nhận kết quả xử lý →</ActButton>
          </div>
        </Panel>
        <aside>
          <Panel>
            {fieldOnly ? (
              <>
                <h2>Bằng chứng và nguồn hiện trường</h2>
                <p className="tiny muted">
                  Hướng dẫn {card.id} · v{card.version} · {card.approvedBy.name}{" "}
                  duyệt. Không có phác thảo thiết bị cho lỗi này.
                </p>
                <SourceButton source="field">Xem ghi chú đã duyệt</SourceButton>
              </>
            ) : (
              <>
                <div className="panel-head">
                  <h2>Vị trí cần kiểm tra</h2>
                  <SourceButton source="image">A-01</SourceButton>
                </div>
                <div className="mb-4 rounded-md border bg-background p-3">
                  <img
                    src={`${import.meta.env.BASE_URL}machine.svg`}
                    alt="Phác thảo camera CAM-02; vị trí ① khoanh đỏ là bề mặt ống kính cần kiểm tra."
                    className="mx-auto h-48 w-full object-contain"
                  />
                </div>
                <p className="tiny muted">
                  Khoanh đỏ ①: bề mặt ống kính. Hình minh họa liên kết với tài
                  liệu cuộc họp.
                </p>
                <Divider />
                <h3>Tại sao hiển thị hướng dẫn này?</h3>
                <p className="tiny muted">
                  Đúng mã E-VIS-07, thiết bị và cấu hình. Chuyên gia đã duyệt
                  quyết định tại DR-024;{" "}
                  {state.noteApproved
                    ? "v2 bổ sung ghi chú hiện trường."
                    : "v1 đang hiệu lực."}
                </p>
                <SourceButton source="decision">
                  Kiểm tra nguồn quyết định
                </SourceButton>
              </>
            )}
          </Panel>
          <ActButton action="escalate" secondary>
            Ngoài phạm vi / gọi kỹ sư
          </ActButton>
        </aside>
      </div>
    </>
  );
}

export default function Copilot() {
  const { state, act, backend } = useDemo();
  return (
    <>
      <PageHead
        tag="04 / Công nhân vận hành"
        title="Gặp lỗi. Tìm đúng quyết định đã duyệt."
        description="Màn hình cho công nhân ưu tiên thao tác ngắn, bước làm rõ và đường chuyển kỹ sư."
      >
        <Pill>TRẠM DEMO A</Pill>
      </PageHead>
      <Panel>
        <div className="meta mt-0">
          <span>
            Thiết bị <b>CAM-02</b>
          </span>
          <span>
            Sản phẩm <b>S-01</b>
          </span>
          <span>
            Chế độ <b>Hướng dẫn theo SOP</b>
          </span>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            act("search");
          }}
        >
          <DemoField
            field="query"
            label="Nhập mã lỗi hoặc triệu chứng"
            placeholder="Ví dụ: E-VIS-07 / ảnh kiểm tra bị mờ"
          />
          <div className="row-actions">
            <ActButton action="search" data-search type="button">
              Tra cứu hướng dẫn →
            </ActButton>
            <ActButton action="unknown" type="button" secondary>
              Thử lỗi chưa có trong hệ thống
            </ActButton>
          </div>
        </form>
        <p className="tiny muted mt-3 mb-0">
          {backend
            ? "Tra cứu hướng dẫn trên máy chủ theo mã lỗi, máy, trạm và sản phẩm; chỉ nhận phiên bản đã duyệt, đang hiệu lực."
            : "Tra cứu theo dữ liệu mẫu trong trình duyệt; chưa kết nối RAG hoặc HMI thật."}
        </p>
      </Panel>
      {state.searched ? (
        state.found ? (
          <ActionCard />
        ) : (
          <Panel>
            <Note tone="amber">
              <b>Không có hướng dẫn đã duyệt phù hợp</b>
              <br />
              {state.approved
                ? "Mã lỗi / triệu chứng không khớp tình huống demo."
                : "Quyết định trong cuộc họp chưa được phê duyệt."}{" "}
              Không suy đoán cách xử lý.
            </Note>
            <ActButton action="escalate">Tạo yêu cầu kỹ sư →</ActButton>
            <p className="tiny muted mt-3">
              {backend
                ? "Yêu cầu được lưu để kỹ sư tiếp nhận. Chưa gửi email hoặc thông báo ngoài hệ thống."
                : "Yêu cầu trong demo chỉ ghi trạng thái; không gửi thông báo thật."}
            </p>
          </Panel>
        )
      ) : (
        <div className="empty">
          <h2>
            {state.approved
              ? `Sẵn sàng tra cứu ${state.noteApproved ? "v2" : "v1"} đã duyệt`
              : "Chưa có tri thức đã duyệt"}
          </h2>
          <p className="tiny muted">
            Dùng E-VIS-07 để xem Action Card. Dùng lỗi chưa biết để trình diễn
            nhánh gọi kỹ sư.
          </p>
        </div>
      )}
    </>
  );
}
