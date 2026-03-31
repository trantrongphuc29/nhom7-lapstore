import React, { useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { BACKEND_BASE_URL } from "../../../../config/api";

function resolveSrc(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${BACKEND_BASE_URL}/${String(url).replace(/^\//, "")}`;
}

export default function ImageUploader({ files, setFiles, existingUrls = [], setExistingUrls }) {
  const previewSetRef = useRef(new Set());
  const onDrop = useCallback(
    (acceptedFiles) => {
      const mapped = acceptedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setFiles([...(files || []), ...mapped]);
    },
    [files, setFiles]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } });
  const removeExisting = (index) => {
    if (!setExistingUrls) return;
    setExistingUrls((prev) => prev.filter((_, idx) => idx !== index));
  };
  const removeNewFile = (index) => {
    setFiles((prev) => {
      const target = prev?.[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  useEffect(() => {
    const nextSet = new Set((files || []).map((item) => item?.preview).filter(Boolean));
    previewSetRef.current.forEach((url) => {
      if (!nextSet.has(url)) URL.revokeObjectURL(url);
    });
    previewSetRef.current = nextSet;
  }, [files]);

  useEffect(() => {
    return () => {
      previewSetRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div>
      {existingUrls.length > 0 ? (
        <p className="text-xs text-slate-600 mb-2">
          Ảnh hiện có trên máy chủ ({existingUrls.length}). Thêm ảnh mới bên dưới — khi lưu, ảnh mới sẽ thay toàn bộ nếu bạn upload.
        </p>
      ) : null}
      {existingUrls.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          {existingUrls.map((url, idx) => (
            <div key={`ex-${idx}`} className="aspect-square border rounded-lg overflow-hidden relative bg-slate-50">
              <img src={resolveSrc(url)} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeExisting(idx)}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/65 text-white text-xs font-bold hover:bg-black/80"
                aria-label="Xóa ảnh hiện có"
                title="Xóa ảnh"
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer ${
          isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-300"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-sm text-slate-600">Kéo thả ảnh hoặc click để thêm ảnh mới</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
        {(files || []).map((f, idx) => (
          <div key={idx} className="aspect-square border rounded-lg overflow-hidden relative">
            <img src={f.preview} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeNewFile(idx)}
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/65 text-white text-xs font-bold hover:bg-black/80"
              aria-label="Xóa ảnh mới"
              title="Xóa ảnh"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
