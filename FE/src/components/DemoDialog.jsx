import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Note } from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";
import { sources } from "@/lib/sources";

const script = [
  [
    "0:00–0:25 · Tổng quan",
    "Tri thức chuyên gia đang nằm trong lời nói; chúng tôi đưa quyết định có nguồn tới sàn máy.",
  ],
  [
    "0:25–0:55 · Cuộc họp",
    "Tạo báo cáo mẫu. Mở nguồn 05:38 để cho thấy ý kiến bất đồng vẫn được giữ lại.",
  ],
  [
    "0:55–1:25 · Duyệt",
    "Xem phạm vi và cảnh báo, tích hai mục kiểm duyệt, phát hành v1.",
  ],
  ["1:25–2:00 · Sàn máy", "Tra E-VIS-07, xem Action Card và hình khoanh đỏ."],
  [
    "2:00–2:35 · Ngoại lệ",
    "Chọn chưa hiệu quả, chuyển kỹ sư, điền ghi chú mẫu và lưu bản nháp.",
  ],
  [
    "2:35–3:00 · Khép vòng",
    "Chuyên gia duyệt v2. Mở kho tri thức và chỉ ra lịch sử v1 → v2.",
  ],
];

export default function DemoDialog() {
  const {
    dialog,
    setDialog,
    state,
    act,
    restoreDialogFocus,
    backend,
    sourceMap,
  } = useDemo();
  const evidence = (sourceMap || sources)[dialog];
  const reset = dialog === "reset";
  const guide = dialog === "guide";
  const title = reset
    ? "Làm lại demo?"
    : guide
      ? "Đi một vòng, chứng minh một ý tưởng."
      : evidence?.title;
  return (
    <Dialog
      open={dialog !== null}
      onOpenChange={(open) => {
        if (!open) setDialog(null);
      }}
    >
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto bg-card sm:max-w-xl"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreDialogFocus();
        }}
      >
        <DialogHeader>
          <div className="eyebrow">
            {reset
              ? "TRẠNG THÁI DEMO"
              : guide
                ? "KỊCH BẢN THUYẾT TRÌNH / 3 PHÚT"
                : "BẰNG CHỨNG CÓ THỂ TRUY NGƯỢC"}
          </div>
          <DialogTitle className="pr-6 leading-snug">{title}</DialogTitle>
          <DialogDescription>
            {reset
              ? backend
                ? "Bắt đầu một phiên mới. Báo cáo, sự cố và lịch sử trên máy chủ được giữ lại."
                : "Xóa trạng thái demo trên trình duyệt này và bắt đầu lại."
              : guide
                ? "Theo dõi một vòng tri thức từ cuộc họp tới hiện trường."
                : evidence?.person}
          </DialogDescription>
        </DialogHeader>
        {guide && (
          <>
            <ol className="list-decimal space-y-3 pl-5 text-sm">
              {script.map(([time, text]) => (
                <li key={time}>
                  <b>{time}:</b> {text}
                </li>
              ))}
            </ol>
            <Note>
              Nói rõ đây là prototype mô phỏng. Bước code tiếp theo: transcript
              → JSON báo cáo bằng AI thật.
            </Note>
          </>
        )}
        {evidence && (
          <>
            <blockquote className="my-3 border-l-[3px] border-primary bg-background px-5 py-3 text-sm">
              {dialog === "field"
                ? state.note || "Chưa có ghi chú."
                : evidence.quote}
            </blockquote>
            <p className="tiny muted">{evidence.detail}</p>
            <Note tone="amber">
              {backend
                ? "Nguồn transcript mẫu hoặc ghi chú hiện trường được lưu cùng bản ghi trên máy chủ."
                : "Nguồn và nội dung đều là dữ liệu minh họa cho bài thi."}
            </Note>
          </>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">
              {reset ? "Hủy" : guide ? "Đóng kịch bản" : "Đóng nguồn"}
            </Button>
          </DialogClose>
          {reset && (
            <Button onClick={() => act("confirm-reset")}>
              {backend ? "Bắt đầu phiên mới" : "Xóa & bắt đầu lại"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
