import React, { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";

// Map trạng thái 
const getStatusInfo = (status) => {
  const statusMap = {
    "Đang Chờ": {
      label: "Đang chờ xử lý",
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    "Đang Xử Lý": {
      label: "Đã tiếp nhận",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    "Đã Giải Quyết": {
      label: "Đã giải quyết",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  };
  return statusMap[status] || { label: status, icon: AlertCircle, color: "text-gray-600", bgColor: "bg-gray-50" };
};

// Lấy danh sách trạng thái 
const getAvailableStatuses = (currentStatus) => {
  const transitions = {
    "Đang Chờ": ["Đang Xử Lý", "Đã Giải Quyết"],
    "Đang Xử Lý": ["Đã Giải Quyết"],
    "Đã Giải Quyết": [],
  };
  return transitions[currentStatus] || [];
};

const Update_Status = ({ isOpen, reportId, reportCode, currentStatus, onClose, onUpdate, loading }) => {
  const [selectedStatus, setSelectedStatus] = useState(null);

  const availableStatuses = getAvailableStatuses(currentStatus);
  const canUpdate = availableStatuses.length > 0;
  const currentStatusInfo = getStatusInfo(currentStatus);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(null);
    }
  }, [isOpen, currentStatus]);

  const handleUpdate = () => {
    if (selectedStatus && selectedStatus !== currentStatus && availableStatuses.includes(selectedStatus)) {
      onUpdate(reportId, selectedStatus);
    }
  };

  if (!canUpdate) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[90vw] xs:w-[85vw] sm:w-[calc(100vw-3rem)] max-w-lg z-[1000] bg-white shadow-2xl rounded-lg xs:rounded-xl sm:rounded-[20px] p-0">
          <DialogHeader className="text-center space-y-2 xs:space-y-2.5 px-3 xs:px-4 sm:px-6 pt-4 xs:pt-5 sm:pt-6">
            <div className="mx-auto w-9 xs:w-10 sm:w-12 h-9 xs:h-10 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4.5 xs:w-5 sm:w-6 h-4.5 xs:h-5 sm:h-6 text-green-600" />
            </div>
            <DialogTitle className="text-sm xs:text-base sm:text-lg font-bold">Báo cáo đã hoàn tất</DialogTitle>
            <DialogDescription className="text-xs xs:text-sm sm:text-base">Trạng thái này không thể thay đổi</DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3 xs:pt-3.5 sm:pt-4 px-3 xs:px-4 sm:px-6 pb-4 xs:pb-4.5 sm:pb-6">
            <DialogClose asChild>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg xs:rounded-[10px] text-sm xs:text-base">Đóng</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[90vw] xs:w-[85vw] sm:w-[calc(100vw-3rem)] max-w-lg z-[1000] bg-white shadow-2xl rounded-lg xs:rounded-xl sm:rounded-[20px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="space-y-2 xs:space-y-2.5 sm:space-y-3 pb-3 xs:pb-3.5 sm:pb-4 px-3 xs:px-4 sm:px-6 pt-3 xs:pt-4 sm:pt-6">
          <DialogTitle className="text-base xs:text-lg sm:text-2xl font-bold text-center">Cập nhật trạng thái</DialogTitle>
          <div className="bg-blue-100 border-2 border-blue-300 rounded-xl xs:rounded-[14px] sm:rounded-[16px] p-2.5 xs:p-3 sm:p-4 text-center">
            <p className="text-xs font-bold text-blue-900 uppercase mb-1 xs:mb-1.5 sm:mb-2 tracking-wide">Mã báo cáo</p>
            <p className="text-lg xs:text-xl sm:text-2xl font-black text-blue-700 break-all line-clamp-2">{reportCode || reportId}</p>
          </div>
        </DialogHeader>

        <div className="space-y-2.5 xs:space-y-3 sm:space-y-4 py-3 xs:py-3.5 sm:py-4 px-3 xs:px-4 sm:px-6">
          {/* Current Status */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5 xs:mb-2 block">Trạng thái hiện tại</p>
            <div className={`${currentStatusInfo.bgColor} p-2.5 xs:p-3 sm:p-4 rounded-lg xs:rounded-[12px] flex items-center gap-2 xs:gap-2.5 sm:gap-3`}>
              {React.createElement(currentStatusInfo.icon, {
                className: `w-3.5 xs:w-4 sm:w-5 h-3.5 xs:h-4 sm:h-5 ${currentStatusInfo.color} flex-shrink-0`,
              })}
              <p className={`font-semibold text-xs xs:text-sm sm:text-base ${currentStatusInfo.color}`}>{currentStatusInfo.label}</p>
            </div>
          </div>

          {/* các trạng thái tùy chọn */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2 xs:mb-2.5 sm:mb-3 block">Chuyển sang</p>
            <div className="space-y-1.5 xs:space-y-2 sm:space-y-2">
              {availableStatuses.map((status) => {
                const statusInfo = getStatusInfo(status);
                return (
                  <div
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`flex items-center gap-1.5 xs:gap-2 sm:gap-3 p-2 xs:p-2.5 sm:p-3 border-2 rounded-lg xs:rounded-[12px] cursor-pointer transition-all ${
                      selectedStatus === status
                        ? "border-blue-600 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div
                      className={`w-3.5 xs:w-4 sm:w-5 h-3.5 xs:h-4 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                        selectedStatus === status
                          ? "border-blue-600 bg-blue-600"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selectedStatus === status && (
                        <svg className="w-2 xs:w-2.5 sm:w-3 h-2 xs:h-2.5 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 flex items-center gap-1.5 xs:gap-2">
                      {React.createElement(statusInfo.icon, {
                        className: `w-3 xs:w-3.5 sm:w-4 h-3 xs:h-3.5 sm:h-4 ${statusInfo.color}`,
                      })}
                      <span className={`font-medium text-xs xs:text-sm ${
                        selectedStatus === status ? "text-blue-700" : "text-gray-700"
                      }`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col xs:flex-row gap-2 xs:gap-2.5 pt-3 xs:pt-3.5 sm:pt-4 px-3 xs:px-4 sm:px-6 pb-4 xs:pb-4.5 sm:pb-6">
          <Button
            onClick={handleUpdate}
            disabled={!selectedStatus || selectedStatus === currentStatus || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg xs:rounded-[10px] font-semibold text-xs xs:text-sm sm:text-base disabled:bg-gray-300 disabled:cursor-not-allowed order-2 xs:order-1 flex-1"
          >
            {loading ? "Đang cập nhật..." : "Cập nhật"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="rounded-lg xs:rounded-[10px] font-semibold text-xs xs:text-sm sm:text-base order-1 xs:order-2 flex-1 xs:flex-none">Hủy</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Update_Status;
