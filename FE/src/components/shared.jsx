import { ArrowUpRight, Check } from "lucide-react";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@/components/ui/button";
import { Card } from "@astryxdesign/core/Card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useDemo } from "@/hooks/demo-context";
import { cn } from "@/lib/utils";

export function ActButton({
  action,
  secondary = false,
  children,
  className,
  ...props
}) {
  const { act } = useDemo();
  return (
    <Button
      variant={secondary ? "outline" : "default"}
      className={cn(
        "h-auto min-h-10 max-w-full text-xs whitespace-normal",
        className,
      )}
      onClick={() => act(action)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function SourceButton({ source, children }) {
  const { setDialog } = useDemo();
  return (
    <Button
      variant="secondary"
      size="sm"
      className="source h-auto whitespace-normal bg-accent px-2 py-1 text-[10px] text-primary hover:bg-accent/70"
      onClick={() => setDialog(source)}
    >
      {children}
      <ArrowUpRight className="size-3" />
    </Button>
  );
}

export function Pill({ tone = "", children }) {
  return (
    <Badge
      variant={
        { green: "success", amber: "warning", red: "error" }[tone] || "neutral"
      }
      label={children}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        {
          "bg-emerald-50 text-success": tone === "green",
          "bg-amber-50 text-warning": tone === "amber",
          "bg-accent text-primary": tone === "red",
        },
      )}
    />
  );
}

export function Panel({ className, children }) {
  return (
    <Card padding={0} className={cn("panel p-5 sm:p-6", className)}>
      {children}
    </Card>
  );
}

export function PageHead({ tag, title, description, children }) {
  return (
    <div className="page-head">
      <div className="min-w-0">
        <div className="eyebrow">{tag}</div>
        <h1>{title}</h1>
        <p className="sub">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Note({ tone = "", children }) {
  return <div className={cn("note", tone)}>{children}</div>;
}

export function Divider() {
  return <Separator className="my-5" />;
}

export function Locked({ title, description, page, label }) {
  const { go } = useDemo();
  return (
    <div className="empty">
      <div className="eyebrow">BƯỚC TRƯỚC CHƯA HOÀN THÀNH</div>
      <h1 className="text-xl">{title}</h1>
      <p className="muted">{description}</p>
      <Button onClick={() => go(page)}>{label} →</Button>
    </div>
  );
}

export function DemoField({
  field,
  id = field,
  label,
  multiline = false,
  readOnly = false,
  placeholder,
}) {
  const { state, edit } = useDemo();
  const Control = multiline ? Textarea : Input;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        className="font-normal"
        value={state[field]}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(event) => edit(field, event.target.value)}
      />
    </div>
  );
}

export function ReviewCheck({ id, checked, onCheckedChange, children }) {
  return (
    <div className="check">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5 shrink-0"
      />
      <label htmlFor={id}>{children}</label>
    </div>
  );
}

export function FileField({ id, field, label, accept }) {
  const { edit, notify, uploadFile } = useDemo();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        type="file"
        accept={accept}
        className="min-w-0 font-normal"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            if (uploadFile) {
              uploadFile(field, file);
              return;
            }
            edit(field, file.name);
            notify(
              "Tên tệp đã được ghi nhận; demo chưa tải lên hoặc xử lý nội dung.",
            );
          }
        }}
      />
    </div>
  );
}

export function Scope() {
  return (
    <div className="meta">
      <span>
        Máy <b>CAM-02</b>
      </span>
      <span>
        Trạm <b>Demo A</b>
      </span>
      <span>
        Sản phẩm <b>S-01</b>
      </span>
    </div>
  );
}

export function Steps({ report = false, approved = false }) {
  return (
    <ol
      className="steps mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Tiến trình báo cáo"
    >
      {["Đầu vào", "Trích xuất có nguồn", "Duyệt nội dung", "Phát hành"].map(
        (label, i) => {
          const done = report && (i < 2 || approved);
          const current = !approved && i === (report ? 2 : 0);
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={cn(
                "step-item",
                done && "step-done",
                current && "step-current",
              )}
            >
              <span className="step-number" aria-hidden="true">
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span>
                <span className="step-caption">BƯỚC 0{i + 1}</span>
                <span className="step-label">{label}</span>
              </span>
            </li>
          );
        },
      )}
    </ol>
  );
}
