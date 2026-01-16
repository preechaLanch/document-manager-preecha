import React from "react";
import {
  ArrowLeft,
  MessageSquare,
  HistoryIcon,
  CheckCircle2,
  ShieldCheck,
  UserCircle,
  Calendar,
} from "lucide-react";
import type { IDocument, IHistory, Role } from "../types";
import StatusBadge from "../components/StatusBadge";
import StepProgress from "../components/StepProgress";
import { INITIAL_STAGES, STATUS_CONFIG } from "../constants/config";
import { db } from "../firebase";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

interface DetailPageProps {
  selectedDoc: IDocument;
  history: IHistory[];
  canUserAction: boolean;
  userRole: Role;
  handleUpdateStatus: (id: string, status: string, comment: string) => void;
  setView: (v: string) => void;
}

const DetailPage: React.FC<DetailPageProps> = ({
  selectedDoc,
  history,
  canUserAction,
  userRole,
  handleUpdateStatus,
  setView,
}) => {
  const stages = INITIAL_STAGES;

  const getNextOwner = (newStatus: string): string => {
    if (["Draft", "Rejected"].includes(newStatus)) return "User";
    if (
      [
        "Submitted",
        "Review",
        "Verified",
        "Accounting",
        "Posted",
        "Payment",
        "Paid",
        "Failed",
      ].includes(newStatus)
    )
      return "Accountant Dept";
    if (["Approval", "Approved"].includes(newStatus)) return "Management";
    if (newStatus === "Completed") return "Archive";
    return "System";
  };

  const getComment = () => {
    return (document.getElementById("actComment") as HTMLTextAreaElement)
      ?.value || "";
  };

  const handleAction = async (nextStatus: string) => {
    const comment = getComment();
    const timestamp = new Date()
      .toLocaleString("th-TH")
      .substring(0, 16)
      .replace(",", "");
    const nextOwner = getNextOwner(nextStatus);

    // 1) Update document status & owner in Firestore
    await updateDoc(doc(db, "documents", selectedDoc.document_id), {
      current_status: nextStatus,
      owner: nextOwner,
    });

    // 2) Append history record in Firestore
    await addDoc(collection(db, "history"), {
      document_id: selectedDoc.document_id,
      from_status: selectedDoc.current_status,
      to_status: nextStatus,
      action: `เปลี่ยนสถานะเป็น ${
        STATUS_CONFIG[nextStatus]?.label || nextStatus
      }`,
      action_by: `${userRole} User`,
      action_at: timestamp,
      comment,
    });

    // Keep existing local state update for in-memory history & documents
    handleUpdateStatus(selectedDoc.document_id, nextStatus, comment);
  };

  const actions = [
    {
      condition:
        userRole === "User" &&
        (selectedDoc.current_status === "Draft" ||
          selectedDoc.current_status === "Rejected"),
      label: "ส่งตรวจสอบ (Submit)",
      status: "Submitted",
      color: "bg-blue-600",
    },
    {
      condition:
        userRole === "Accountant" && selectedDoc.current_status === "Submitted",
      label: "รับเรื่องตรวจสอบ (Review)",
      status: "Review",
      color: "bg-yellow-500",
    },
    {
      condition:
        userRole === "Accountant" && selectedDoc.current_status === "Review",
      label: "ตรวจผ่าน (Verify)",
      status: "Verified",
      color: "bg-cyan-600",
    },
    {
      condition:
        userRole === "Accountant" && selectedDoc.current_status === "Verified",
      label: "ส่งขออนุมัติ (Pending Approval)",
      status: "Approval",
      color: "bg-orange-500",
    },
    {
      condition: userRole === "Manager" && selectedDoc.current_status === "Approval",
      label: "อนุมัติเอกสาร (Approve)",
      status: "Approved",
      color: "bg-emerald-600",
    },
    {
      condition:
        userRole === "Accountant" && selectedDoc.current_status === "Approved",
      label: "รับงานลงบัญชี",
      status: "Accounting",
      color: "bg-indigo-600",
    },
    {
      condition:
        userRole === "Accountant" && selectedDoc.current_status === "Accounting",
      label: "ลงรายการบัญชี (Post)",
      status: "Posted",
      color: "bg-violet-600",
    },
    {
      condition:
        userRole === "Accountant" && selectedDoc.current_status === "Posted",
      label: "เตรียมจ่ายเงิน (Payment)",
      status: "Payment",
      color: "bg-purple-600",
    },
    {
      condition:
        userRole === "Accountant" && selectedDoc.current_status === "Payment",
      label: "ยืนยันจ่ายแล้ว (Paid)",
      status: "Paid",
      color: "bg-green-600",
    },
    {
      condition:
        userRole === "Accountant" &&
        (selectedDoc.current_status === "Paid" ||
          selectedDoc.current_status === "Failed"),
      label: "จัดเก็บเอกสาร",
      status: "Completed",
      color: "bg-slate-800",
    },
    {
      condition:
        ["Accountant", "Manager"].includes(userRole) &&
        ![
          "Draft",
          "Rejected",
          "Completed",
          "Paid",
        ].includes(selectedDoc.current_status),
      label: "ตีกลับ (Reject)",
      status: "Rejected",
      color: "bg-red-100 text-red-600 hover:bg-red-200",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-sm">
      <button
        onClick={() => setView("dashboard")}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-all group"
      >
        <ArrowLeft
          size={18}
          className="group-hover:-translate-x-1 transition-transform"
        />{" "}
        กลับหน้า Dashboard
      </button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Document Header */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {selectedDoc.document_no}
                  </h1>
                  <StatusBadge status={selectedDoc.current_status} />
                </div>
                <p className="text-gray-500 font-medium">
                  {selectedDoc.description}
                </p>
                <div className="mt-4 flex gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span className="flex items-center gap-1 font-black">
                    <UserCircle size={14} /> โดย: {selectedDoc.created_by}
                  </span>
                  <span className="flex items-center gap-1 font-black">
                    <Calendar size={14} /> วันที่: {selectedDoc.created_at}
                  </span>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl text-right shrink-0 border border-blue-100 shadow-sm">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                  ผู้รับผิดชอบปัจจุบัน
                </p>
                <p className="text-blue-600 font-black">{selectedDoc.owner}</p>
              </div>
            </div>
            <StepProgress
              currentStatus={selectedDoc.current_status}
              stages={stages}
            />
          </div>

          {/* Timeline */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3 tracking-tight uppercase">
              <HistoryIcon size={20} className="text-blue-500" /> Workflow Audit
              Trail
            </h2>
            <div className="space-y-0 ml-4">
              {history
                .filter((h) => h.document_id === selectedDoc.document_id)
                .map((h, i) => (
                  <div
                    key={h.id}
                    className="relative pl-10 pb-10 border-l-2 border-slate-100 last:border-none last:pb-0"
                  >
                    <div
                      className={`absolute -left-2.75 top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-all ${
                        i === 0
                          ? "bg-blue-600 ring-4 ring-blue-50"
                          : "bg-slate-300"
                      }`}
                    />
                    <div className="flex justify-between mb-1">
                      <span className="font-black text-slate-800 text-sm tracking-tight">
                        {h.action}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold uppercase">
                        {h.action_at}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-slate-500 tracking-tight">
                        โดย {h.action_by}
                      </span>
                      <StatusBadge status={h.to_status} />
                    </div>
                    {h.comment && (
                      <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 italic font-medium border border-slate-100 shadow-sm">
                        "{h.comment}"
                      </div>
                    )}
                  </div>
                ))}
              {history.filter((h) => h.document_id === selectedDoc.document_id)
                .length === 0 && (
                <p className="text-slate-400 italic text-xs ml-4">
                  ยังไม่มีประวัติการดำเนินการ
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 sticky top-8">
            <h3 className="font-black text-slate-900 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-500" /> Action
              Controls
            </h3>
            {selectedDoc.current_status !== "Completed" && canUserAction ? (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquare size={12} /> หมายเหตุ (Comment)
                </label>
                <textarea
                  id="actComment"
                  placeholder="ระบุเหตุผลหรือข้อความเพิ่มเติม..."
                  className="w-full h-24 p-3 text-xs border border-gray-100 rounded-2xl outline-none bg-slate-50 focus:ring-4 focus:ring-blue-500/10 font-medium resize-none transition-all"
                />
                <div className="space-y-3 pt-4 border-t border-slate-50">
                  {actions
                    .filter((a) => a.condition)
                    .map((a, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          void handleAction(a.status);
                        }}
                        className={`w-full ${a.color} text-white py-3.5 rounded-xl font-black active:scale-95 transition-all text-xs`}
                      >
                        {a.label}
                      </button>
                    ))}
                  <p className="text-[10px] text-slate-400 text-center font-black uppercase italic mt-4 pt-3 border-t border-slate-50">
                    Role: {userRole}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-50 rounded-2xl text-center border border-dashed border-slate-200 shadow-inner">
                {selectedDoc.current_status === "Completed" ? (
                  <>
                    <CheckCircle2
                      size={40}
                      className="text-green-500 mx-auto mb-3"
                    />
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600">
                      เอกสารเสร็จสมบูรณ์
                    </p>
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      size={40}
                      className="text-slate-300 mx-auto mb-3"
                    />
                    <p className="text-[10px] text-slate-400 font-black uppercase leading-relaxed whitespace-pre-line">
                      {userRole === "Admin"
                        ? "Admin Mode\n(ViewOnly)"
                        : `รอการดำเนินการจากฝ่ายอื่น\n(ปัจจุบัน: ${selectedDoc.owner})`}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
