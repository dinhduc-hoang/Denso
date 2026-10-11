import { useEffect, useRef } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  FileAudio,
  LayoutDashboard,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import Brand from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/shared";
import DemoDialog from "@/components/DemoDialog";
import { DemoProvider } from "@/hooks/DemoProvider";
import { BackendProvider } from "@/hooks/BackendProvider";
import { backendEnabled } from "@/lib/api";
import { useDemo } from "@/hooks/demo-context";
import { labels, roles } from "@/lib/demo";
import Overview from "@/pages/Overview";
import Meeting from "@/pages/Meeting";
import Report from "@/pages/Report";
import Knowledge from "@/pages/Knowledge";
import Copilot from "@/pages/Copilot";
import Incident from "@/pages/Incident";
import Engineer from "@/pages/Engineer";
import { cn } from "@/lib/utils";

const pages = [
  Overview,
  Meeting,
  Report,
  Knowledge,
  Copilot,
  Incident,
  Engineer,
];
const navigationIcons = [
  LayoutDashboard,
  FileAudio,
  ClipboardCheck,
  BookOpen,
  MessageSquare,
  TriangleAlert,
  Wrench,
];

function Sidebar() {
  const { state, go, backend } = useDemo();
  return (
    <aside className="sidebar flex flex-col p-4 md:sticky md:top-0 md:h-dvh md:px-4 md:py-7">
      <Brand className="px-3" />
      <div className="sidebar-intro hidden md:block">
        <span className="sidebar-product">Tri thức chuyên gia.</span>
        <span className="sidebar-caption">Kết nối đến sàn máy.</span>
      </div>
      <div className="sidebar-label mb-3 hidden px-3 text-[10px] tracking-widest md:block">
        VÒNG TRI THỨC
      </div>
      <nav
        aria-label="Các bước demo"
        className="mt-3 flex gap-1 overflow-x-auto md:mt-0 md:grid md:overflow-visible"
      >
        {labels.map((label, index) => {
          const Icon = navigationIcons[index];
          return (
            <Button
              key={label}
              variant="ghost"
              aria-current={state.page === index ? "page" : undefined}
              onClick={() => go(index)}
              className={cn(
                "sidebar-link h-auto min-h-11 shrink-0 justify-start gap-3 px-3 py-3 text-left text-xs text-[var(--sidebar-muted)] hover:bg-white/5 hover:text-white md:w-full md:text-[13px]",
                state.page === index &&
                  "sidebar-link-active bg-white/10 text-white hover:bg-white/15 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
              {state.page === index && (
                <ChevronRight
                  className="ml-auto hidden size-3.5 md:block"
                  aria-hidden="true"
                />
              )}
            </Button>
          );
        })}
      </nav>
      <div className="sidebar-bottom mt-auto hidden pt-6 md:block">
        <div className="sidebar-status">
          <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
          <div>
            <strong>Tri thức được kiểm duyệt</strong>
            <span>
              {backend
                ? "Dữ liệu lưu trên máy chủ"
                : "Không gian demo tương tác"}
            </span>
          </div>
        </div>
        <p className="mt-4 mb-0 px-3 text-[11px]">
          Bản minh họa hackathon A2.1.
          <br />
          Không phải hệ thống của DENSO.
        </p>
      </div>
    </aside>
  );
}

function Workspace() {
  const { state, go, act, notification, backend, user, logout, processing } =
    useDemo();
  const workspaceRef = useRef(null);
  const previousPage = useRef(state.page);
  const Page = pages[state.page] || Overview;
  useEffect(() => {
    if (previousPage.current !== state.page) {
      const heading = workspaceRef.current?.querySelector("h1");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
      previousPage.current = state.page;
    }
  }, [state.page]);
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-[100] rounded bg-card p-3 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Đến nội dung chính
      </a>
      <div className="layout min-h-dvh md:grid md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="min-w-0 outline-none">
          <header className="topbar flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-4 sm:px-6 xl:px-9">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronRight
                className="hidden size-3 sm:block"
                aria-hidden="true"
              />
              <strong className="font-semibold text-foreground">
                {labels[state.page]}
              </strong>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Pill tone={backend ? "green" : "red"}>
                {backend ? "Đã kết nối" : "DEMO"}
              </Pill>
              <span className="max-w-60 break-words">
                {backend ? `${user.name} · ${user.role}` : roles[state.page]}
              </span>
              {backend && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  disabled={processing}
                >
                  Đăng xuất
                </Button>
              )}
              <span
                className="grid size-9 place-items-center rounded-full border border-primary/15 bg-accent font-bold text-primary"
                aria-hidden="true"
              >
                {backend
                  ? user.name
                      .trim()
                      .split(/\s+/)
                      .slice(-2)
                      .map((part) => part[0])
                      .join("")
                  : state.page === 4 || state.page === 5
                    ? "CN"
                    : "KT"}
              </span>
            </div>
          </header>
          <div
            ref={workspaceRef}
            className="workspace mx-auto max-w-[1480px] px-4 py-5 sm:px-6 xl:px-9 xl:py-7"
          >
            <div className="demo-bar mb-7 flex flex-col items-start justify-between gap-3 rounded-lg border bg-card px-4 py-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-3">
                <span className="demo-bar-icon">
                  <ArrowUpRight className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <strong className="text-xs">
                    TÌNH HUỐNG MẪU · Camera kiểm tra báo ảnh mờ
                  </strong>
                  <span className="tiny muted block">
                    {backend
                      ? "Dữ liệu được lưu trên máy chủ. Mỗi thao tác duyệt kiểm tra quyền tài khoản."
                      : "Đi theo menu trái. Trạng thái được lưu trên trình duyệt này."}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => act("guide")}
                >
                  Kịch bản 3 phút
                </Button>
                <Button variant="ghost" size="sm" onClick={() => act("reset")}>
                  <RotateCcw className="size-3" />
                  {backend ? "Phiên mới" : "Làm lại demo"}
                </Button>
              </div>
            </div>
            <fieldset
              disabled={backend && processing}
              className="min-w-0 border-0 p-0"
            >
              {backend && processing && (
                <p role="status" className="mb-3 text-sm">
                  Đang lưu / xử lý yêu cầu…
                </p>
              )}
              <Page key={state.page} />
            </fieldset>
            <footer className="footer muted mt-6 flex flex-col justify-between gap-2 text-[10px] lg:flex-row">
              <button onClick={() => go(0)} className="text-left">
                MEETING-TO-SHOPFLOOR LOOP · DENSO HACKATHON / A2.1
              </button>
              <span>
                {backend
                  ? "Express + MySQL · Báo cáo mẫu · STT / LLM / email / PLC chưa kết nối"
                  : "Chỉ minh họa UX · STT / AI / RAG / email / PLC chưa kết nối"}
              </span>
            </footer>
          </div>
        </main>
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={cn(
          "toast fixed bottom-6 left-1/2 z-[100] max-w-[90vw] -translate-x-1/2 rounded-lg bg-foreground px-5 py-3 text-xs text-white shadow-lg",
          !notification && "sr-only",
        )}
      >
        {notification}
      </div>
      <DemoDialog />
    </>
  );
}

export default function App() {
  const Provider = backendEnabled ? BackendProvider : DemoProvider;
  return (
    <Provider>
      <Workspace />
    </Provider>
  );
}
