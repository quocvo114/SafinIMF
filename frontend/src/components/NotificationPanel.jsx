import React from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BellRing,
  CheckCheck,
  Clock3,
  FileText,
  ShieldAlert,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const getNotificationIcon = (type) => {
  if (type === "warning") return AlertTriangle;
  if (type === "report") return FileText;
  return ShieldAlert;
};

const getLevelBadgeClass = (level) => {
  if (level === "critical") {
    return "bg-red-100 text-red-700";
  }
  if (level === "low") {
    return "bg-emerald-100 text-emerald-700";
  }
  return "bg-slate-100 text-slate-700";
};

const getLevelLabel = (level) => {
  if (level === "critical") return "Khẩn cấp";
  if (level === "low") return "Thông tin";
  return "Bình thường";
};

const NotificationPanel = ({
  open,
  notifications,
  loading,
  unreadCount,
  onClose,
  onMarkAllRead,
  onMarkRead,
}) => {
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  if (!open || !portalTarget) {
    return null;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[3990] bg-black/20" onClick={onClose} />

      <div
        className="fixed left-2 right-2 top-16 z-[4000] w-auto overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl md:left-24 md:right-auto md:top-20 md:w-[420px] md:max-w-[calc(100vw-7.5rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <BellRing className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">Thông báo</p>
                <p className="text-xs text-gray-500">Mã giao diện b1IfkE0pY</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-gray-900">{unreadCount}</span>{" "}
              chưa đọc
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-full border-gray-200 px-3 text-xs"
              onClick={onMarkAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Đánh dấu tất cả
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[min(60vh,430px)] md:h-[430px]">
          <div className="space-y-3 p-3">
            {loading && notifications.length === 0 && (
              <Card size="sm" className="border bg-white py-0">
                <CardContent className="px-3 py-4 text-xs text-gray-500">
                  Đang tải thông báo...
                </CardContent>
              </Card>
            )}

            {!loading && notifications.length === 0 && (
              <Card size="sm" className="border bg-white py-0">
                <CardContent className="px-3 py-4 text-xs text-gray-500">
                  Chưa có thông báo nào từ dữ liệu báo cáo.
                </CardContent>
              </Card>
            )}

            {notifications.map((item) => {
              const NoticeIcon = getNotificationIcon(item.type);

              return (
                <Card
                  size="sm"
                  key={item.id}
                  className={`border bg-white py-0 ring-0 transition-all duration-200 hover:-translate-y-px hover:shadow-md ${
                    item.isRead
                      ? "border-gray-200 shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
                      : "border-blue-300 shadow-[0_8px_20px_rgba(59,130,246,0.14)]"
                  }`}
                >
                  <CardContent className="px-3 py-3">
                    <div className="mb-2 flex items-start gap-2">
                      <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          item.isRead
                            ? "bg-gray-100 text-gray-500"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <NoticeIcon className="h-3.5 w-3.5" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {item.title}
                          </p>
                          {!item.isRead && (
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                          )}
                        </div>

                        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-gray-700">
                          {item.message}
                        </p>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`h-auto border-0 px-2 py-0.5 text-[10px] ${getLevelBadgeClass(item.level)}`}
                            >
                              {getLevelLabel(item.level)}
                            </Badge>
                            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-gray-500">
                              <Clock3 className="h-3 w-3" />
                              {item.createdAt}
                            </span>
                          </div>

                          {!item.isRead && (
                            <Button
                              type="button"
                              size="sm"
                              variant="link"
                              className="h-auto self-end px-0 text-[11px] text-slate-700 hover:text-slate-900 sm:self-auto"
                              onClick={() => onMarkRead(item.id)}
                            >
                              Đã đọc
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </>,
    portalTarget,
  );
};

export default NotificationPanel;
