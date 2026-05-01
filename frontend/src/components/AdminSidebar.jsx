import React, { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
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
  SidebarHeader,
} from "./ui/sidebar";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const menuItems = [
    {
      id: "map",
      path: "/admin/overview",
      icon: <Map className="h-5 w-5" />,
      label: "Bản đồ",
    },
    {
      id: "receive",
      path: "/admin/recept-form",
      icon: <Inbox className="h-5 w-5" />,
      label: "Đơn tiếp nhận",
    },
    {
      id: "routes",
      path: "/admin/maintenanceteam",
      icon: <Shield className="h-5 w-5" />,
      label: "Quản lý đội xử lý",
    },
    {
      id: "users",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      label: "Quản lý người dùng",
    },
    {
      id: "categories",
      path: "/admin/incident-types",
      icon: <Tag className="h-5 w-5" />,
      label: "Quản lý loại sự cố",
    },
    {
      id: "stats",
      path: "/admin/statistics",
      icon: <BarChart3 className="h-5 w-5" />,
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

      <Sidebar
        className="z-30 top-4 h-[calc(100vh-2rem)] data-[side=left]:left-3 rounded-2xl border border-gray-200 overflow-hidden shadow-lg"
      >
          <SidebarHeader className="flex items-center justify-center pb-4">
            <div className="flex items-center gap-0.5">
              <span className="text-2xl font-bold text-blue-600">S</span>
              <span className="text-lg font-semibold text-black">afin</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="flex flex-col items-center py-4 gap-4">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  title={item.label}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                    isActive
                      ? "bg-black text-white shadow-md"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  {item.icon}
                </button>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="flex flex-col items-center gap-2 py-4 relative">
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              title={userInfo.name}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-semibold text-sm hover:shadow-md transition-all relative z-40"
            >
              {userInfo.avatar ? (
                <img
                  src={userInfo.avatar}
                  alt={userInfo.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                userInfo.name.charAt(0).toUpperCase()
              )}
            </button>
          </SidebarFooter>
      </Sidebar>

      {showAvatarMenu &&
        portalTarget &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[1900]"
              onClick={() => setShowAvatarMenu(false)}
            />

            <div
              className="fixed bottom-[4.5rem] left-24 z-[2000] w-56 rounded-xl border border-gray-100 bg-white shadow-lg"
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
