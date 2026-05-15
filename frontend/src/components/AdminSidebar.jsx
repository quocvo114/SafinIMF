import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Map,
  Inbox,
  Users,
  Shield,
  BarChart3,
  LogOut,
  User,
  Tag,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  BellRing,
  CheckCheck,
  X,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Clock3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "sonner";
import InfoManagement from "../pages/Info_Management";
import { notificationApi } from "../services/api/notificationApi";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotificationsPopup, setShowNotificationsPopup] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const [isCollapsed, setIsCollapsed] = useState(true);
  const isMobile = useIsMobile();

  const sidebarGap = 20;
  const collapsedWidth = 72;
  const expandedWidth = 240;
  const sidebarWidth = isCollapsed ? collapsedWidth : expandedWidth;
  const contentOffset = isMobile ? sidebarGap : sidebarWidth + sidebarGap;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--admin-sidebar-width", `${sidebarWidth}px`);
    root.style.setProperty("--admin-sidebar-offset", `${contentOffset}px`);
    root.style.setProperty("--admin-sidebar-gap", `${sidebarGap}px`);

    return () => {
      root.style.removeProperty("--admin-sidebar-width");
      root.style.removeProperty("--admin-sidebar-offset");
      root.style.removeProperty("--admin-sidebar-gap");
    };
  }, [sidebarWidth, contentOffset, sidebarGap]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoadingNotifications(true);
    try {
      const response = await notificationApi.getNotifications();
      if (response.success) {
        setNotifications(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const markNotificationRead = async (id) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
        );
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getNotificationIcon = (type) => {
    if (type === "warning") return AlertTriangle;
    if (type === "report") return FileText;
    return ShieldAlert;
  };

  const getLevelBadgeClass = (level) => {
    if (level === "critical") return "bg-red-100 text-red-700";
    if (level === "low") return "bg-emerald-100 text-emerald-700";
    return "bg-slate-100 text-slate-700";
  };

  const getLevelLabel = (level) => {
    if (level === "critical") return "Khẩn cấp";
    if (level === "low") return "Thông tin";
    return "Bình thường";
  };

  const menuItems = [
    {
      id: "map",
      path: "/admin/overview",
      icon: <Map className="h-6 w-6" />,
      label: "Bản đồ",
    },
    {
      id: "receive",
      path: "/admin/recept-form",
      icon: <Inbox className="h-6 w-6" />,
      label: "Đơn tiếp nhận",
    },
    {
      id: "routes",
      path: "/admin/maintenanceteam",
      icon: <Shield className="h-6 w-6" />,
      label: "Quản lý đội xử lý",
    },
    {
      id: "users",
      path: "/admin/users",
      icon: <Users className="h-6 w-6" />,
      label: "Quản lý người dùng",
    },
    {
      id: "categories",
      path: "/admin/incident-types",
      icon: <Tag className="h-6 w-6" />,
      label: "Quản lý loại sự cố",
    },
    {
      id: "stats",
      path: "/admin/statistics",
      icon: <BarChart3 className="h-6 w-6" />,
      label: "Thống kê",
    },
    {
      id: "notifications",
      path: "/notifications",
      icon: <Bell className="h-6 w-6" />,
      label: "Thông báo",
    },
  ];

  const userInfo = {
    name: user?.full_name || "Người dùng",
    email: user?.email || "user@example.com",
    avatar: user?.avatar || null,
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      logout();
      navigate("/");
    }, 1500);
  };

  return (
    <>
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-[420px] rounded-2xl border border-gray-100 bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              Thông báo
            </DialogTitle>
            <DialogDescription className="text-base leading-6 text-gray-600">
              Bạn có chắc chắn muốn đăng xuất ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-100"
              onClick={() => setShowLogoutConfirm(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className="bg-red-500 text-white hover:bg-red-600"
              onClick={handleLogout}
            >
              Đăng xuất
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        className="absolute left-0 top-0 bottom-8 z-50 transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <Sidebar
          className="rounded-2xl border border-gray-200 overflow-hidden shadow-lg h-full flex flex-col bg-white"
          collapsible="none"
        >
          <SidebarHeader className="w-full flex items-center justify-between px-3 py-4">
            <div
              className={`flex items-center ${isCollapsed ? "justify-center w-full" : "gap-2"}`}
            >
              <div className="flex items-center whitespace-nowrap -tracking-widest">
                <span className="text-[#0033FF] text-2xl font-bold not-italic">
                  S
                </span>
                <span className="text-black text-2xl italic font-bold">
                  afin
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="flex flex-col py-4">
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-2">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => {
                              if (item.id === "notifications") {
                                setShowNotificationsPopup(!showNotificationsPopup);
                                return;
                              }
                              setShowNotificationsPopup(false);
                              navigate(item.path);
                            }}
                            className={`relative flex items-center transition-all overflow-visible ${
                              isCollapsed
                                ? "w-12 h-12 mx-auto justify-center rounded-lg"
                                : "w-full h-11 px-3 rounded-xl"
                            } ${
                              isActive
                                ? "bg-[#2563EB] text-white shadow-md shadow-blue-500/40 hover:bg-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-500/60 hover:scale-[1.02]"
                                : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md hover:shadow-blue-200/50 hover:scale-[1.02] hover:-translate-y-0.5"
                            }`}
                          >
                            {item.icon}
                            {!isCollapsed && (
                              <span className="ml-3 font-medium">
                                {item.label}
                              </span>
                            )}
                            {item.id === "notifications" && unreadCount > 0 && (
                              <span
                                className={`absolute z-20 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white ${
                                  isCollapsed
                                    ? "-right-2 -top-2 h-4 min-w-4"
                                    : "right-3 -top-2 h-5 min-w-5 text-xs"
                                }`}
                              >
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </span>
                            )}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-gray-900 text-white text-xs px-2 py-1"
                        >
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarContent>

          <SidebarFooter className="flex flex-col gap-2 py-4 px-2 mt-auto hover:bg-blue-50/50 transition-colors">
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              className={`flex items-center transition-all ${
                isCollapsed
                  ? "w-12 h-12 mx-auto justify-center"
                  : "w-full px-3 py-2 gap-3"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {userInfo.avatar ? (
                  <img
                    src={userInfo.avatar}
                    alt={userInfo.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  userInfo.name.charAt(0).toUpperCase()
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="font-semibold text-sm text-gray-900 truncate">
                    {userInfo.name}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {userInfo.email}
                  </span>
                </div>
              )}
            </button>
          </SidebarFooter>
        </Sidebar>

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="absolute -right-9 top-16 p-1.5 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors z-50"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4 text-gray-600" />
          ) : (
            <PanelLeftClose className="h-4 w-4 text-gray-600" />
          )}
        </button>
      </div>

      {showAvatarMenu &&
        portalTarget &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[1900]"
              onClick={() => setShowAvatarMenu(false)}
            />

            <div
              className="fixed bottom-[4.5rem] z-[2000] w-56 rounded-xl border border-gray-100 bg-white shadow-lg"
              style={{ left: "var(--admin-sidebar-offset, 6rem)" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-base font-semibold text-white">
                  {userInfo.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    userInfo.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-800">
                    {userInfo.name}
                  </p>
                  <p className="truncate text-sm text-gray-500">
                    {userInfo.email}
                  </p>
                </div>
              </div>

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

      {showInfoModal &&
        portalTarget &&
        createPortal(
          <InfoManagement onClose={() => setShowInfoModal(false)} />,
          portalTarget,
        )}

      {showNotificationsPopup &&
        portalTarget &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[1900]"
              onClick={() => setShowNotificationsPopup(false)}
            />
            <div
              className={`fixed top-20 z-[2000] w-[380px] max-w-[calc(100vw-7.5rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ${
                isCollapsed ? "left-24" : "left-[19.5rem]"
              }`}
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
                  {loadingNotifications && notifications.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Đang tải thông báo...
                    </div>
                  )}
                  {!loadingNotifications && notifications.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      Không có thông báo mới.
                    </div>
                  )}
                  {notifications.map((item) => {
                    const NoticeIcon = getNotificationIcon(item.type);
                    const notificationId = item._id || item.id;
                    const timeLabel = item.timeAgo || (item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "Vừa xong");

                    return (
                      <Card
                        size="sm"
                        key={notificationId}
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
                                    {timeLabel}
                                  </span>
                                </div>
                                {!item.isRead && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="link"
                                    className="h-auto px-0 text-[11px] text-slate-700 hover:text-slate-900"
                                    onClick={() => markNotificationRead(notificationId)}
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
    </>
  );
};

export default AdminSidebar;
