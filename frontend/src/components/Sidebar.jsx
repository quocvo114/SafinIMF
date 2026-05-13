import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LibraryBig,
  Folder,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "sonner";
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

const menuItems = [
  {
    key: "Overview",
    label: "Thư Viện",
    path: "/admin/overview",
    icon: LibraryBig,
  },
  {
    key: "DonTiepNhan",
    label: "Thư Mục",
    path: "/admin/recept-form",
    icon: Folder,
  },
  {
    key: "QuanLyBaoCao",
    label: "Thông Báo",
    path: "/admin/reports",
    icon: Bell,
  },
];

const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const handleLogout = () => {
    toast.success("Đăng xuất thành công!");
    setTimeout(() => {
      logout();
      navigate("/signin");
    }, 1500);
  };

  return (
    <>
      {/* Popup xác nhận đăng xuất */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Thông báo
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn đăng xuất?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

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
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.key}>
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
                            <Icon className="h-6 w-6" />
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
            <div
              className={`flex items-center ${
                isCollapsed
                  ? "w-12 h-12 mx-auto justify-center"
                  : "w-full px-3 py-2 gap-3"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                <span className="text-lg">👤</span>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setShowLogoutConfirm(true)}
                  className={`relative flex items-center transition-all ${
                    isCollapsed
                      ? "w-12 h-12 mx-auto justify-center rounded-lg"
                      : "w-full h-11 px-3 rounded-xl"
                  } text-red-600 hover:bg-red-50 hover:text-red-700`}
                >
                  <LogOut className="h-6 w-6" />
                  {!isCollapsed && (
                    <span className="ml-3 font-medium">Đăng xuất</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
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
    </>
  );
};

export default SidebarAdmin;
