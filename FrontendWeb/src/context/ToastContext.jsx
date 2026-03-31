import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

let toastSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.map((x) => (x.id === id ? { ...x, exiting: true } : x)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 280);
  }, []);

  const push = useCallback(
    (payload) => {
      const id = ++toastSeq;
      const duration = payload.duration ?? 3000;
      const toast = { id, ...payload, exiting: false };
      setToasts((prev) => [...prev, toast]);
      if (duration > 0) {
        const tid = setTimeout(() => remove(id), duration);
        timers.current.set(id, tid);
      }
      return id;
    },
    [remove]
  );

  const success = useCallback(
    (message, opts = {}) => {
      return push({ type: "success", message, duration: opts.duration ?? 3000 });
    },
    [push]
  );

  const error = useCallback(
    (message, opts = {}) => {
      return push({ type: "error", message, duration: opts.duration ?? 3500 });
    },
    [push]
  );

  const undo = useCallback(
    (message, onUndo, opts = {}) => {
      const id = push({
        type: "undo",
        message,
        onUndo,
        duration: opts.duration ?? 5000,
      });
      return id;
    },
    [push]
  );

  const value = useMemo(
    () => ({ toasts, remove, success, error, undo, push }),
    [toasts, remove, success, error, undo, push]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
