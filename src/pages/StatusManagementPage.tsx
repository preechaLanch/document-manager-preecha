import React, { useState, useEffect, useRef } from "react";
import { Edit2, Save, X, Check } from "lucide-react";
import { db } from "../firebase";
import { collection, getDocs, updateDoc, doc, query, orderBy } from "firebase/firestore";

const COLLECTION = "stages";

const StatusManagement: React.FC = () => {
  const [stages, setStages] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const pendingCompleteRef = useRef(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  // Load stages from Firestore (sorted by 'order')
  useEffect(() => {
    (async () => {
      setIsBusy(true);
      try {
        const q = query(collection(db, COLLECTION), orderBy("order", "asc"));
        const snap = await getDocs(q);
        setStages(snap.docs.map((d) => d.data().name));

        if (pendingCompleteRef.current) {
          pendingCompleteRef.current = false;
          setShowComplete(true);
          window.setTimeout(() => setShowComplete(false), 900);
        }
      } finally {
        setIsBusy(false);
      }
    })();
  }, [reloadKey]);

  const startEdit = (index: number, value: string) => {
    setEditIndex(index);
    setEditValue(value);
  };

  const saveEdit = async () => {
    if (editValue.trim() === "" || editIndex === null) return;
    setIsBusy(true);
    try {
      // Find the Firestore doc for this stage
      const snap = await getDocs(collection(db, COLLECTION));
      const found = snap.docs.find((d) => d.data().name === stages[editIndex]);
      if (found) {
        await updateDoc(doc(db, COLLECTION, found.id), { name: editValue });
        setEditIndex(null);
        setEditValue("");
        pendingCompleteRef.current = true;
        setReloadKey((k) => k + 1);
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
          Manage Workflow
        </h1>
        <p className="text-gray-500 text-sm font-medium italic">
          จัดการ แก้ไข เพื่อแก้ไขชื่อลำดับขั้นตอนของเอกสาร
        </p>
      </header>
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="space-y-2">
          {stages.map((stage, index) => {
            const isEditing = editIndex === index;

            return (
              <div
                key={stage}
                className={`flex items-center justify-between p-4 border-2 rounded-2xl transition-all bg-gray-50 border-gray-100 hover:border-blue-300 hover:bg-white`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-lg text-[10px] font-black text-gray-500 shrink-0">
                    {index + 1}
                  </span>

                  {isEditing ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                      className="flex-1 p-1 px-3 border border-blue-500 rounded-lg outline-none font-bold bg-white"
                    />
                  ) : (
                    <span
                      className={`font-bold text-gray-700`}
                    >
                      {stage}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={isBusy}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm transition-all"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditIndex(null)}
                        className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 shadow-sm transition-all"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(index, stage)}
                        className="text-gray-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        <Edit2 size={16} />
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

export default StatusManagement;
