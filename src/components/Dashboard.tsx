import React, { useState, useMemo } from "react";
import type { ChangeEvent } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import type { IDocument, Role } from "../types";
import { STATUS_CONFIG } from "../constants/config";
import { INITIAL_STAGES } from "../constants/config";
import StatusBadge from "./StatusBadge";
import { db } from "../firebase";
import { doc as fsDoc, deleteDoc } from "firebase/firestore";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const THAI_DIGIT_MAP: Record<string, string> = {
  "๐": "0",
  "๑": "1",
  "๒": "2",
  "๓": "3",
  "๔": "4",
  "๕": "5",
  "๖": "6",
  "๗": "7",
  "๘": "8",
  "๙": "9",
};

const normalizeThaiDigits = (value: string): string => {
  return value.replace(/[๐-๙]/g, (d) => THAI_DIGIT_MAP[d] ?? d);
};

const parseCreatedAt = (raw: string) => {
  if (!raw) return null;
  const normalized = normalizeThaiDigits(raw).trim();
  const cleaned = normalized.replace(/\//g, "-").replace(",", "");
  let parsed = dayjs(cleaned, "DD-MM-YYYY HH:mm", true);
  if (!parsed.isValid()) return null;
  const year = parsed.year();
  if (year > 2400) {
    parsed = parsed.year(year - 543);
  }
  return parsed;
};

type CardFilter = "all" | "pending" | "completed" | "rejected" | "near3" | "over3";

interface DashboardProps {
  documents: IDocument[];
  setView: (v: string) => void;
  setSelectedDocId: (id: string) => void;
  userRole: Role;
}

const Dashboard: React.FC<DashboardProps> = ({
  documents,
  setView,
  setSelectedDocId,
  userRole,
}) => {
  const stages = INITIAL_STAGES;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCard, setActiveCard] = useState<CardFilter>("all");
  const itemsPerPage = 20;

  const filteredDocs = useMemo(() => {
    const now = dayjs();
    const filtered = documents.filter((doc) => {
      const createdAt = parseCreatedAt(doc.created_at);
      const inProgress = !["Completed", "Rejected", "Paid"].includes(
        doc.current_status
      );
      const diffDays = createdAt ? now.diff(createdAt, "day") : null;

      let matchesCard = true;
      switch (activeCard) {
        case "pending":
          matchesCard = inProgress;
          break;
        case "completed":
          matchesCard = doc.current_status === "Completed";
          break;
        case "rejected":
          matchesCard = doc.current_status === "Rejected";
          break;
        case "near3":
          matchesCard = inProgress && diffDays === 2;
          break;
        case "over3":
          matchesCard = inProgress && diffDays !== null && diffDays >= 3;
          break;
        case "all":
        default:
          matchesCard = true;
      }

      const matchesStatus =
        statusFilter === "All" || doc.current_status === statusFilter;
      const matchesSearch =
        doc.document_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCard && matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const aDate = parseCreatedAt(a.created_at);
      const bDate = parseCreatedAt(b.created_at);
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      // เรียงจากใหม่ไปเก่า
      return bDate.valueOf() - aDate.valueOf();
    });
  }, [documents, activeCard, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const now = dayjs();
    const inProgress = documents.filter(
      (d) => !["Completed", "Rejected", "Paid"].includes(d.current_status)
    );

    const near3 = inProgress.filter((d) => {
      const createdAt = parseCreatedAt(d.created_at);
      if (!createdAt) return false;
      const diff = now.diff(createdAt, "day");
      return diff === 2;
    }).length;

    const over3 = inProgress.filter((d) => {
      const createdAt = parseCreatedAt(d.created_at);
      if (!createdAt) return false;
      const diff = now.diff(createdAt, "day");
      return diff >= 3;
    }).length;

    return {
      total: documents.length,
      pending: inProgress.length,
      completed: documents.filter((d) => d.current_status === "Completed")
        .length,
      rejected: documents.filter((d) => d.current_status === "Rejected").length,
      near3,
      over3,
    };
  }, [documents]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDocs.slice(start, start + itemsPerPage);
  }, [filteredDocs, currentPage]);

  // Reset to page 1 when search/filter changes
  const resetPage = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
            ERP Dashboard
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            ภาพรวมรายการเอกสารและสถานะการอนุมัติ
          </p>
        </div>
        {userRole === "User" && (
          <button
            onClick={() => setView("create")}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 hover:bg-blue-700 transition-all shrink-0 active:scale-95"
          >
            <Plus size={18} /> สร้างเอกสารใหม่
          </button>
        )}
      </header>

      {/* สรุปสถิติ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: "all" as CardFilter,
            icon: <FileText />,
            label: "ทั้งหมด",
            val: stats.total,
            color: "text-slate-600",
            bg: "bg-slate-50",
          },
          {
            id: "pending" as CardFilter,
            icon: <Clock />,
            label: "กำลังดำเนินการ",
            val: stats.pending,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            id: "completed" as CardFilter,
            icon: <CheckCircle />,
            label: "สำเร็จแล้ว",
            val: stats.completed,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            id: "rejected" as CardFilter,
            icon: <XCircle />,
            label: "ตีกลับ",
            val: stats.rejected,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            id: "near3" as CardFilter,
            icon: <Clock />,
            label: "ใกล้ครบ 3 วัน",
            val: stats.near3,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            id: "over3" as CardFilter,
            icon: <Clock />,
            label: "เกิน 3 วันแล้ว",
            val: stats.over3,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setActiveCard((prev) =>
                prev === item.id ? "all" : item.id
              );
              resetPage();
            }}
            className={`cursor-pointer p-6 rounded-2xl border flex items-center gap-4 transition-all ${
              activeCard === item.id
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white border-gray-100 shadow-sm hover:shadow-md"
            }`}
          >
            <div
              className={`p-3 rounded-xl ${
                activeCard === item.id ? "bg-white/10" : item.bg
              } ${activeCard === item.id ? "text-white" : item.color}`}
            >
              {item.icon}
            </div>
            <div>
              <p
                className={`text-[10px] font-black uppercase tracking-widest ${
                  activeCard === item.id
                    ? "text-white/80"
                    : "text-slate-400"
                }`}
              >
                {item.label}
              </p>
              <p className="text-2xl font-black">{item.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ค้นหาและตัวกรอง */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"
          />
          <input
            type="text"
            placeholder="ค้นหาเลขที่เอกสาร หรือรายละเอียด..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
              resetPage();
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl outline-none focus:bg-white focus:border-blue-500 font-medium text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-3 shrink-0 px-3 py-2 bg-slate-50 rounded-xl border border-transparent focus-within:bg-white focus-within:border-blue-100 transition-all">
          <Filter size={16} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
            className="bg-transparent border-none outline-none text-sm font-bold text-gray-700 min-w-[150px]"
          >
            <option value="All">ทุกสถานะ</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s]?.label || s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ตารางข้อมูล */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  #
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  เลขที่เอกสาร
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  ประเภท
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  วันที่สร้าง
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">
                  สถานะ
                </th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">
                  จัดการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedDocs.map((doc, index) => {
                const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                const createdAt = parseCreatedAt(doc.created_at);
                let agingLabel: string | null = null;
                let agingClass = "";
                if (
                  createdAt &&
                  !["Completed", "Rejected", "Paid"].includes(
                    doc.current_status
                  )
                ) {
                  const diff = dayjs().diff(createdAt, "day");
                  if (diff === 2) {
                    agingLabel = "ใกล้ครบ 3 วัน";
                    agingClass = "text-amber-500";
                  } else if (diff >= 3) {
                    agingLabel = "เกิน 3 วันแล้ว";
                    agingClass = "text-red-500";
                  }
                }
                return (
                  <tr
                    key={doc.document_id}
                    className="hover:bg-blue-50/30 group transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                      {rowNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 text-sm">
                      {doc.document_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm font-medium">
                      {doc.document_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 italic font-medium">
                      {doc.created_at}
                      {agingLabel && (
                        <div
                          className={`mt-1 text-[10px] font-black ${agingClass}`}
                        >
                          {agingLabel}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={doc.current_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDocId(doc.document_id);
                            setView("detail");
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 rounded-lg font-bold text-xs transition-all"
                        >
                          ดูข้อมูล <ArrowUpRight size={14} />
                        </button>
                        {userRole === "Admin" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm("ยืนยันการลบเอกสารนี้?")) {
                                await deleteDoc(fsDoc(db, "documents", doc.document_id));
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 rounded-lg font-bold text-xs transition-all"
                          >
                            ลบ
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">
              แสดง {paginatedDocs.length} จาก {filteredDocs.length} รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white border border-gray-200 text-gray-400 hover:border-blue-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
