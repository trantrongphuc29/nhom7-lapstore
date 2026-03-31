import React from "react";
import PageHeader from "../components/common/PageHeader";

export default function AdminModulePlaceholderPage({ title }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <PageHeader title={title} subtitle="Module đang được scaffold theo kiến trúc mới." />
      <p className="text-sm text-slate-500">
        Khung routing, state và layout đã sẵn sàng. Bước tiếp theo là hoàn thiện DataTable, Form, validation và API chi tiết cho module này.
      </p>
    </div>
  );
}
