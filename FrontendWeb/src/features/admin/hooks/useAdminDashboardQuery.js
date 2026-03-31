import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { isStaffRole } from "../utils/rbac";
import { getAdminDashboardOverview } from "../services/adminDashboard.service";

export function useAdminDashboardQuery() {
  const { token, isAuthenticated, user } = useAuth();
  return useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: () => getAdminDashboardOverview(token),
    enabled: Boolean(isAuthenticated && token && isStaffRole(user?.role)),
    staleTime: 20 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  });
}
