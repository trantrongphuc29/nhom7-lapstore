import React from "react";

/** Thông số kỹ thuật chung (bảng product_specs) — hiển thị trên trang chi tiết & lọc catalog. */
export function defaultProductSpecs() {
  return {
    cpu: "",
    gpuOnboard: "",
    gpuDiscrete: "Không",
    ram: "",
    ramMax: "",
    storage: "",
    storageMax: "",
    screenSize: "",
    screenResolution: "",
    screenTechnology: "",
    ports: "",
    battery: "",
    dimensions: "",
    weight: "",
    material: "",
    wireless: "",
    webcam: "",
    os: "",
  };
}

export function mergeLoadedSpecs(raw) {
  const base = defaultProductSpecs();
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    cpu: raw.cpu ?? "",
    gpuOnboard: raw.gpuOnboard ?? "",
    gpuDiscrete: String(raw.gpuDiscrete ?? raw.gpu_discrete ?? "").trim() || "Không",
    ram: raw.ram ?? "",
    ramMax: raw.ramMax ?? "",
    storage: raw.storage ?? "",
    storageMax: raw.storageMax ?? "",
    screenSize: raw.screenSize ?? "",
    screenResolution: raw.screenResolution ?? "",
    screenTechnology: raw.screenTechnology ?? "",
    ports: raw.ports ?? "",
    battery: raw.battery ?? "",
    dimensions: raw.dimensions ?? "",
    weight: raw.weight ?? "",
    material: raw.material ?? "",
    wireless: raw.wireless ?? "",
    webcam: raw.webcam ?? "",
    os: raw.os ?? "",
  };
}

function Field({ label, hint, value, onChange, multiline = false }) {
  const common = "mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white";
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">
        <span className="text-rose-600">*</span> {label}
      </label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={common} placeholder={hint} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={common} placeholder={hint} />
      )}
    </div>
  );
}

export default function ProductSpecsForm({ specs, setSpecs }) {
  const patch = (key) => (v) => setSpecs((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">Thông số kỹ thuật (chung cho sản phẩm)</h3>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          <span className="text-rose-600 font-medium">Bắt buộc nhập đủ</span> — GPU rời không có thì ghi <span className="font-mono">Không</span>.
          Phiên bản (màu, RAM/SSD, SKU…) nhập ở bảng bên dưới.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="CPU" hint="VD: Intel Core Ultra 7 155H" value={specs.cpu} onChange={patch("cpu")} />
        <Field label="GPU tích hợp" hint="VD: Intel Arc Graphics" value={specs.gpuOnboard} onChange={patch("gpuOnboard")} />
        <Field label="GPU rời (nếu có)" hint="VD: NVIDIA GeForce RTX 4070 8GB" value={specs.gpuDiscrete} onChange={patch("gpuDiscrete")} />
        <Field label="RAM (thông số chung)" hint="VD: 16GB LPDDR5x" value={specs.ram} onChange={patch("ram")} />
        <Field label="RAM tối đa (hỗ trợ nâng cấp)" hint="VD: 64GB" value={specs.ramMax} onChange={patch("ramMax")} />
        <Field label="Ổ cứng (mặc định / gợi ý)" hint="VD: 512GB SSD NVMe" value={specs.storage} onChange={patch("storage")} />
        <Field label="Ổ tối đa" hint="VD: 2TB SSD" value={specs.storageMax} onChange={patch("storageMax")} />
        <Field label="Kích thước màn hình" hint="VD: 14 inch" value={specs.screenSize} onChange={patch("screenSize")} />
        <Field label="Độ phân giải" hint="VD: 2880x1800" value={specs.screenResolution} onChange={patch("screenResolution")} />
        <Field label="Công nghệ màn hình" hint="VD: OLED 120Hz" value={specs.screenTechnology} onChange={patch("screenTechnology")} />
        <Field label="Pin" hint="VD: 75Wh" value={specs.battery} onChange={patch("battery")} />
        <Field label="Kích thước (DxRxC)" hint="VD: 312 x 221 x 15 mm" value={specs.dimensions} onChange={patch("dimensions")} />
        <Field label="Trọng lượng" hint="VD: 1.41 kg" value={specs.weight} onChange={patch("weight")} />
        <Field label="Chất liệu" hint="VD: Nhôm" value={specs.material} onChange={patch("material")} />
        <Field label="Kết nối không dây" hint="VD: Wi-Fi 6E, Bluetooth 5.3" value={specs.wireless} onChange={patch("wireless")} />
        <Field label="Webcam" hint="VD: FHD 1080p" value={specs.webcam} onChange={patch("webcam")} />
        <Field label="Hệ điều hành" hint="VD: Windows 11 Home" value={specs.os} onChange={patch("os")} />
      </div>

      <Field
        label="Cổng kết nối"
        hint="Liệt kê USB-C, HDMI, jack tai nghe…"
        value={specs.ports}
        onChange={patch("ports")}
        multiline
      />
    </div>
  );
}
