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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "sonner";
import InfoManagement from "../pages/Info_Management";
import { Button } from "./ui/button";
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
      navigate("/signin");
    }, 1500);
  };

  return (
    <>
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="max-w-[420px] rounded-2xl border border-gray-100 bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              Xác nhận đăng xuất
            </DialogTitle>
            <DialogDescription className="text-base leading-6 text-gray-600">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
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
                            onClick={() => navigate(item.path)}
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

      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <Info_Management onClose={() => setShowInfoModal(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
