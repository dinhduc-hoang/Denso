import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
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
import { createElement, useRef } from "react";

function KnowledgeLoop() {
  return (
    <div
      className="loop-visual"
      aria-label="Cuộc họp, chuyên gia duyệt, sàn máy và phản hồi tạo thành vòng tri thức"
    >
      <div className="loop-caption">
        <span className="status-dot" /> TRI THỨC LUÔN CÓ NGUỒN
      </div>
      <div className="loop-nodes">
        {[
          [FileAudio, "Cuộc họp", "01"],
          [ShieldCheck, "Kiểm duyệt", "02"],
          [Wrench, "Sàn máy", "03"],
        ].map(([icon, label, number]) => (
          <div className="loop-node" key={label}>
            <span className="loop-node-number">{number}</span>
            <span className="loop-node-icon">
              {createElement(icon, {
                className: "size-6",
                "aria-hidden": true,
              })}
            </span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>
      <div className="loop-return">
        <RotateCcw className="size-3.5" aria-hidden="true" /> Phản hồi để tri
        thức tốt hơn
      </div>
    </div>
  );
}

export default function Overview() {
  const workflowRef = useRef(null);
  const { state, backend, serverData, go } = useDemo();
  const next = !state.processed
    ? [1, "Tạo báo cáo đầu tiên", "Bắt đầu từ cuộc họp và tài liệu kỹ thuật."]
    : !state.approved
      ? [
          2,
          "Kiểm duyệt báo cáo",
          "Đối chiếu nguồn trước khi phát hành tri thức.",
        ]
      : state.noteDraft && !state.noteApproved
        ? [6, "Duyệt ghi chú hiện trường", "Hoàn thiện vòng phản hồi từ kỹ sư."]
        : [
            4,
            "Đưa tri thức đến sàn máy",
            "Tra cứu hướng dẫn đã duyệt cho CAM-02.",
          ];
  const metrics = backend
    ? [
        [
          serverData?.overview?.meetings || 0,
          "Cuộc họp trên máy chủ",
          FileAudio,
        ],
        [
          serverData?.overview?.draftReports || 0,
          "Báo cáo cần kiểm duyệt",
          ClipboardCheck,
        ],
        [
          serverData?.overview?.activeKnowledge || 0,
          "Hướng dẫn đang hiệu lực",
          BookOpen,
        ],
        [
          serverData?.overview?.openIncidents || 0,
          "Sự cố chờ xử lý",
          TriangleAlert,
        ],
      ]
    : [
        [1, "Cuộc họp mẫu", FileAudio],
        [state.processed ? 1 : 0, "Báo cáo đã trích xuất", ClipboardCheck],
        [state.approved ? 1 : 0, "Hướng dẫn đã duyệt", BookOpen],
        [state.incident ? 1 : 0, "Sự cố đã chuyển kỹ sư", TriangleAlert],
      ];
  const milestones = [
    [
      1,
      FileAudio,
      "Thu lại quyết định",
      "Cuộc họp → báo cáo có nguồn",
      state.processed,
    ],
    [
      2,
      ShieldCheck,
      "Chuyên gia kiểm duyệt",
      "Đối chiếu → phê duyệt → phát hành",
      state.approved,
    ],
    [
      4,
      Wrench,
      "Áp dụng tại sàn máy",
      "Hướng dẫn → xử lý → phản hồi",
      state.closed,
    ],
    [
      6,
      RotateCcw,
      "Hoàn thiện vòng tri thức",
      "Ghi chú kỹ sư → phiên bản mới",
      state.noteApproved,
    ],
  ];
  return (
    <>
      <div className="overview-welcome">
        <div>
          <span className="eyebrow">TỔNG QUAN</span>
          <h2>Mỗi quyết định. Một bước tiến.</h2>
          <p className="muted mb-0">
            Kết nối kinh nghiệm chuyên gia với hành động tại hiện trường.
          </p>
        </div>
        <Pill>{backend ? "Workspace" : "Không gian demo"}</Pill>
      </div>
      <Panel className="overview-hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span /> MEETING-TO-SHOPFLOOR LOOP
          </div>
          <h1>
            Quyết định trong họp.
            <br />
            <span>Tri thức trên sàn máy.</span>
          </h1>
          <p>
            Đưa những quyết định có nguồn thành hướng dẫn đã duyệt. Đúng người,
            đúng thiết bị, đúng thời điểm.
          </p>
          <div className="row-actions">
            <ActButton action="start">Bắt đầu demo →</ActButton>
            <Button
              variant="outline"
              className="hero-secondary border-slate-500 bg-transparent text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                workflowRef.current.open = true;
                workflowRef.current.scrollIntoView?.({
                  behavior: window.matchMedia?.(
                    "(prefers-reduced-motion: reduce)",
                  ).matches
                    ? "instant"
                    : "smooth",
                  block: "start",
                });
                workflowRef.current
                  .querySelector("summary")
                  .focus({ preventScroll: true });
              }}
            >
              Xem workflow{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <KnowledgeLoop />
      </Panel>
      <div className="overview-metrics">
        {metrics.map(([value, label, icon], index) => (
          <Panel key={label} className="metric-card">
            <div className="flex items-center justify-between gap-2">
              <span className="metric-icon" data-tone={index}>
                {createElement(icon, {
                  className: "size-5",
                  "aria-hidden": true,
                })}
              </span>
              <span className="metric-context">
                {backend ? "WORKSPACE" : "DỮ LIỆU MẪU"}
              </span>
            </div>
            <div className="metric-bottom">
              <b className="metric-value">{String(value).padStart(2, "0")}</b>
              <span>{label}</span>
            </div>
          </Panel>
        ))}
      </div>
      <div className="overview-detail">
        <Panel className="overview-journey">
          <div className="panel-head">
            <div>
              <div className="eyebrow mb-1">MỘT VÒNG KHÉP KÍN</div>
              <h2>Tri thức đi đến đâu?</h2>
            </div>
            <Pill tone="green">Có kiểm duyệt</Pill>
          </div>
          <div className="journey-list">
            {milestones.map(
              ([target, icon, title, description, done], index) => (
                <button
                  className="journey-row"
                  onClick={() => go(target)}
                  key={title}
                >
                  <span
                    className={`journey-icon ${done ? "journey-done" : ""}`}
                  >
                    {done ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      createElement(icon, {
                        className: "size-4",
                        "aria-hidden": true,
                      })
                    )}
                  </span>
                  <span className="journey-text">
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <span className="journey-state">
                    {done ? "Hoàn thành" : `0${index + 1}`}
                  </span>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </button>
              ),
            )}
          </div>
        </Panel>
        <Panel className="overview-next">
          <span className="eyebrow">BƯỚC TIẾP THEO</span>
          <span className="next-icon">
            <ArrowUpRight className="size-6" aria-hidden="true" />
          </span>
          <h2>{next[1]}</h2>
          <p className="muted">{next[2]}</p>
          <Button onClick={() => go(next[0])} className="w-full">
            Tiếp tục công việc{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <div className="next-scope">
            <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
            <span>Chỉ hướng dẫn đã duyệt mới được đưa xuống sàn máy.</span>
          </div>
        </Panel>
      </div>
      <Panel className="overview-resources">
        <div className="panel-head">
          <div>
            <div className="eyebrow mb-1">TÀI LIỆU & QUY TRÌNH</div>
            <h2>Từ cuộc họp đến hiện trường</h2>
          </div>
          <div className="row-actions">
            <Button asChild variant="outline" size="sm">
              <a href={`${import.meta.env.BASE_URL}workflow.drawio`} download>
                <Download className="size-4" />
                File draw.io
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={`${import.meta.env.BASE_URL}source-code.zip`} download>
                <Download className="size-4" />
                Mã nguồn
              </a>
            </Button>
          </div>
        </div>
        <details ref={workflowRef} id="workflow" className="workflow-details">
          <summary>
            Xem sơ đồ vòng tri thức{" "}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </summary>
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
            Chỉ tri thức <b>đã duyệt, còn hiệu lực và đúng phạm vi</b> được hiển
            thị cho công nhân. Nhánh chưa tìm thấy hoặc chưa hiệu quả dẫn tới kỹ
            sư.
          </Note>
        </details>
        <details className="workflow-details">
          <summary>
            Phạm vi & lộ trình triển khai{" "}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </summary>
          <div className="grid gap-4 py-4 lg:grid-cols-3">
            {[
              [
                "BẢN HIỆN TẠI",
                "Chứng minh vòng tri thức",
                backend
                  ? "Upload, báo cáo có nguồn, kiểm duyệt, tra cứu, sự cố và phiên bản mới. Dữ liệu lưu trên máy chủ."
                  : "Dữ liệu mẫu, báo cáo có nguồn, kiểm duyệt, tra cứu và phản hồi. Trạng thái lưu trong trình duyệt.",
              ],
              [
                "TÍCH HỢP TIẾP",
                "Từ transcript đến báo cáo",
                "Trích xuất có cấu trúc, phiên âm và kho tri thức nội bộ.",
              ],
              [
                "LỘ TRÌNH DÀI HẠN",
                "Tích hợp vận hành",
                "Dữ liệu nhà máy và hệ thống sự cố. Tích hợp PLC cần dự án kiểm định riêng.",
              ],
            ].map(([tag, title, description]) => (
              <article key={title}>
                <span className="eyebrow">{tag}</span>
                <h3 className="mt-2">{title}</h3>
                <p className="tiny muted">{description}</p>
              </article>
            ))}
          </div>
        </details>
      </Panel>
    </>
  );
}
