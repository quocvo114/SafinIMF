import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof onClose === "function") {
        onClose();
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const titles = {
    success: "Thành Công",
    error: "Lỗi Xảy Ra",
    info: "Thông Báo",
  };

  const bgStyles = {
    success: "border-emerald-100 border-l-emerald-500",
    error: "border-red-100 border-l-red-500",
    info: "border-blue-100 border-l-blue-500",
  };

  const iconBgStyles = {
    success: "bg-emerald-50",
    error: "bg-red-50",
    info: "bg-blue-50",
  };

  return (
    <div
      className={`fixed top-6 right-6 z-[99999] w-[320px] bg-white border border-l-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-start p-4 animate-in slide-in-from-right-8 fade-in duration-300 ${bgStyles[type]}`}
    >
      <div className={`flex-shrink-0 rounded-full p-2 mr-3 mt-0.5 ${iconBgStyles[type]}`}>
        {icons[type]}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <h3 className="text-sm font-bold text-gray-900 mb-0.5">{titles[type]}</h3>
        <p className="text-sm text-gray-600 leading-snug break-words">{message}</p>
      </div>
      <button
        onClick={() => {
          if (typeof onClose === "function") {
            onClose();
          }
        }}
        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
