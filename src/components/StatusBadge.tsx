import React from "react";
import { STATUS_CONFIG } from "../constants/config";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || {
    label: status,
    color: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-medium border ${config.color}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
