import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ActButton,
  FileField,
  Note,
  PageHead,
  Panel,
  Pill,
  SourceButton,
  Steps,
} from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";

export default function Meeting() {
  const { state, processing, backend } = useDemo();
  if (processing)
    return (
      <>
        <PageHead
          tag="01 / Cuộc họp"
          title={
            backend
              ? "Đang tạo báo cáo trên máy chủ"
              : "Đang mô phỏng xử lý cuộc họp"
          }
          description="Dùng transcript mẫu có sẵn; chưa gọi mô hình AI."
        />
        <Panel className="py-12 text-center">
          <div role="status" aria-live="polite" aria-busy="true">
            <div className="mx-auto mb-5 size-8 animate-spin rounded-full border-[3px] border-border border-t-primary motion-reduce:animate-none" />
            <h2>Trích xuất quyết định, nguồn và các điểm chưa rõ</h2>
            <p className="muted">
              Chuẩn hóa thuật ngữ → giữ ý kiến phản biện → dựng báo cáo
            </p>
          </div>
        </Panel>
      </>
    );
  return (
    <>
      <PageHead
        tag="01 / Điều phối cuộc họp"
        title="Từ cuộc họp đến báo cáo kỹ thuật"
        description="Một bộ dữ liệu mẫu đủ thể hiện toàn bộ ý tưởng. Bạn có thể chọn tệp để minh họa đầu vào."
      >
        <Pill tone="amber">INPUT MẪU</Pill>
      </PageHead>
      <Steps />
      <div className="grid2">
        <Panel>
          <div className="panel-head">
            <h2>Design Review · DR-024</h2>
            <Pill>18 phút · dữ liệu mẫu</Pill>
          </div>
          <div className="field">
            <label htmlFor="meeting-title">Tên cuộc họp</label>
            <Input
              id="meeting-title"
              value="Review lỗi ảnh mờ tại trạm kiểm tra chất lượng"
              readOnly
            />
          </div>
          <div className="meta">
            <span>
              Trạm <b>Demo A</b>
            </span>
            <span>
              Thiết bị <b>CAM-02</b>
            </span>
            <span>
              Ngày mẫu <b>10/10/2026</b>
            </span>
          </div>
          <div className="my-4 rounded-lg border border-dashed border-input bg-background p-5 text-center">
            <Upload className="mx-auto mb-2 size-7 text-primary" />
            <p className="tiny muted">
              {backend
                ? "Tệp được tải lên máy chủ và lưu với cuộc họp. Audio chưa được phiên âm tự động."
                : "Chọn tệp để hiển thị tên; nội dung không được tải lên hoặc phiên âm."}
            </p>
            <FileField
              id="audio-file"
              field="audio"
              label="Ghi âm cuộc họp"
              accept="audio/*"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
            <span className="tiny break-all">
              {state.audio || "design-review-024.wav · tệp mẫu mô phỏng"}
            </span>
            <Pill>Mẫu demo</Pill>
          </div>
          <div className="mt-5">
            <FileField
              id="image-file"
              field="attachment"
              label="Bản vẽ / ảnh bảng trắng"
              accept="image/*,.pdf"
            />
          </div>
          <p className="tiny muted break-all">
            {state.attachment ||
              "Sử dụng phác thảo camera A-01 dựng sẵn trong demo."}
          </p>
          <Note>
            Từ điển mẫu: <b>CAM-02, E-VIS-07, SOP-VIS-02, Design Review</b>. Khi
            làm STT thật, dùng từ điển để giảm nhầm mã; vẫn cần rà soát.
          </Note>
          <ActButton action="process">
            {state.processed ? "Tạo lại báo cáo mẫu →" : "Tạo báo cáo mẫu →"}
          </ActButton>
        </Panel>
        <aside>
          <Panel>
            <div className="panel-head">
              <h2>Những gì AI cần giữ lại</h2>
              <Pill>Nguồn → nội dung</Pill>
            </div>
            <div className="grid gap-5">
              {[
                [
                  "02:14",
                  "Minh · Bảo dưỡng",
                  "“Có thể do bụi trên ống kính... chưa đủ cơ sở kết luận lỗi cảm biến.”",
                  "Giả thuyết",
                  "root",
                ],
                [
                  "05:38",
                  "Lan · Chất lượng",
                  "“Nếu vệ sinh mà ảnh vẫn mờ thì chưa được tiếp tục...”",
                  "Ý kiến phản biện",
                  "dissent",
                ],
                [
                  "08:42",
                  "Nam · Chủ trì",
                  "“Chốt cho camera CAM-02 trên trạm demo A... Không thay đổi tham số PLC.”",
                  "Quyết định cuối",
                  "decision",
                ],
                [
                  "10:05",
                  "Nam · Chủ trì",
                  "“Lan đối chiếu SOP trước 16 giờ ngày 11/10. Phần ánh sáng cần phân công sau.”",
                  "Action item",
                  "action",
                ],
              ].map(([time, person, quote, label, source]) => (
                <div key={time} className="grid grid-cols-[2.75rem_1fr] gap-3">
                  <span className="font-mono text-xs text-primary">{time}</span>
                  <div>
                    <strong className="text-xs">{person}</strong>
                    <p className="tiny muted mt-1">{quote}</p>
                    <SourceButton source={source}>{label}</SourceButton>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <div className="next-block">
            <h2 className="text-sm">Điểm kể với giám khảo</h2>
            <p>
              “Không chỉ chép lại lời nói: hệ thống giữ cả lý do, ý kiến bất
              đồng và điều kiện áp dụng của quyết định.”
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
