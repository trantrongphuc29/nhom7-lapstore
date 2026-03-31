import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import ProductForm from "../components/product/ProductForm";
import { getAdminProductDetail, updateAdminProduct, uploadAdminProductImages } from "../services/adminProducts.service";
import { useAuth } from "../../../context/AuthContext";
import { normalizeRole } from "../utils/rbac";

export default function AdminProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const role = normalizeRole(user?.role);
  const canManageProducts = role === "admin";
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (!canManageProducts) {
      setLoading(false);
      return () => undefined;
    }
    let mounted = true;
    getAdminProductDetail(id, token)
      .then((data) => {
        if (!mounted) return;
        setInitialValues(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id, token, canManageProducts]);

  const mutation = useMutation({
    mutationFn: (payload) => updateAdminProduct(id, payload, token),
    onSuccess: () => {
      toast.success("Cập nhật thành công");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      navigate("/admin/products");
    },
    onError: (err) => toast.error(err.message || "Cập nhật thất bại"),
  });

  if (!canManageProducts) {
    return (
      <div>
        <PageHeader title="Sản phẩm" subtitle="Bạn chỉ có quyền xem danh sách sản phẩm. Chức năng sửa/xóa chỉ dành cho Admin." />
      </div>
    );
  }

  if (loading) return <div className="text-sm text-slate-500">Đang tải dữ liệu sản phẩm...</div>;

  return (
    <div>
      <PageHeader title="Sửa sản phẩm" subtitle={`Cập nhật thông tin sản phẩm #${id}`} />
      <ProductForm
        token={token}
        initialValues={initialValues}
        submitLabel="Lưu thay đổi"
        submitting={mutation.isPending}
        onImageUpload={(files, productName) => uploadAdminProductImages(files, token, productName)}
        onSubmit={(values) => mutation.mutate(values)}
      />
    </div>
  );
}
