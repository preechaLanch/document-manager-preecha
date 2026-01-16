import React from "react";
import type { IUser } from "../types";

interface UserManagementPageProps {
  users: IUser[];
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ users }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
          Users List
        </h1>
        <p className="text-gray-500 text-sm font-medium italic text-xs">
          รายชื่อพนักงานที่มีสิทธิ์ใช้งานระบบ
        </p>
      </header>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase">
                ชื่อ - นามสกุล
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase">
                อีเมล
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase">
                บทบาท
              </th>
              <th className="px-6 py-4 text-[10px] font-black uppercase">
                แผนก
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-gray-50 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                  {u.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {u.email}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      u.role === "Admin"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {u.department}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;
