import { useCallback, useRef } from "react";

export function useDebouncedCallback(fn, delay = 500) {
  const t = useRef(null);
  return useCallback(
    (...args) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => {
        t.current = null;
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
}
