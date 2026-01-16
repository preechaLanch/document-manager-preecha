import React from "react";
import { Menu, ShieldCheck, UserCircle, Calendar } from "lucide-react";
import type { Role } from "../types";

interface HeaderProps {
  userRole: Role;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ userRole, onMenuClick }) => {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden p-2 hover:bg-slate-50 rounded-xl transition-colors"
          onClick={onMenuClick}
        >
          <Menu size={24} />
        </button>
        <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 tracking-tighter uppercase">
          {userRole === "Admin" ? (
            <ShieldCheck size={18} className="text-red-500" />
          ) : (
            <UserCircle size={18} className="text-blue-500" />
          )}
          {userRole} Mode
        </div>
      </div>
      <div className="text-sm font-bold text-slate-400 flex items-center gap-2 tracking-tight">
        <Calendar size={16} /> {new Date().toLocaleDateString("th-TH")}
      </div>
    </header>
  );
};

export default Header;
