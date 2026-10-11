import { RotateCcw, Wrench } from "lucide-react";

export default function WorkflowSummary() {
  return (
    <div className="rounded-lg border bg-background p-4 md:hidden">
      <ol className="space-y-3" aria-label="Vòng tri thức">
        {[
          ["Cuộc họp kỹ thuật", "Ghi âm, transcript và bản vẽ"],
          ["Báo cáo có nguồn", "Quyết định, ý kiến phản biện và nhiệm vụ"],
          ["Chuyên gia kiểm duyệt", "Đối chiếu nội dung và phạm vi áp dụng"],
          ["Phát hành tri thức", "Chỉ phiên bản đã duyệt được sử dụng"],
          ["Trợ lý sàn máy", "Tra cứu hướng dẫn đúng máy, đúng trạm"],
          ["Phản hồi hiện trường", "Ghi nhận kết quả sau khi áp dụng"],
        ].map(([title, description], index) => (
          <li key={title} className="flex items-start gap-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full border bg-card text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <div>
              <strong className="text-xs">{title}</strong>
              <p className="mt-1 mb-0 text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-lg border border-primary/20 bg-accent/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold">
          <Wrench className="size-4 text-primary" aria-hidden="true" />
          Khi cần hỗ trợ kỹ sư
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Không tìm thấy hướng dẫn hoặc xử lý chưa hiệu quả → kỹ sư tiếp nhận và
          ghi chú.
        </p>
        <div className="flex items-start gap-2 text-xs">
          <RotateCcw
            className="size-4 shrink-0 text-primary"
            aria-hidden="true"
          />
          <span>
            Tạo bản nháp mới → chuyên gia duyệt v2 → cập nhật kho tri thức.
          </span>
        </div>
      </div>
    </div>
  );
}
