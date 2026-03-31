import React, { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import VariantMatrix, { defaultVariant } from "./VariantMatrix";
import ProductSpecsForm, { mergeLoadedSpecs } from "./ProductSpecsForm";
import ImageUploader from "./ImageUploader";
import { getAdminBrands } from "../../services/adminTaxonomy.service";
import { getAdminSkuSuggest } from "../../services/adminProducts.service";
import { useAuth } from "../../../../context/AuthContext";
import toast from "react-hot-toast";
import { validateSku } from "../../utils/validators";
import { htmlHasText, validateSpecsComplete, validateVariantComplete } from "../../utils/productFormValidation";
import { buildProductCanonicalUrl, getPublicSiteOrigin, slugifyProductName } from "./productSeo.utils";

const schema = z
  .object({
    name: z.string().min(3, "Tên sản phẩm tối thiểu 3 ký tự"),
    brand: z.string().min(1, "Thương hiệu là bắt buộc"),
    sku: z.string().min(1, "SKU sản phẩm là bắt buộc"),
    slug: z.string().min(1, "Slug là bắt buộc"),
    shortDescription: z.string().min(1, "Mô tả ngắn là bắt buộc"),
    status: z.enum(["active", "inactive", "out_of_stock", "coming_soon"]),
    metaTitle: z.string().min(1, "Meta title là bắt buộc"),
    canonicalUrl: z.string().min(1, "Canonical URL là bắt buộc"),
    detailHtml: z.string().min(1, "Mô tả chi tiết là bắt buộc"),
  })
  .superRefine((data, ctx) => {
    const skuErr = validateSku(data.sku);
    if (skuErr) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: skuErr, path: ["sku"] });
    }
    if (!htmlHasText(data.detailHtml)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Mô tả chi tiết phải có nội dung thực",
        path: ["detailHtml"],
      });
    }
  });

function mergeLoadedVariants(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr.map((v) => {
    const base = defaultVariant();
    const retail = v.retailPrice != null ? Number(v.retailPrice) : Number(v.price || 0);
    return {
      ...base,
      ...v,
      price: retail,
      retailPrice: retail,
      vatRate: v.vatRate != null ? Number(v.vatRate) : base.vatRate,
      importPrice: v.importPrice != null ? Number(v.importPrice) : base.importPrice,
      logisticsCost: v.logisticsCost != null ? Number(v.logisticsCost) : base.logisticsCost,
      operationalCost: v.operationalCost != null ? Number(v.operationalCost) : base.operationalCost,
      targetMarginPercent: v.targetMarginPercent != null && v.targetMarginPercent !== "" ? Number(v.targetMarginPercent) : "",
      roundingRule: v.roundingRule || base.roundingRule,
      allowLossOverride: Boolean(v.allowLossOverride),
      originalPrice: v.originalPrice != null && v.originalPrice !== "" ? Number(v.originalPrice) : 0,
      discount: v.discount != null && v.discount !== "" ? Number(v.discount) : base.discount,
    };
  });
}

function retailSignature(variants) {
  return JSON.stringify((variants || []).map((v) => Number(v.retailPrice ?? v.price ?? 0)));
}

