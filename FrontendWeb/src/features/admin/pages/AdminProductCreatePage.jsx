import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import ProductForm from "../components/product/ProductForm";
import { createAdminProduct, uploadAdminProductImages } from "../services/adminProducts.service";
import { useAuth } from "../../../context/AuthContext";
import { normalizeRole } from "../utils/rbac";

export default function AdminProductCreatePage() {
  const { token, user } = useAuth();
  const role = normalizeRole(user?.role);
  const canManageProducts = role === "admin";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload) => createAdminProduct(payload, token),
    onSuccess: () => {
      toast.success("Tạo sản phẩm thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/products");
    },
    onError: (err) => toast.error(err.message || "Tạo sản phẩm thất bại"),
  });

  if (!canManageProducts) {
    return (
      <div>
        <PageHeader title="Thêm sản phẩm" subtitle="Bạn chỉ có quyền xem danh sách sản phẩm. Chức năng tạo/sửa/xóa chỉ dành cho Admin." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Thêm sản phẩm" subtitle="RHF + Zod validation, hỗ trợ variants, SEO và rich text." />
      <ProductForm
        token={token}
        submitLabel="Tạo sản phẩm"
        submitting={mutation.isPending}
        onImageUpload={(files, productName) => uploadAdminProductImages(files, token, productName)}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  );
}
