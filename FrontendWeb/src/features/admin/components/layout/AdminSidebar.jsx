import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext";
import { ADMIN_MENU } from "../../constants/menu";
import { useAdminUiStore } from "../../store/adminUiStore";
import { filterAdminMenu } from "../../utils/rbac";

function SidebarItem({ item, collapsed, badges }) {
  if (item.children) {
    return (
      <div className="mt-4">
        {!collapsed ? (
          <div className="px-2 mb-2 flex items-center gap-2 text-slate-300">
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
            <p className="text-xs uppercase tracking-wide font-semibold">{item.label}</p>
          </div>
        ) : (
          <div className="px-2 mb-2 flex justify-center text-slate-400" title={item.label}>
            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
          </div>
        )}
        <div className={`space-y-1 ${collapsed ? "" : "ml-2 pl-2 border-l border-slate-800"}`}>
          {item.children.map((child) => (
            <NavLink
              key={child.key}
              to={child.path}
              end={Boolean(child.end)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg ${collapsed ? "px-2 py-2" : "px-3 py-2"} text-sm transition ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`
              }
              title={collapsed ? child.label : undefined}
            >
              {!collapsed ? (
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  <span>{child.label}</span>
                </span>
              ) : (
                <span className="material-symbols-outlined text-base">radio_button_checked</span>
              )}
              {!collapsed && child.badgeKey && badges?.[child.badgeKey] ? (
                <span className="inline-flex min-w-[1.4rem] h-5 px-1.5 items-center justify-center rounded-full text-xs font-semibold bg-amber-500 text-slate-900">
                  {badges[child.badgeKey]}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={Boolean(item.end)}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
          isActive ? "bg-blue-600 text-white" : "text-slate-200 hover:bg-slate-800"
        }`
      }
      title={collapsed ? item.label : undefined}
    >
      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
      {!collapsed ? <span>{item.label}</span> : null}
    </NavLink>
  );
}

export default function AdminSidebar({ badges }) {
  const { sidebarCollapsed } = useAdminUiStore();
  const { user } = useAuth();
  const menu = useMemo(() => filterAdminMenu(ADMIN_MENU, user?.role), [user?.role]);
  return (
    <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} bg-slate-900 text-white h-screen sticky top-0 p-3 transition-all`}>
      <div className="h-14 flex items-center px-2">
        <span className="material-symbols-outlined">settings_applications</span>
        {!sidebarCollapsed ? <span className="ml-2 font-semibold">Admin Panel</span> : null}
      </div>
      <nav className="mt-3 overflow-y-auto max-h-[calc(100vh-88px)] pr-1">
        {menu.map((item) => (
          <SidebarItem key={item.key} item={item} collapsed={sidebarCollapsed} badges={badges} />
        ))}
      </nav>
    </aside>
  );
}
