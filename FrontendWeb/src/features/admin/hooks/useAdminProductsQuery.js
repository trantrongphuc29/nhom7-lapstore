import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { isStaffRole } from "../utils/rbac";
import { getAdminProducts } from "../services/adminProducts.service";

export function useAdminProductsQuery(params) {
  const { token, user } = useAuth();
  return useQuery({
    queryKey: ["admin-products", token, params],
    queryFn: () => getAdminProducts(params, token),
    enabled: Boolean(token && isStaffRole(user?.role)),
    keepPreviousData: true,
  });
}
