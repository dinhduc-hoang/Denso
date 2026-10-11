import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  FileAudio,
  KeyRound,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Brand from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const demoAccount = {
  email: "admin@demo.local",
  password: "DensoDemo@2026!",
};

export default function Login({ onLogin, busy, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  return (
    <main className="login-page">
      <div className="login-layout">
        <aside className="login-story" aria-label="Giới thiệu workspace">
          <Brand />
          <div className="login-story-content">
            <span className="login-kicker">KẾT NỐI TRI THỨC VÀ VẬN HÀNH</span>
            <p className="login-headline">
              Quyết định trong họp.
              <br />
              <span>Tri thức trên sàn máy.</span>
            </p>
            <p className="login-description">
              Đưa kinh nghiệm của chuyên gia đến đúng người, đúng trạm máy — qua
              những hướng dẫn đã được kiểm duyệt.
            </p>
            <ol className="login-flow">
              {[
                [
                  FileAudio,
                  "Thu lại quyết định",
                  "Báo cáo có nguồn từ cuộc họp",
                ],
                [
                  ShieldCheck,
                  "Chuyên gia phê duyệt",
                  "Nội dung rõ ràng, đúng phạm vi",
                ],
                [
                  Wrench,
                  "Áp dụng tại sàn máy",
                  "Hướng dẫn và phản hồi hiện trường",
                ],
              ].map(([icon, title, description], index) => {
                const Icon = icon;
                return (
                  <li key={title}>
                    <span className="login-flow-icon">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{title}</strong>
                      <span>{description}</span>
                    </div>
                    <span className="login-flow-number">0{index + 1}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="login-story-footer">
            DENSO HACKATHON · ĐỀ A2.1 · BẢN MINH HỌA
          </p>
        </aside>
        <section className="login-form-panel" aria-labelledby="login-heading">
          <div className="login-form-content">
            <span className="eyebrow">WORKSPACE</span>
            <h1 id="login-heading">Chào mừng trở lại</h1>
            <p className="muted mb-8">
              Đăng nhập để tiếp tục vòng tri thức của bạn.
            </p>
            <form
              className="grid gap-5"
              onSubmit={(event) => {
                event.preventDefault();
                onLogin(email, password);
              }}
            >
              <div className="grid gap-2">
                <label htmlFor="login-email" className="text-sm font-semibold">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="ten@demo.local"
                  required
                  value={email}
                  disabled={busy}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="grid gap-2">
                <label
                  htmlFor="login-password"
                  className="text-sm font-semibold"
                >
                  Mật khẩu
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    required
                    value={password}
                    disabled={busy}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-11 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 size-9 text-muted-foreground"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
              {error && (
                <p
                  role="alert"
                  className="mb-0 rounded-md border border-destructive/20 bg-accent p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <Button type="submit" disabled={busy} className="h-11 w-full">
                {busy ? "Đang kết nối…" : "Đăng nhập"}
                {!busy && <ArrowRight className="size-4" aria-hidden="true" />}
              </Button>
            </form>
            <section
              aria-labelledby="demo-account-heading"
              className="demo-account"
            >
              <div className="mb-3 flex items-center gap-2">
                <KeyRound className="size-4 text-primary" aria-hidden="true" />
                <h2 id="demo-account-heading" className="mb-0 text-sm">
                  Tài khoản dùng thử
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Dùng tài khoản này để trải nghiệm toàn bộ tính năng.
              </p>
              <dl className="demo-credentials">
                <div>
                  <dt>Email đăng nhập</dt>
                  <dd>{demoAccount.email}</dd>
                </div>
                <div>
                  <dt>Mật khẩu dùng thử</dt>
                  <dd>{demoAccount.password}</dd>
                </div>
              </dl>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-10 w-full"
                disabled={busy}
                onClick={() => {
                  setEmail(demoAccount.email);
                  setPassword(demoAccount.password);
                  document.getElementById("login-email")?.focus();
                }}
              >
                Điền tài khoản dùng thử
              </Button>
            </section>
            <p className="login-form-footer">
              Meeting-to-Shopfloor · Tri thức có nguồn, hướng dẫn đã duyệt.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
