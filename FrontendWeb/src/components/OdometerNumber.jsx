import React from "react";

function DigitRoll({ digit }) {
  if (!/^\d$/.test(String(digit))) {
    return <span className="inline">{digit}</span>;
  }
  const n = parseInt(digit, 10);
  const h = "1.25em";
  return (
    <span
      className="inline-block overflow-hidden align-[-0.08em] text-center text-inherit"
      style={{ height: h, width: "0.58em" }}
    >
      <span
        className="block transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{
          transform: `translateY(calc(-${n} * ${h}))`,
        }}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className="block tabular-nums"
            style={{ height: h, lineHeight: h }}
          >
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

/**
 * Hiển thị số với hiệu ứng trượt dọc từng chữ số (odometer nhẹ).
 */
export default function OdometerNumber({ value, className = "" }) {
  const str = String(Math.max(0, Math.floor(Number(value)) || 0));
  return (
    <span
      className={`inline-flex items-center tabular-nums leading-none ${className}`.trim()}
    >
      {str.split("").map((d, i) => (
        <DigitRoll key={`${i}-${str.length}`} digit={d} />
      ))}
    </span>
  );
}
