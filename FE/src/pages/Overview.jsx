import {
  ArrowDown,
  BookOpen,
  ClipboardCheck,
  Download,
  FileAudio,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkflowSummary from "@/components/WorkflowSummary";
import { ActButton, Note, Panel, Pill } from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";

export default function Overview() {
  const { state, backend, serverData } = useDemo();
  const metricIcons = [FileAudio, ClipboardCheck, BookOpen, TriangleAlert];
  return (
    <>
      <Panel className="overview-hero grid items-center gap-8 p-6 xl:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div>
          <div className="eyebrow">MEETING-TO-SHOPFLOOR · VÒNG TRI THỨC</div>
          <h1 className="max-w-xl text-3xl lg:text-4xl">
            Quyết định trong họp.
            <br />
            <span className="text-primary">Tri thức trên sàn máy.</span>
          </h1>
          <p className="sub my-5 max-w-md">
            Biến trao đổi của chuyên gia thành báo cáo có nguồn và hướng dẫn vận
            hành đã duyệt. Mỗi lần xử lý lỗi bổ sung một vòng tri thức.
          </p>
          <div className="row-actions">
            <ActButton action="start">Bắt đầu demo →</ActButton>
            <ActButton action="workflow" secondary>
              Xem workflow
            </ActButton>
            <Button asChild variant="outline" size="sm">
              <a href={`${import.meta.env.BASE_URL}source-code.zip`} download>
                <Download className="size-4" />
                Mã nguồn
              </a>
            </Button>
          </div>
          <p className="tiny muted mt-3 mb-0">
            {backend
              ? "Transcript mẫu · lưu dữ liệu và kiểm duyệt trên máy chủ · chưa kết nối máy"
              : "Prototype tương tác · dữ liệu giả lập · không kết nối máy"}
          </p>
        </div>
        <div className="overview-flow">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold">
              Từ quyết định đến hành động
            </span>
            <Pill tone="green">Có kiểm duyệt</Pill>
          </div>
          {[
            [
              FileAudio,
              "Thu lại quyết định",
              "Ghi âm / bản vẽ → báo cáo có nguồn",
            ],
            [
              ShieldCheck,
              "Chuyên gia giữ quyền phê duyệt",
              "Chỉnh sửa → phát hành tri thức theo phiên bản",
            ],
            [
              Wrench,
              "Hướng dẫn tới đúng trạm máy",
              "Tra cứu → Action Card → phản hồi hiện trường",
            ],
          ].map(([icon, title, desc], i) => {
            const Icon = icon;
            return (
              <div key={title}>
                {i > 0 && (
                  <div className="flex justify-center py-2">
                    <ArrowDown
                      className="size-4 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                )}
                <div className="overview-flow-item">
                  <span className="overview-flow-icon">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <strong className="text-[13px]">{title}</strong>
                    <small className="muted mt-1 block text-xs leading-5">
                      {desc}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="tiny muted mt-4 flex items-center gap-2">
            <RotateCcw className="size-4 shrink-0 text-primary" />
            Ghi chú kỹ sư → bản nháp mới → chuyên gia duyệt
          </div>
        </div>
      </Panel>
      <div className="my-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {(backend
          ? [
              [
                String(serverData?.overview?.meetings || 0),
                "Cuộc họp trên máy chủ",
              ],
              [
                String(serverData?.overview?.draftReports || 0),
                "Báo cáo cần kiểm duyệt",
              ],
              [
                String(serverData?.overview?.activeKnowledge || 0),
                "Hướng dẫn đang hiệu lực",
              ],
              [
                String(serverData?.overview?.openIncidents || 0),
                "Sự cố chờ xử lý",
              ],
            ]
          : [
              ["02", "Trụ cột trong một vòng khép kín"],
              ["04", "Vai trò: điều phối, chuyên gia, công nhân, kỹ sư"],
              [state.approved ? "01" : "00", "Hướng dẫn đã duyệt trong demo"],
              [
                state.incident ? "01" : "00",
                "Sự cố được chuyển kỹ sư trong demo",
              ],
            ]
        ).map(([value, label], index) => {
          const Icon = metricIcons[index];
          return (
            <Panel key={label} className="mb-0 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold tracking-wider text-muted-foreground">
                  0{index + 1} / {backend ? "WORKSPACE" : "DEMO"}
                </span>
                <span className="metric-icon">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </div>
              <b className="metric-value">{value}</b>
              <span className="tiny muted mt-1 block leading-5">{label}</span>
            </Panel>
          );
        })}
      </div>
      <div id="workflow">
        <Panel>
          <div className="panel-head">
            <div>
              <div className="eyebrow mb-1">QUY TRÌNH KHÉP KÍN</div>
              <h2>Từ cuộc họp đến hiện trường</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={`${import.meta.env.BASE_URL}workflow.drawio`} download>
                <Download className="size-4" />
                File draw.io
              </a>
            </Button>
          </div>
          <div
            className="hidden overflow-x-auto rounded-lg border bg-background/50 p-3 sm:p-5 md:block"
            tabIndex={0}
            role="region"
            aria-label="Sơ đồ workflow"
          >
            <img
              src={`${import.meta.env.BASE_URL}workflow.svg`}
              className="w-full min-w-2xl"
              alt="Workflow: cuộc họp → AI trích xuất → chuyên gia duyệt → tri thức v1 → công nhân tra cứu. Lỗi chưa xử lý chuyển kỹ sư → ghi chú → duyệt v2; v1 giữ lịch sử."
            />
          </div>
          <WorkflowSummary />
          <Note>
            Điểm kiểm soát chính: chỉ tri thức{" "}
            <b>đã duyệt, còn hiệu lực và đúng phạm vi</b> được hiển thị cho công
            nhân. Nhánh không tìm thấy / chưa hiệu quả luôn dẫn tới kỹ sư.
          </Note>
        </Panel>
      </div>
      <Panel>
        <div className="panel-head">
          <h2>Phạm vi & lộ trình triển khai</h2>
          <Pill tone="red">MVP tập trung</Pill>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[
            [
              "LÀM TRƯỚC · BẢN DEMO NÀY",
              "Chứng minh luồng có thể chạy",
              backend
                ? "Input mẫu, upload, báo cáo có nguồn, phê duyệt, tra cứu, sự cố và phiên bản mới. Dữ liệu lưu MySQL; thao tác kiểm tra quyền tài khoản."
                : "Input mẫu, báo cáo có nguồn, phê duyệt, tra cứu, nhánh gọi kỹ sư và phiên bản mới. Trạng thái lưu trong trình duyệt.",
            ],
            [
              "TÍCH HỢP TIẾP",
              "Một lát cắt AI chạy thật",
              "Transcript → JSON có cấu trúc → giao diện báo cáo. Sau đó thêm STT và kho tri thức nội bộ.",
            ],
            [
              "LỘ TRÌNH DÀI HẠN",
              "On-premise & tích hợp vận hành",
              "Phân quyền, dữ liệu nhà máy, hệ thống sự cố. Can thiệp PLC là dự án riêng, cần kiểm định và giới hạn cứng.",
            ],
          ].map(([tag, title, desc], i) => (
            <article
              key={title}
              className={`rounded-lg border p-5 ${i === 0 ? "border-primary/20 bg-accent/40" : "bg-background/40"}`}
            >
              <div className="eyebrow">{tag}</div>
              <h3 className="mt-3">{title}</h3>
              <p className="tiny muted mb-0">{desc}</p>
            </article>
          ))}
        </div>
      </Panel>
    </>
  );
}