export default function ProductForm({
  token,
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
  onImageUpload,
}) {
  const { user } = useAuth();
  const permissions = user?.permissions || {};
  const canViewCost = Boolean(permissions.canViewCostAndImport);

  const [variants, setVariants] = useState(() => {
    const list = initialValues?.variants;
    if (Array.isArray(list) && list.length > 0) return mergeLoadedVariants(list);
    return [defaultVariant()];
  });
  const [specs, setSpecs] = useState(() => mergeLoadedSpecs(initialValues?.specs));
  const [images, setImages] = useState([]);
  const [existingImageUrls, setExistingImageUrls] = useState(initialValues?.imageUrls || []);
  const [brands, setBrands] = useState([]);
  const initialRetailSig = useRef(retailSignature(mergeLoadedVariants(initialValues?.variants)));
  /** true = canonical đang theo slug tự động; false = admin đã sửa tay */
  const canonicalUserEditedRef = useRef(Boolean((initialValues?.canonicalUrl || "").trim()));

  const defaultValues = useMemo(
    () => ({
      name: initialValues?.name || "",
      brand: initialValues?.brand || "",
      sku: initialValues?.sku || "",
      slug: initialValues?.slug || "",
      shortDescription: initialValues?.shortDescription || "",
      status: initialValues?.status || "active",
      metaTitle: initialValues?.metaTitle || "",
      canonicalUrl: initialValues?.canonicalUrl || "",
      detailHtml: initialValues?.detailHtml || "",
    }),
    [initialValues]
  );

  const { register, control, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const slugWatched = watch("slug");
  const nameWatched = watch("name");
  const [skuSuggesting, setSkuSuggesting] = useState(false);
  const slugUserEditedRef = useRef(Boolean((initialValues?.slug || "").trim()));

  useEffect(() => {
    canonicalUserEditedRef.current = Boolean((initialValues?.canonicalUrl || "").trim());
  }, [initialValues?.id, initialValues?.canonicalUrl]);

  useEffect(() => {
    slugUserEditedRef.current = Boolean((initialValues?.slug || "").trim());
  }, [initialValues?.id, initialValues?.slug]);

  useEffect(() => {
    if (slugUserEditedRef.current) return;
    const next = slugifyProductName(nameWatched);
    setValue("slug", next, { shouldValidate: true, shouldDirty: true });
  }, [nameWatched, setValue]);

  useEffect(() => {
    if (canonicalUserEditedRef.current) return;
    const s = String(slugWatched || "").trim();
    if (!s) {
      setValue("canonicalUrl", "", { shouldValidate: true, shouldDirty: true });
      return;
    }
    const url = buildProductCanonicalUrl(s);
    if (url) setValue("canonicalUrl", url, { shouldValidate: true, shouldDirty: true });
  }, [slugWatched, setValue]);

  useEffect(() => {
    reset(defaultValues);
    const merged =
      Array.isArray(initialValues?.variants) && initialValues.variants.length > 0
        ? mergeLoadedVariants(initialValues.variants)
        : [defaultVariant()];
    setVariants(merged);
    setSpecs(mergeLoadedSpecs(initialValues?.specs));
    setExistingImageUrls(initialValues?.imageUrls || []);
    initialRetailSig.current = retailSignature(merged);
  }, [defaultValues, initialValues, reset]);

  useEffect(() => {
    let mounted = true;
    getAdminBrands(token)
      .then((b) => {
        if (!mounted) return;
        setBrands(b);
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    const current = String(initialValues?.brand || watch("brand") || "").trim();
    if (!current || !Array.isArray(brands) || brands.length === 0) return;
    const norm = current.toLowerCase();
    const matched = brands.find((b) => {
      const name = String(b?.name || "").trim().toLowerCase();
      const slug = String(b?.slug || "").trim().toLowerCase();
      return name === norm || slug === norm;
    });
    if (matched?.name && matched.name !== current) {
      setValue("brand", matched.name, { shouldValidate: true, shouldDirty: false });
    }
  }, [brands, initialValues?.brand, setValue, watch]);

  const handleSuggestProductSku = async () => {
    const name = watch("name");
    const brand = watch("brand");
    if (!String(name || "").trim() || !String(brand || "").trim()) {
      toast.error("Nhập tên sản phẩm và thương hiệu trước khi gợi ý SKU.");
      return;
    }
    setSkuSuggesting(true);
    try {
      const data = await getAdminSkuSuggest(
        {
          scope: "product",
          name: String(name).trim(),
          brand: String(brand).trim(),
          productId: initialValues?.id,
        },
        token
      );
      const sku = data?.sku;
      if (sku) {
        setValue("sku", sku, { shouldValidate: true, shouldDirty: true });
        toast.success("Đã áp dụng SKU gợi ý.");
      } else {
        toast.error("Không nhận được mã SKU.");
      }
    } catch (e) {
      toast.error(e?.message || "Gợi ý SKU thất bại.");
    } finally {
      setSkuSuggesting(false);
    }
  };

  const applyCanonicalFromSlug = () => {
    const s = String(watch("slug") || "").trim();
    if (!s) {
      toast.error("Nhập slug trước.");
      return;
    }
    canonicalUserEditedRef.current = false;
    const url = buildProductCanonicalUrl(s);
    if (url) {
      setValue("canonicalUrl", url, { shouldValidate: true, shouldDirty: true });
      toast.success("Đã gợi ý canonical từ slug.");
    }
  };

  const submitHandler = handleSubmit(async (values) => {
    const specErr = validateSpecsComplete(specs);
    if (specErr) {
      toast.error(specErr);
      return;
    }
    if (!variants || variants.length === 0) {
      toast.error("Cần ít nhất một phiên bản (màu / cấu hình / giá).");
      return;
    }
    for (let i = 0; i < variants.length; i += 1) {
      const vErr = validateVariantComplete(variants[i], i, { canViewCost });
      if (vErr) {
        toast.error(vErr);
        return;
      }
    }

    const existingImg = existingImageUrls.length;
    const newFiles = images.map((x) => x.file).filter(Boolean).length;
    if (existingImg + newFiles === 0) {
      toast.error("Cần ít nhất một ảnh sản phẩm (thêm ảnh mới hoặc giữ ảnh hiện có khi sửa).");
      return;
    }

    const nowSig = retailSignature(variants);
    if (nowSig !== initialRetailSig.current) {
      const ok = window.confirm(
        "Bạn đang thay đổi giá bán lẻ / phiên bản. Xác nhận lưu? Hãy kiểm tra lại margin và VAT trước khi tiếp tục."
      );
      if (!ok) return;
    }
    const files = images.map((x) => x.file).filter(Boolean);
    const uploaded = files.length > 0 && onImageUpload ? await onImageUpload(files, values.name) : [];
    onSubmit({
      ...values,
      variants,
      specs,
      images: [...existingImageUrls, ...uploaded],
    });
  });

  return (
    <form onSubmit={submitHandler} className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Tên sản phẩm *</label>
          <input {...register("name")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
          {errors.name ? <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium">Thương hiệu *</label>
          <select {...register("brand")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">Chọn thương hiệu</option>
            {brands.map((item) => (
              <option key={item.id} value={item.name}>{item.name}</option>
            ))}
          </select>
          {errors.brand ? <p className="text-xs text-rose-600 mt-1">{errors.brand.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium">SKU sản phẩm (thông tin chung) *</label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              {...register("sku")}
              className="w-full min-w-0 border rounded-lg px-3 py-2 text-sm font-mono sm:flex-1"
              placeholder="Mã nhóm / catalog — không trùng với SKU phiên bản"
            />
            <button
              type="button"
              onClick={handleSuggestProductSku}
              disabled={skuSuggesting}
              className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
            >
              {skuSuggesting ? "Đang gợi ý…" : "Gợi ý SKU"}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Khác với SKU từng phiên bản ở bảng dưới. Gợi ý dựa trên tên + thương hiệu (kiểm tra trùng trong hệ thống).
          </p>
          {errors.sku ? <p className="text-xs text-rose-600 mt-1">{errors.sku.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium">Slug *</label>
          <input
            {...register("slug", {
              onChange: () => {
                slugUserEditedRef.current = true;
              },
            })}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="vd. laptop-dell-xps-13"
          />
          <button
            type="button"
            className="mt-2 text-xs rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
            onClick={() => {
              const next = slugifyProductName(watch("name"));
              slugUserEditedRef.current = false;
              setValue("slug", next, { shouldValidate: true, shouldDirty: true });
            }}
          >
            Gợi ý slug từ tên
          </button>
          {errors.slug ? <p className="text-xs text-rose-600 mt-1">{errors.slug.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium">Trạng thái *</label>
          <select {...register("status")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm">
            <option value="active">Đang bán</option>
            <option value="inactive">Ngừng bán</option>
            <option value="out_of_stock">Hết hàng</option>
            <option value="coming_soon">Sắp ra mắt</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium">Mô tả ngắn *</label>
          <textarea {...register("shortDescription")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" rows={3} />
          {errors.shortDescription ? <p className="text-xs text-rose-600 mt-1">{errors.shortDescription.message}</p> : null}
        </div>
        <div className="md:col-span-2 admin-quill-editor">
          <label className="text-sm font-medium">Mô tả chi tiết (Rich Text) *</label>
          <div className="mt-2">
            <Controller
              control={control}
              name="detailHtml"
              render={({ field }) => (
                <ReactQuill theme="snow" value={field.value || ""} onChange={field.onChange} />
              )}
            />
          </div>
          {errors.detailHtml ? <p className="text-xs text-rose-600 mt-1">{errors.detailHtml.message}</p> : null}
        </div>
      </div>

      <ProductSpecsForm specs={specs} setSpecs={setSpecs} />

      <VariantMatrix
        variants={variants}
        setVariants={setVariants}
        token={token}
        permissions={permissions}
        productBrand={watch("brand")}
        productId={initialValues?.id}
      />

      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-1">Hình ảnh sản phẩm *</h3>
        <p className="text-xs text-slate-500 mb-3">Tạo mới: cần upload ít nhất một ảnh. Sửa: có thể giữ ảnh hiện có hoặc thêm ảnh mới.</p>
        <ImageUploader
          files={images}
          setFiles={setImages}
          existingUrls={existingImageUrls}
          setExistingUrls={setExistingImageUrls}
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium">Meta title *</label>
          <input {...register("metaTitle")} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
          {errors.metaTitle ? <p className="text-xs text-rose-600 mt-1">{errors.metaTitle.message}</p> : null}
        </div>
        <div>
          <label className="text-sm font-medium">Canonical URL *</label>
          <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              {...register("canonicalUrl", {
                onChange: () => {
                  canonicalUserEditedRef.current = true;
                },
              })}
              className="w-full min-w-0 border rounded-lg px-3 py-2 text-sm sm:flex-1"
              placeholder={`${getPublicSiteOrigin() || "https://domain-cua-ban"}/products/slug-san-pham`}
            />
            <button
              type="button"
              onClick={applyCanonicalFromSlug}
              className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Gợi ý từ slug
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Tự điền theo slug khi bạn chưa chỉnh tay URL này. Đặt <code className="rounded bg-slate-100 px-1">REACT_APP_PUBLIC_SITE_URL</code> (vd.{" "}
            <span className="font-mono">https://cua-hang-cua-ban.vn</span>) để domain đúng storefront, không dùng domain admin.
          </p>
          {errors.canonicalUrl ? <p className="text-xs text-rose-600 mt-1">{errors.canonicalUrl.message}</p> : null}
        </div>
      </div>

      <button disabled={submitting} className="px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold">
        {submitting ? "Đang lưu..." : submitLabel}
      </button>
    </form>
  );
}
