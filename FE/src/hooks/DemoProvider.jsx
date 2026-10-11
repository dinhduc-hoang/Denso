import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  demoReducer,
  knowledgeExport,
  loadState,
  STORAGE_KEY,
} from "@/lib/demo";
import { sources } from "@/lib/sources";
import { DemoContext } from "./demo-context";

function downloadJson(value) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "knowledge-demo.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, () => {
    try {
      return loadState(window.localStorage);
    } catch {
      return loadState(null);
    }
  });
  const [processing, setProcessing] = useState(false);
  const [notification, setNotification] = useState("");
  const [dialog, setDialogState] = useState(null);
  const dialogOpener = useRef(null);
  const setDialog = (value) => {
    if (value !== null) dialogOpener.current = document.activeElement;
    setDialogState(value);
  };
  const restoreDialogFocus = () => {
    if (dialogOpener.current?.isConnected) dialogOpener.current.focus();
    else document.getElementById("main-content")?.focus();
  };
  const processingTimer = useRef(null);
  const toastTimer = useRef(null);
  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setNotification(message);
    toastTimer.current = setTimeout(() => setNotification(""), 3500);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* In-memory demo still works. */
    }
  }, [state]);
  useEffect(
    () => () => {
      clearTimeout(processingTimer.current);
      clearTimeout(toastTimer.current);
    },
    [],
  );

  const go = useCallback((page) => {
    dispatch({ type: "navigate", page });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const edit = (field, value) => dispatch({ type: "edit", field, value });
  const act = (action, options = {}) => {
    const navigation = {
      start: 1,
      overview: 0,
      knowledge: 3,
      copilot: 4,
      feedback: 5,
      engineer: 6,
    };
    if (action in navigation) return go(navigation[action]);
    switch (action) {
      case "workflow":
        document
          .getElementById("workflow")
          ?.scrollIntoView({ behavior: "smooth" });
        return;
      case "guide":
        setDialog("guide");
        return;
      case "reset":
        setDialog("reset");
        return;
      case "confirm-reset":
        clearTimeout(processingTimer.current);
        setProcessing(false);
        setDialog(null);
        dispatch({ type: "reset" });
        notify("Demo đã được đặt lại.");
        return;
      case "print":
        window.print();
        return;
      case "export": {
        const result = knowledgeExport(state, sources);
        if (result) downloadJson(result);
        return;
      }
      case "process":
        if (processing) return;
        if (state.approved) {
          go(2);
          notify(
            "Báo cáo đã phát hành. Dùng Làm lại demo để bắt đầu phiên mới.",
          );
          return;
        }
        setProcessing(true);
        processingTimer.current = setTimeout(() => {
          setProcessing(false);
          dispatch({ type: "process" });
          window.scrollTo({ top: 0, behavior: "instant" });
        }, 950);
        return;
      case "approve":
        if (
          !state.processed ||
          !state.confirmed ||
          !state.ack ||
          !state.decision.trim()
        )
          return;
        notify("Đã duyệt v1. Hướng dẫn sẵn sàng trong kho tri thức.");
        break;
      case "revision":
        notify("Đã yêu cầu chỉnh sửa bản nháp.");
        break;
      case "escalate":
      case "ineffective":
        notify("Đã tạo yêu cầu kỹ sư trong demo; không gửi thông báo thật.");
        break;
      case "effective":
        notify("Đã ghi nhận phản hồi cho phiên bản hướng dẫn.");
        break;
      case "save-note":
        if (!state.cause.trim() || !state.note.trim()) {
          notify("Cần điền cả nguyên nhân thực tế và phương án xử lý.");
          return;
        }
        notify(
          "Đã tạo bản nháp tri thức từ hiện trường; chờ chuyên gia duyệt.",
        );
        break;
      case "return-note":
        notify("Ghi chú được trả lại cho kỹ sư chỉnh sửa.");
        break;
      case "approve-note":
        if (!state.noteDraft || !options.reviewed) return;
        if (!state.approved) {
          notify(
            "Duyệt báo cáo v1 trước để tiếp tục phát hành v2 trong tình huống demo.",
          );
          go(2);
          return;
        }
        notify("Đã phát hành v2, giữ v1 trong lịch sử.");
        break;
      default:
        break;
    }
    dispatch({ type: action, ...options });
  };

  return (
    <DemoContext.Provider
      value={{
        state,
        processing,
        notification,
        dialog,
        setDialog,
        restoreDialogFocus,
        go,
        edit,
        act,
        notify,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}
