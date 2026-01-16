import React, { useState, useEffect, useCallback } from "react";
import type { ChangeEvent } from "react";
import { Plus, Files, Edit2, Trash2, Save, X, Check } from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";


const COLLECTION = "docTypes";

const TypeManagement: React.FC = () => {
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newType, setNewType] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const loadTypes = useCallback(async () => {
    const snap = await getDocs(collection(db, COLLECTION));

    const names = snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        const name = (data.name ?? data.type ?? "").toString().trim();
        return name;
      })
      .filter(Boolean);

    setDocTypes(names);
  }, []);

  const refreshTypes = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      await loadTypes();
    } catch (e) {
      setError(e instanceof Error ? e.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setIsBusy(false);
    }
  }, [loadTypes]);

  const completeFlash = () => {
    setShowComplete(true);
    window.setTimeout(() => setShowComplete(false), 900);
  };

  useEffect(() => {
    (async () => {
      await refreshTypes();
    })();
  }, [refreshTypes]);

  const addType = async () => {
    const name = newType.trim();
    if (name) {
      // ป้องกันไม่ให้เพิ่มชื่อซ้ำ (ไม่สนตัวพิมพ์เล็กใหญ่)
      if (docTypes.some((t) => t.toLowerCase() === name.toLowerCase())) {
        setError("มีชื่อประเภทนี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
        return;
      }
      setIsBusy(true);
      setError(null);
      try {
        await addDoc(collection(db, COLLECTION), { name });
        setNewType("");
        await loadTypes();
        completeFlash();
      } catch (e) {
        setError(e instanceof Error ? e.message : "เพิ่มข้อมูลไม่สำเร็จ");
      } finally {
        setIsBusy(false);
      }
    }
  };

  const removeType = async (name: string) => {
    setIsBusy(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      const found = snap.docs.find((d) => {
        const data = d.data() as Record<string, unknown>;
        const n = (data.name ?? data.type ?? "").toString();
        return n === name;
      });
      if (found) {
        await deleteDoc(doc(db, COLLECTION, found.id));
        await loadTypes();
        completeFlash();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ลบข้อมูลไม่สำเร็จ");
    } finally {
      setIsBusy(false);
    }
  };

  const startEdit = (index: number, value: string) => {
    setEditIndex(index);
    setEditValue(value);
  };

  const saveEdit = async () => {
    const name = editValue.trim();
    if (name === "" || editIndex === null) return;
    // ป้องกันไม่ให้แก้ไขชื่อเป็นชื่อที่ซ้ำกับรายการอื่น
    if (
      docTypes.some(
        (t, i) => i !== editIndex && t.toLowerCase() === name.toLowerCase()
      )
    ) {
      setError("มีชื่อประเภทนี้อยู่แล้ว กรุณาใช้ชื่ออื่น");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      const currentName = docTypes[editIndex];
      const found = snap.docs.find((d) => {
        const data = d.data() as Record<string, unknown>;
        const n = (data.name ?? data.type ?? "").toString();
        return n === currentName;
      });
      if (found) {
        await updateDoc(doc(db, COLLECTION, found.id), { name });
        setEditIndex(null);
        setEditValue("");
        await loadTypes();
        completeFlash();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-sm">
      {(isBusy || showComplete) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl px-10 py-8 text-center min-w-65">
            {isBusy ? (
              <div className="mx-auto h-16 w-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin" />
            ) : (
              <div className="mx-auto h-16 w-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                <Check className="text-green-600" size={34} />
              </div>
            )}
            {!isBusy && (
              <div className="mt-4 text-sm font-black text-slate-800 uppercase tracking-widest">
                Complete
              </div>
            )}
          </div>
        </div>
      )}
      <header>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
          Manage Types
        </h1>
        <p className="text-gray-500 font-medium italic text-xs">
          กำหนดและแก้ไขประเภทเอกสารที่มีในระบบ
        </p>
      </header>
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-bold">
            {error}
          </div>
        )}
        <div className="flex gap-2 mb-6">
          <input
            value={newType}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewType(e.target.value)
            }
            placeholder="เช่น Reimbursement..."
            className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
          />
          <button
            onClick={addType}
            disabled={isBusy}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95 shrink-0"
          >
            <Plus size={18} /> เพิ่ม
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {docTypes.map((type, index) => {
            const isEditing = editIndex === index;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl group transition-all hover:border-blue-300"
              >
                <div className="flex items-center gap-3 font-bold text-gray-700 flex-1">
                  <Files size={18} className="text-blue-500 shrink-0" />
                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="flex-1 p-1 px-2 border border-blue-500 rounded-lg outline-none bg-white font-bold"
                    />
                  ) : (
                    <span>{type}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEdit()}
                        disabled={isBusy}
                        className="text-green-600 hover:bg-green-100 p-1.5 rounded-lg transition-all"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditIndex(null)}
                        className="text-gray-500 hover:bg-gray-200 p-1.5 rounded-lg transition-all"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(index, type)}
                        className="text-gray-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => removeType(type)}
                        disabled={isBusy}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TypeManagement;
