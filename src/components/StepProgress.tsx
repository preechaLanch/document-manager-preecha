import React from "react";
import { CheckCircle2 } from "lucide-react";
import { STATUS_CONFIG } from "../constants/config";

interface StepProgressProps {
  currentStatus: string;
  stages: string[];
}

const StepProgress: React.FC<StepProgressProps> = ({
  currentStatus,
  stages,
}) => {
  const mainStages = [
    { key: "Draft" },
    { key: "Review" },
    { key: "Approval" },
    { key: "Accounting" },
    { key: "Payment" },
    { key: "Completed" },
  ];
  // Normalize currentStatus to a value that actually exists in stages.
  // If not found (e.g. "1"), fallback to the first stage so the bar still shows progress.
  const normalizedStatus =
    stages.includes(currentStatus) && currentStatus
      ? currentStatus
      : stages[0] || "";
  const currentIdx = normalizedStatus
    ? stages.indexOf(normalizedStatus)
    : -1;

  return (
    <div className="w-full py-8 overflow-x-auto">
      <div className="flex items-center min-w-[700px] px-4">
        {mainStages.map((stage, index) => {
          const stageIdxInFull = stages.indexOf(stage.key);
          const isActive =
            currentIdx >= stageIdxInFull && stageIdxInFull !== -1;
          const label = STATUS_CONFIG[stage.key]?.label || stage.key;

          return (
            <React.Fragment key={stage.key}>
              <div className="flex flex-col items-center relative flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all duration-500
                  ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {isActive ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-6 text-[10px] font-bold whitespace-nowrap transition-colors duration-500
                  ${isActive ? "text-blue-600" : "text-gray-400"}`}
                >
                  {label}
                </span>
              </div>
              {index < mainStages.length - 1 && (
                <div className="flex-1 h-0.5 mx-[-15px] z-0 bg-gray-200 relative">
                  <div
                    className="absolute inset-0 bg-blue-600 transition-all duration-700 ease-in-out"
                    style={{
                      width:
                        currentIdx >= stages.indexOf(mainStages[index + 1].key)
                          ? "100%"
                          : isActive
                          ? "50%"
                          : "0%",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
