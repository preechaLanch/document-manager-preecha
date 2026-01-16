import { useState, useMemo, useEffect } from "react";
import type { IDocument, IHistory, Role } from "./types";
import {
  STATUS_CONFIG,
  INITIAL_USERS,
  INITIAL_HISTORY,
} from "./constants/config";
import { db } from "./firebase";
import { collection, onSnapshot, QuerySnapshot } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import Sidebar from "./layouts/Sidebar";
import Header from "./layouts/Header";
import Dashboard from "./components/Dashboard";
import StatusManagementPage from "./pages/StatusManagementPage";
import TypeManagementPage from "./pages/TypeManagementPage";
import CreatePage from "./pages/CreatePage";
import DetailPage from "./pages/DetailPage";
import UserManagementPage from "./pages/UserManagementPage";

export default function App() {
  // State Management
  const [view, setView] = useState("dashboard");
  const [userRole, setUserRole] = useState<Role>("User");
  const [documents, setDocuments] = useState<IDocument[]>([]);
    // Firestore sync for documents
    useEffect(() => {
      const unsub = onSnapshot(collection(db, "documents"), (snap: QuerySnapshot<DocumentData>) => {
        setDocuments(
          snap.docs.map((doc) => {
            const data = doc.data();
            return {
              document_id: doc.id,
              document_no: data.document_no || "",
              document_type: data.document_type || "",
              description: data.description || "",
              current_status: data.current_status || "",
              created_by: data.created_by || "",
              created_at: data.created_at || "",
              owner: data.owner || "",
            };
          })
        );
      });
      return () => unsub();
    }, []);
  const [history, setHistory] = useState<IHistory[]>(INITIAL_HISTORY);
  // const [stages, setStages] = useState<string[]>(INITIAL_STAGES);
  // const [docTypes, setDocTypes] = useState<string[]>(INITIAL_TYPES);
  const [users] = useState(INITIAL_USERS);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const handleSetUserRole = (nextRole: Role) => {
    const adminViews = ["status_mgmt", "type_mgmt", "user_mgmt"];
    setUserRole(nextRole);
    if (adminViews.includes(view) && nextRole !== "Admin") {
      setView("dashboard");
    }
  };

  // Workflow Handler
  const handleUpdateStatus = (
    id: string,
    newStatus: string,
    comment: string
  ) => {
    const timestamp = new Date()
      .toLocaleString("th-TH")
      .substring(0, 16)
      .replace(",", "");
    const currentDoc = documents.find((d) => d.document_id === id);
    if (!currentDoc) return;

    setDocuments((docs) =>
      docs.map((d) => {
        if (d.document_id === id) {
          let nextOwner = "System";
          if (["Draft", "Rejected"].includes(newStatus)) nextOwner = "User";
          else if (
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
            nextOwner = "Accountant Dept";
          else if (["Approval", "Approved"].includes(newStatus))
            nextOwner = "Management";
          else if (newStatus === "Completed") nextOwner = "Archive";
          return { ...d, current_status: newStatus, owner: nextOwner };
        }
        return d;
      })
    );

    setHistory([
      {
        id: Math.random().toString(36).substr(2, 9),
        document_id: id,
        from_status: currentDoc.current_status,
        to_status: newStatus,
        action: `เปลี่ยนสถานะเป็น ${
          STATUS_CONFIG[newStatus]?.label || newStatus
        }`,
        action_by: `${userRole} User`,
        action_at: timestamp,
        comment: comment,
      },
      ...history,
    ]);
  };

  const selectedDoc = documents.find((d) => d.document_id === selectedDocId);

  const canUserAction = useMemo(() => {
    if (!selectedDoc) return false;
    const s = selectedDoc.current_status;
    if (userRole === "User" && ["Draft", "Rejected"].includes(s)) return true;
    if (
      userRole === "Accountant" &&
      [
        "Submitted",
        "Review",
        "Verified",
        "Approved",
        "Accounting",
        "Posted",
        "Payment",
        "Paid",
        "Failed",
      ].includes(s)
    )
      return true;
    if (userRole === "Manager" && s === "Approval") return true;
    return false;
  }, [selectedDoc, userRole]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans text-sm md:text-base">
      {/* Sidebar */}
      <Sidebar
        view={view}
        setView={setView}
        userRole={userRole}
        setUserRole={handleSetUserRole}
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <Header
          userRole={userRole}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth custom-scrollbar">
          <div className="max-w-6xl mx-auto pb-20">
            {view === "dashboard" && (
              <Dashboard
                documents={documents}
                setView={setView}
                setSelectedDocId={setSelectedDocId}
                userRole={userRole}
              />
            )}
            {view === "status_mgmt" && <StatusManagementPage />}
            {view === "type_mgmt" && <TypeManagementPage />}
            {view === "user_mgmt" && <UserManagementPage users={users} />}
            {view === "create" && userRole === "User" && (
              <CreatePage setView={setView} />
            )}
            {view === "detail" && selectedDoc && (
              <DetailPage
                selectedDoc={selectedDoc}
                history={history}
                canUserAction={canUserAction}
                userRole={userRole}
                handleUpdateStatus={handleUpdateStatus}
                setView={setView}
              />
            )}
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; background: transparent; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
