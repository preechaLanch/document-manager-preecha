import React from "react";
import {
  LayoutDashboard,
  FilePlus,
//   Settings,
  Users,
} from "lucide-react";
import type { Role } from "../types";

interface SidebarProps {
  view: string;
  setView: (v: string) => void;
  userRole: Role;
  setUserRole: (r: Role) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  view,
  setView,
  userRole,
  setUserRole,
  isSidebarOpen,
  setSidebarOpen,
}) => {
  const handleNavClick = (newView: string) => {
    setView(newView);
    setSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-72 bg-slate-900 text-white z-50 transition-transform duration-500 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } flex flex-col h-full shrink-0 shadow-2xl`}
      >
        {/* Logo */}
        <div className="p-8 border-b border-slate-800 flex items-center gap-4 shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
            M
          </div>
          <div>
            <span className="font-black text-xl tracking-tighter uppercase">
              Mini ERP
            </span>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Finance Management
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
          <button
            onClick={() => handleNavClick("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
              view === "dashboard"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>

          {userRole === "User" && (
            <button
              onClick={() => handleNavClick("create")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                view === "create"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800"
              }`}
            >
              <FilePlus size={20} /> สร้างเอกสารใหม่
            </button>
          )}

          {userRole === "Admin" && (
            <div className="pt-6 space-y-2">
              <div className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                Admin Config
              </div>
              {/* <button
                onClick={() => handleNavClick("status_mgmt")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  view === "status_mgmt"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Settings size={20} /> จัดการสถานะ
              </button> */}
              <button
                onClick={() => handleNavClick("type_mgmt")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  view === "type_mgmt"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Users size={20} /> จัดการประเภท
              </button>
              <button
                onClick={() => handleNavClick("user_mgmt")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                  view === "user_mgmt"
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                <Users size={20} /> รายชื่อพนักงาน
              </button>
            </div>
          )}
        </nav>

        {/* Role Selector */}
        <div className="shrink-0 p-6 border-t border-slate-800 bg-slate-900 mt-auto shadow-2xl">
          <p className="text-[10px] text-slate-500 uppercase font-black mb-3 text-center italic tracking-widest">
            Role Simulator
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["User", "Accountant", "Manager", "Admin"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setUserRole(r);
                }}
                className={`text-[10px] py-2 rounded-lg font-black border transition-all ${
                  userRole === r
                    ? "bg-blue-600 border-blue-500 text-white shadow-md"
                    : "border-slate-700 text-slate-500 hover:border-slate-500"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
