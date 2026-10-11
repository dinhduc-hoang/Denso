import { useCallback, useEffect, useRef, useState } from "react";
import Login from "@/components/Login";
import { DemoContext } from "./demo-context";
import { demoReducer, freshState } from "@/lib/demo";
import { sources } from "@/lib/sources";
import { request, getToken, setToken, downloadKnowledge } from "@/lib/api";
import { projectWorkspace } from "@/lib/workspace";

const selectionKey = "shopfloor-selection";
function initialSelection() {
  try {
    return JSON.parse(localStorage.getItem(selectionKey) || "{}");
  } catch {
    return {};
  }
}
export function BackendProvider({ children }) {
  const [state, setState] = useState(freshState);
  const [data, setData] = useState({});
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(Boolean(getToken()));
  const [loginError, setLoginError] = useState("");
  const [notification, setNotification] = useState("");
  const [dialog, setDialogState] = useState(null);
  const [selection, setSelection] = useState(initialSelection);
  const busy = useRef(false);
  const opener = useRef(null);
  const toastTimer = useRef(null);
  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setNotification(message);
    toastTimer.current = setTimeout(() => setNotification(""), 5000);
  }, []);
  const sync = useCallback(async (selected) => {
    const query = new URLSearchParams();
    if (selected.meetingId) query.set("meetingId", selected.meetingId);
    if (selected.incidentId) query.set("incidentId", selected.incidentId);
    if (selected.feedbackId) query.set("feedbackId", selected.feedbackId);
    const [result, overview] = await Promise.all([
      selected.fresh ? Promise.resolve({}) : request(`/workspace?${query}`),
      request("/overview"),
    ]);
    setData((previous) => ({
      ...result,
      overview,
      retrievedCard: selected.fresh ? null : previous.retrievedCard,
    }));
    setState((previous) => ({
      ...projectWorkspace(result),
      page: previous.page,
    }));
    return result;
  }, []);
  useEffect(() => {
    let active = true;
    if (!getToken()) return;
    request("/auth/me")
      .then(async (identity) => {
        await sync(initialSelection());
        if (active) setUser(identity);
      })
      .catch((error) => {
        if (error.status === 401) setToken(null);
        if (active) setLoginError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sync]);
  useEffect(() => {
    localStorage.setItem(selectionKey, JSON.stringify(selection));
  }, [selection]);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const login = async (email, password) => {
    setLoading(true);
    setLoginError("");
    try {
      const result = await request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setToken(result.token);
      await sync(selection);
      setUser(result.user);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch (error) {
      notify(error.message);
    } finally {
      setToken(null);
      setUser(null);
      setData({});
      setState(freshState());
    }
  };
  const setDialog = (value) => {
    if (value !== null) opener.current = document.activeElement;
    setDialogState(value);
  };
  const go = (page) => {
    setState((previous) => ({ ...previous, page }));
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const edit = (field, value) =>
    setState((previous) =>
      demoReducer(previous, { type: "edit", field, value }),
    );
  const run = async (callback) => {
    if (busy.current) return;
    busy.current = true;
    setProcessing(true);
    try {
      await callback();
    } catch (error) {
      notify(error.message);
      if (error.status === 401) {
        setToken(null);
        setUser(null);
      }
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  };
  const ensureMeeting = async () => {
    if (data.meeting) return data.meeting;
    const template = await request("/templates/sample-meeting");
    const meeting = await request("/meetings", {
      method: "POST",
      body: template,
    });
    const selected = { meetingId: meeting.id };
    setSelection(selected);
    await sync(selected);
    return meeting;
  };
  const saveDecision = async () => {
    if (
      state.decision === data.report.decision &&
      data.report.status !== "revision_requested"
    )
      return data.report;
    return request(`/reports/${data.report.id}`, {
      method: "PATCH",
      body: { decision: state.decision, revision: data.report.revision },
    });
  };
  const saveIncident = async () => {
    if (data.incident && state.feedback !== data.incident.feedback)
      await request(`/incidents/${data.incident.id}`, {
        method: "PATCH",
        body: { feedback: state.feedback },
      });
  };
  const act = (action, options = {}) => {
    const navigation = {
      start: 1,
      overview: 0,
      knowledge: 3,
      copilot: 4,
      feedback: 5,
    };
    if (action in navigation) return go(navigation[action]);
    if (action === "engineer")
      return run(async () => {
        await saveIncident();
        go(6);
      });
    if (action === "guide" || action === "reset") return setDialog(action);
    if (action === "workflow")
      return document
        .getElementById("workflow")
        ?.scrollIntoView({ behavior: "smooth" });
    if (action === "print") return window.print();
    if (action === "sample-note" || action === "retry")
      return setState((previous) => demoReducer(previous, { type: action }));
    if (action === "confirm-reset") {
      return run(async () => {
        setDialog(null);
        setState(freshState());
        setSelection({ fresh: true });
        await sync({ fresh: true });
        notify("Đã bắt đầu phiên mới. Lịch sử trên máy chủ được giữ lại.");
      });
    }
    return run(async () => {
      if (action === "process") {
        const meeting = await ensureMeeting();
        await request(`/meetings/${meeting.id}/reports`, {
          method: "POST",
          body: { mode: "sample" },
        });
        await sync({ meetingId: meeting.id });
        go(2);
      } else if (action === "save-report") {
        await saveDecision();
        await sync(selection);
        notify("Đã lưu quyết định bản nháp.");
      } else if (action === "save-feedback") {
        await saveIncident();
        notify("Đã lưu mô tả hiện trạng.");
      } else if (action === "approve") {
        if (!state.confirmed || !state.ack) return;
        const report = await saveDecision();
        await request(`/reports/${report.id}/approvals`, {
          method: "POST",
          body: { confirmed: true, ack: true, revision: report.revision },
        });
        await sync(selection);
        notify("Đã duyệt và phát hành hướng dẫn v1.");
      } else if (action === "revision") {
        const report = await saveDecision();
        await request(`/reports/${report.id}/revisions`, {
          method: "POST",
          body: {
            reason: "Cần đối chiếu và chỉnh sửa nội dung báo cáo.",
            revision: report.revision,
          },
        });
        await sync(selection);
        notify("Đã yêu cầu chỉnh sửa.");
      } else if (action === "search" || action === "unknown") {
        const query =
          action === "unknown"
            ? "E-NEW-99 — lỗi chưa được ghi nhận"
            : state.query;
        const result = await request("/retrievals", {
          method: "POST",
          body: {
            query,
            scope: data.meeting?.scope || {
              machine: "CAM-02",
              station: "Demo A",
              product: "S-01",
            },
          },
        });
        const card = result.cards[0];
        setData((previous) => ({ ...previous, retrievedCard: card }));
        setState((previous) => ({
          ...previous,
          query,
          searched: true,
          found: Boolean(card),
          decision: card?.document.decision || previous.decision,
          noteApproved: Boolean(card?.document.fieldNote),
          note: card?.document.fieldNote?.action || previous.note,
        }));
      } else if (action === "escalate" || action === "ineffective") {
        const card = data.retrievedCard;
        const feedback = state.found
          ? "Ảnh vẫn chưa đạt sau khi kiểm tra theo hướng dẫn đã duyệt."
          : "Không có hướng dẫn đã duyệt phù hợp; cần kỹ sư đánh giá.";
        const incident = await request("/incidents", {
          method: "POST",
          body: {
            query: state.query,
            scope: card?.scope ||
              data.meeting?.scope || {
                machine: "CAM-02",
                station: "Demo A",
                product: "S-01",
              },
            feedback,
            reason:
              action === "ineffective"
                ? "ineffective"
                : state.found
                  ? "out_of_scope"
                  : "unknown",
            ...(card ? { knowledgeId: card.id, version: card.version } : {}),
          },
        });
        const selected = { ...selection, incidentId: incident.id };
        setSelection(selected);
        await sync(selected);
        go(5);
        notify("Đã lưu yêu cầu kỹ sư trên máy chủ.");
      } else if (action === "effective") {
        const card = data.retrievedCard;
        if (!card) return;
        const saved = await request("/feedback", {
          method: "POST",
          body: {
            knowledgeId: card.id,
            version: card.version,
            result: "effective",
          },
        });
        setSelection((previous) => ({ ...previous, feedbackId: saved.id }));
        setState((previous) => ({
          ...previous,
          closed: true,
          feedback: "Hiệu quả",
        }));
        notify("Đã lưu phản hồi theo phiên bản hướng dẫn.");
      } else if (action === "save-note") {
        await saveIncident();
        await request(`/incidents/${data.incident.id}/notes`, {
          method: "POST",
          body: {
            cause: state.cause,
            action: state.note,
            conditions:
              "CAM-02 / Demo A / S-01. Theo SOP; chuyển người có thẩm quyền nếu ảnh chưa đạt.",
            evidenceIds:
              data.files
                ?.filter((file) => file.incidentId === data.incident.id)
                .map((file) => file.id) || [],
          },
        });
        await sync(selection);
        notify("Đã lưu bản nháp kỹ sư, chờ duyệt.");
      } else if (action === "return-note") {
        await request(`/notes/${data.note.id}/revisions`, {
          method: "POST",
          body: {
            reason: "Cần bổ sung hoặc chỉnh sửa phương án và bằng chứng.",
          },
        });
        await sync(selection);
        notify("Đã trả ghi chú để chỉnh sửa.");
      } else if (action === "approve-note") {
        await request(`/notes/${data.note.id}/approvals`, {
          method: "POST",
          body: { reviewed: options.reviewed === true },
        });
        await sync(selection);
        notify("Đã phát hành phiên bản mới; giữ đầy đủ lịch sử.");
      } else if (action === "export") {
        if (data.knowledge) await downloadKnowledge(data.knowledge.id);
      }
    });
  };
  const uploadFile = (field, file) =>
    run(async () => {
      const target =
        state.page >= 5 && data.incident
          ? { incidentId: data.incident.id }
          : { meetingId: (await ensureMeeting()).id };
      const body = new FormData();
      body.append("file", file);
      for (const [key, value] of Object.entries(target))
        body.append(key, value);
      const uploaded = await request("/files", { method: "POST", body });
      setData((previous) => ({
        ...previous,
        files: [uploaded, ...(previous.files || [])],
      }));
      edit(field, uploaded.name);
      notify("Đã tải tệp lên máy chủ.");
    });
  const sourceMap = { ...sources };
  const sourceSegments =
    state.page === 4 && data.retrievedCard
      ? data.retrievedCard.document.sources
      : data.meeting?.segments;
  for (const segment of sourceSegments || []) {
    const key = segment.kind === "action" ? "action" : segment.kind;
    sourceMap[key] = {
      title: `Nguồn ${segment.id} · ${String(Math.floor(segment.startSeconds / 60)).padStart(2, "0")}:${String(segment.startSeconds % 60).padStart(2, "0")}`,
      person: segment.speaker,
      quote: segment.text,
      detail: `Cuộc họp ${data.retrievedCard?.document.meetingId || data.meeting?.id} · Transcript được lưu trên máy chủ.`,
    };
  }
  const fieldSource =
    state.page === 4 && data.retrievedCard
      ? data.retrievedCard.document.fieldNote
      : data.note || data.knowledge?.document.fieldNote;
  if (fieldSource)
    sourceMap.field = {
      title: `Ghi chú · ${fieldSource.incidentId}`,
      person: fieldSource.createdBy,
      quote: fieldSource.action,
      detail: `Nguồn hiện trường · ${fieldSource.status || "approved"}`,
    };
  if (!user) return <Login onLogin={login} busy={loading} error={loginError} />;
  return (
    <DemoContext.Provider
      value={{
        state,
        processing,
        notification,
        dialog,
        setDialog,
        restoreDialogFocus: () =>
          opener.current?.isConnected
            ? opener.current.focus()
            : document.getElementById("main-content")?.focus(),
        go,
        edit,
        act,
        notify,
        backend: true,
        user,
        logout,
        uploadFile,
        sourceMap,
        serverData: data,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
