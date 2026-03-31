import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/common/StatCard";
import StatusBadge from "../components/common/StatusBadge";
import { useAdminDashboardQuery } from "../hooks/useAdminDashboardQuery";
import { formatVndCurrency } from "../utils/formatters";
import { useAuth } from "../../../context/AuthContext";
import { downloadReportExcel } from "../services/adminExcel.service";
import toast from "react-hot-toast";

export default function AdminDashboardOverviewPage() {
  const [range, setRange] = useState("7d");
  const now = new Date();
  const [periodType, setPeriodType] = useState("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1);
  const [day, setDay] = useState(now.toISOString().slice(0, 10));
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data, isLoading } = useAdminDashboardQuery();
  const { user, token } = useAuth();
  const canViewRevenue = Boolean(user?.permissions?.canExportFinancialReports);

  const chartData = useMemo(() => (range === "7d" ? data?.charts?.revenue7d || [] : data?.charts?.revenue30d || []), [range, data]);

  if (isLoading) return <div className="text-sm text-slate-500">Đang tải dashboard...</div>;

  const kpis = data?.kpis || {};
  const topProducts = data?.topProducts || [];
  const topByRevenue = data?.topProductsByRevenue || [];
  const recentOrders = data?.recentOrders || [];
  const ent = data?.enterprise || {};
  const rc = ent.revenueCompare || {};
  const maxSold = Math.max(...topProducts.map((x) => x.sold || 0), 1);

  const pct = (cur, prev) => {
    if (prev == null || !Number(prev)) return null;
    return ((Number(cur) - Number(prev)) / Number(prev)) * 100;
  };

  const exportRevenueReport = async () => {
    if (!token) return;
    const extra = { periodType: String(periodType) };
    if (periodType === "day") extra.day = day;
    if (periodType === "month") {
      extra.year = String(year);
      extra.month = String(month);
    }
    if (periodType === "quarter") {
      extra.year = String(year);
      extra.quarter = String(quarter);
    }
    if (periodType === "year") extra.year = String(year);
    if (periodType === "custom") {
      if (!fromDate || !toDate) {
        toast.error("Chọn đủ ngày bắt đầu và kết thúc.");
        return;
      }
      extra.from = fromDate;
      extra.to = toDate;
    }
    try {
      await downloadReportExcel("revenue", token, extra);
      toast.success("Đã tải báo cáo doanh thu.");
    } catch (e) {
      toast.error(e?.message || "Không tải được báo cáo doanh thu.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Dashboard tổng quan"
        subtitle={canViewRevenue ? "Doanh thu và hiệu suất sản phẩm theo thời gian." : "Hiệu suất sản phẩm và cảnh báo tồn kho."}
        actions={
          <>
            {canViewRevenue ? (
              <>
                <button
                  type="button"
                  onClick={() => setRange("7d")}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    range === "7d" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  7 ngày
                </button>
                <button
                  type="button"
                  onClick={() => setRange("30d")}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    range === "30d" ? "bg-blue-600 text-white border-blue-600" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  30 ngày
                </button>
              </>
            ) : null}
          </>
        }
      />

      {canViewRevenue ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon="payments"
            label="Doanh thu hôm nay"
            value={formatVndCurrency(rc.today)}
            trend={pct(rc.today, rc.todayPrev)}
          />
          <StatCard icon="analytics" label="Doanh thu 7 ngày" value={formatVndCurrency(rc.week)} />
          <StatCard icon="calendar_month" label="Doanh thu 30 ngày" value={formatVndCurrency(rc.month)} />
          <StatCard
            icon="inventory"
            label="Tồn &lt; 3 (cảnh báo)"
            value={ent.criticalStockUnder3 ?? kpis.lowStockProducts ?? 0}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <StatCard
            icon="percent"
            label="Margin TB (sản phẩm)"
            value={ent.avgMarginPercent != null ? `${Number(ent.avgMarginPercent).toFixed(2)}%` : "—"}
          />
          <StatCard
            icon="inventory"
            label="Tồn &lt; 3 (cảnh báo)"
            value={ent.criticalStockUnder3 ?? kpis.lowStockProducts ?? 0}
          />
          <StatCard icon="sell" label="Sản phẩm bán chạy (Top 5)" value={topProducts.length} />
        </div>
      )}

      {canViewRevenue ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Xuất báo cáo doanh thu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
            <select
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
            >
              <option value="day">Theo ngày</option>
              <option value="month">Theo tháng</option>
              <option value="quarter">Theo quý</option>
              <option value="year">Theo năm</option>
              <option value="custom">Khoảng thời gian</option>
            </select>
            {periodType === "day" ? (
              <input type="date" className="border rounded-lg px-3 py-2 text-sm bg-white" value={day} onChange={(e) => setDay(e.target.value)} />
            ) : null}
            {periodType === "month" ? (
              <>
                <input type="number" className="border rounded-lg px-3 py-2 text-sm bg-white" value={year} onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))} placeholder="Năm" />
                <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                  ))}
                </select>
              </>
            ) : null}
            {periodType === "quarter" ? (
              <>
                <input type="number" className="border rounded-lg px-3 py-2 text-sm bg-white" value={year} onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))} placeholder="Năm" />
                <select className="border rounded-lg px-3 py-2 text-sm bg-white" value={quarter} onChange={(e) => setQuarter(Number(e.target.value))}>
                  <option value={1}>Quý 1</option>
                  <option value={2}>Quý 2</option>
                  <option value={3}>Quý 3</option>
                  <option value={4}>Quý 4</option>
                </select>
              </>
            ) : null}
            {periodType === "year" ? (
              <input type="number" className="border rounded-lg px-3 py-2 text-sm bg-white" value={year} onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))} placeholder="Năm" />
            ) : null}
            {periodType === "custom" ? (
              <>
                <input type="date" className="border rounded-lg px-3 py-2 text-sm bg-white" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <input type="date" className="border rounded-lg px-3 py-2 text-sm bg-white" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </>
            ) : null}
            <button type="button" onClick={exportRevenueReport} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
              Xuất Excel doanh thu
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Nghiệp vụ: ưu tiên theo kỳ kế toán (ngày/tháng/quý/năm) và hỗ trợ khoảng thời gian tùy chỉnh để đối soát.</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {canViewRevenue ? (
          <div className="xl:col-span-2 min-w-0 bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Doanh thu theo thời gian</h3>
            <div className="h-[320px] w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} minTickGap={24} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => {
                      const n = Number(v || 0);
                      if (Math.abs(n) >= 1_000_000_000) return `${Math.round(n / 1_000_000_000)}B`;
                      if (Math.abs(n) >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
                      if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}K`;
                      return String(n);
                    }}
                    width={46}
                  />
                  <Tooltip formatter={(v) => formatVndCurrency(v)} />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 theo số lượng</h3>
          <div className="space-y-3">
            {topProducts.map((item) => (
              <div key={item.id}>
                <div className="flex items-center justify-between text-sm">
                  <p className="font-medium text-slate-700 line-clamp-1">{item.name}</p>
                  <p className="text-slate-500">{item.sold}</p>
                </div>
                <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${(item.sold / maxSold) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        {canViewRevenue ? (
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Top 5 theo doanh thu</h3>
            <div className="space-y-2 text-sm">
              {topByRevenue.length === 0 ? <p className="text-slate-500">Chưa có dữ liệu.</p> : null}
              {topByRevenue.map((item) => (
                <div key={item.id} className="flex justify-between gap-2 border-b border-slate-50 pb-2">
                  <span className="text-slate-700 line-clamp-1">{item.name}</span>
                  <span className="font-medium text-slate-800 shrink-0">{formatVndCurrency(item.revenue)}</span>
                </div>
              ))}
            </div>
            <div className="h-[160px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topByRevenue}>
                  <XAxis hide dataKey="name" />
                  <YAxis hide />
                  <Tooltip formatter={(v) => formatVndCurrency(v)} />
                  <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Đơn gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2">Mã đơn</th>
                  <th className="py-2">Khách hàng</th>
                  <th className="py-2">Tổng tiền</th>
                  <th className="py-2">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 font-medium text-slate-700">{order.code}</td>
                    <td className="py-3 text-slate-600">{order.customerName}</td>
                    <td className="py-3 text-slate-700">{formatVndCurrency(order.totalAmount)}</td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 ? (
                  <tr>
                    <td className="py-6 text-center text-slate-500" colSpan={4}>
                      Chưa có đơn hàng.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
