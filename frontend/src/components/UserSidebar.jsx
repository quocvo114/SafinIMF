import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Map,
  FolderOpen,
  Bell,
  LogOut,
  User,
  BellRing,
  CheckCheck,
  X,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Clock3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import Info_Management from "../pages/Info_Management";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const MOCK_NOTIFICATIONS = [
  {
    id: "NTF-1001",
    title: "Báo cáo #RPT-2201 đang được xử lý",
    message:
      "Đội bảo trì đã tiếp nhận phản ánh của bạn và đang kiểm tra khu vực.",
    level: "normal",
    type: "report",
    isRead: false,
    createdAt: "10 phút trước",
  },
  {
    id: "NTF-1002",
    title: "Cảnh báo khẩn tại khu vực Quận 1",
    message: "Nhiều điểm hư hại mặt đường được ghi nhận sau mưa lớn.",
    level: "critical",
    type: "warning",
    isRead: false,
    createdAt: "38 phút trước",
  },
  {
    id: "NTF-1003",
    title: "Báo cáo #RPT-2168 đã hoàn tất",
    message: "Yêu cầu của bạn đã được xử lý. Cảm ơn bạn đã cộng tác.",
    level: "low",
    type: "system",
    isRead: true,
    createdAt: "Hôm qua",
  },
  {
    id: "NTF-1004",
    title: "Thông báo bảo trì hệ thống",
    message: "Hệ thống sẽ tối ưu hiệu năng từ 23:00 đến 23:20 tối nay.",
    level: "normal",
    type: "system",
    isRead: true,
    createdAt: "2 ngày trước",
  },
];

const UserSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isAuthenticated = Boolean(user);
  const [toast, setToast] = useState(null);

  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const mainMenuItems = [
    {
      id: "dashboard",
      path: "/dashboard",
      icon: <Map className="h-5 w-5" />,
      title: "Trang chủ",
    },
    {
      id: "myreports",
      path: "/myreport",
      icon: <FolderOpen className="h-5 w-5" />,
      title: "Báo cáo của tôi",
    },
    {
      id: "notifications",
      path: "/notifications",
      icon: <Bell className="h-5 w-5" />,
      title: "Thông báo",
    },
  ];

  const userInfo = isAuthenticated
    ? {
        name: user?.full_name || "Người dùng",
        email: user?.email || "user@example.com",
        avatar: user?.avatar || null,
      }
    : null;

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    setToast({ message: "Đăng xuất thành công!", type: "success" });
    setTimeout(() => {
      logout();
      navigate("/signin");
    }, 1500);
  };

  const handleMainMenuClick = (item) => {
    if (item.id === "notifications") {
      setShowAvatarMenu(false);
      setShowNotificationsPopup((prev) => !prev);
      return;
    }

    setShowNotificationsPopup(false);
    navigate(item.path);
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

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

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowLogoutConfirm(false);
            }
          }}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Xác nhận đăng xuất
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              >
                Hủy
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ICON-ONLY SIDEBAR - Floating */}
      <Sidebar
        className="w-20 rounded-2xl border border-gray-200 overflow-hidden shadow-lg"
        style={{ height: "calc(100vh - 40px)" }}
      >
        <SidebarHeader className="flex items-center justify-center pb-4">
          <div className="flex items-center gap-0.5">
            <span className="text-2xl font-bold text-blue-600">S</span>
            <span className="text-lg font-semibold text-black">afin</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex flex-col items-center py-4 gap-4">
          {mainMenuItems.map((item) => {
            const isNotificationItem = item.id === "notifications";
            const isActive = isNotificationItem
              ? showNotificationsPopup
              : !showNotificationsPopup && location.pathname === item.path;

            return (
              <button
                key={item.id}
                onClick={() => handleMainMenuClick(item)}
                title={item.title}
                className={`relative w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                  isActive
                    ? "bg-black text-white shadow-md"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                {item.icon}
                {isNotificationItem && unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </SidebarContent>

        <SidebarFooter className="flex flex-col items-center gap-2 py-4 relative">
          {isAuthenticated ? (
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              title={userInfo?.name || "Tài khoản"}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm hover:shadow-md transition-all relative z-40"
            >
              {userInfo?.avatar ? (
                <img
                  src={userInfo.avatar}
                  alt={userInfo.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                (userInfo?.name || "U").charAt(0).toUpperCase()
              )}
            </button>
          ) : (
            <button
              onClick={() => navigate("/signin")}
              title="Đăng nhập"
              className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-all"
            >
              <User className="h-4 w-4" />
            </button>
          )}
        </SidebarFooter>
      </Sidebar>

      {/* Dropdown Menu - Positioned outside sidebar */}
      {showAvatarMenu &&
        isAuthenticated &&
        portalTarget &&
        createPortal(
          <>
            {/* Close dropdown backdrop */}
            <div
              className="fixed inset-0 z-[1900]"
              onClick={() => setShowAvatarMenu(false)}
            />

            {/* Dropdown */}
            <div
              className="fixed bottom-[4.5rem] left-24 z-[2000] w-56 rounded-xl border border-gray-100 bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* User Info Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-base font-semibold text-white">
                  {userInfo?.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    userInfo?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-800">
                    {userInfo?.name}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {userInfo?.email}
                  </p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    setShowAvatarMenu(false);
                    setShowInfoModal(true);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => {
                    setShowAvatarMenu(false);
                    setShowLogoutConfirm(true);
                  }}
                  className="w-full px-4 py-2 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Đăng xuất</span>
                </button>
              </div>
            </div>
          </>,
          portalTarget,
        )}

      {/* Notifications Popup */}
      {showNotificationsPopup &&
        portalTarget &&
        createPortal(
          <>
            {/* Close backdrop */}
            <div
              className="fixed inset-0 z-[1900]"
              onClick={() => setShowNotificationsPopup(false)}
            />
            {/* Notifications Panel */}
            <div
              className="fixed left-24 top-20 z-[2000] w-[380px] max-w-[calc(100vw-7.5rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-4 py-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <BellRing className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Thông báo
                      </p>
                      <p className="text-xs text-gray-500">
                        Mã giao diện b1IfkE0pY
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNotificationsPopup(false)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">
                      {unreadCount}
                    </span>{" "}
                    chưa đọc
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full border-gray-200 px-3 text-xs"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Đánh dấu tất cả
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[430px]">
                <div className="space-y-3 p-3">
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

                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <Badge
                                    variant="outline"
                                    className={`h-auto border-0 px-2 py-0.5 text-[10px] ${getLevelBadgeClass(item.level)}`}
                                  >
                                    {getLevelLabel(item.level)}
                                  </Badge>
                                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                    <Clock3 className="h-3 w-3" />
                                    {item.createdAt}
                                  </span>
                                </div>

                                {!item.isRead && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="link"
                                    className="h-auto px-0 text-[11px] text-slate-700 hover:text-slate-900"
                                    onClick={() => markNotificationRead(item.id)}
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
        )}

      {/* INFO MANAGEMENT MODAL */}
      {showInfoModal &&
        portalTarget &&
        createPortal(
          <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <Info_Management onClose={() => setShowInfoModal(false)} />
            </div>
          </div>,
          portalTarget,
        )}
    </>
  );
};

export default UserSidebar;
