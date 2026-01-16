import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { db } from "../firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

interface CreatePageProps {
  setView: (v: string) => void;
}

const COLLECTION = "docTypes";

const CreatePage: React.FC<CreatePageProps> = ({ setView }) => {
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      const snap = await getDocs(collection(db, COLLECTION));
      setDocTypes(snap.docs.map((d) => d.data().name));
    };
    fetchTypes();
  }, []);
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500 relative">
      {/* Overlay for loading and complete */}
      {(loading || complete) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 rounded-3xl">
          {loading && (
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <div className="text-blue-600 font-bold text-lg">กำลังบันทึก...</div>
            </div>
          )}
          {complete && (
            <div className="flex flex-col items-center gap-4">
              <svg className="h-16 w-16 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M7 13l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-green-600 font-bold text-lg">บันทึกสำเร็จ</div>
            </div>
          )}
        </div>
      )}
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          สร้างเอกสารใหม่
        </h1>
        <p className="text-gray-500 font-medium">
          ระบุเลขที่และรายละเอียดเพื่อเริ่ม Workflow การตรวจสอบ
        </p>
      </header>
      <form
        onSubmit={async (e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setLoading(true);
          setComplete(false);
          try {
            const formData = new FormData(e.currentTarget);
            const docNo = formData.get("docNo") as string;

            // ตรวจหาว่ามีเลขที่เอกสารนี้อยู่แล้วหรือไม่
            const dupQuery = query(
              collection(db, "documents"),
              where("document_no", "==", docNo)
            );
            const dupSnap = await getDocs(dupQuery);
            if (!dupSnap.empty) {
              setLoading(false);
              alert("เลขที่เอกสารนี้ถูกใช้ไปแล้ว กรุณาใช้เลขที่ใหม่");
              return;
            }

            const now = new Date();
            const createdAt = now
              .toLocaleString("th-TH", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
              .replace(/\u200e/g, "")
              .replace(/\//g, "-")
              .replace(",", "");
            const docData = {
              document_no: docNo,
              document_type: formData.get("type") as string,
              description: formData.get("desc") as string,
              current_status: "Draft",
              created_by: "John Doe",
              created_at: createdAt,
              owner: "user",
            };
            await addDoc(collection(db, "documents"), docData);
            setLoading(false);
            setComplete(true);
            setTimeout(() => {
              setComplete(false);
              setView("dashboard");
            }, 1200);
          } catch {
            setLoading(false);
            alert("เกิดข้อผิดพลาดในการบันทึกเอกสาร กรุณาลองใหม่");
          }
        }}
        className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              เลขที่เอกสาร
            </label>
            <input
              name="docNo"
              required
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
              placeholder="เช่น INV-2024-001"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              ประเภท
            </label>
            <select
              name="type"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold transition-all"
            >
              {docTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            รายละเอียดเหตุผล
          </label>
          <textarea
            name="desc"
            required
            rows={4}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 font-bold resize-none transition-all"
            placeholder="ระบุวัตถุประสงค์ในการเบิกจ่าย..."
          />
        </div>
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            เริ่มร่างเอกสาร (Draft)
          </button>
          <button
            type="button"
            onClick={() => setView("dashboard")}
            className="px-8 text-slate-400 font-bold hover:text-slate-900 transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePage;
