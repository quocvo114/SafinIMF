import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LibraryBig, Folder, Bell, LogOut, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

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
  const { logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

      <div className="fixed left-0 top-0 h-screen w-[100px] flex items-center justify-center p-3 z-30">
        <aside className="w-full h-[85vh] rounded-2xl shadow-2xl bg-white flex flex-col items-center py-6 px-2 gap-4">
          {/* Logo */}
          <div className="flex justify-center mb-1">
            <h1 className="font-['Inter'] font-bold text-[24px] text-blue-600">
              S
            </h1>
          </div>

          {/* Menu Icons */}
          <nav className="flex flex-col gap-4 items-center justify-center">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center justify-center w-12 h-12 rounded-[14px] transition-all duration-200 relative group
                     ${isActive 
                       ? "bg-black text-white" 
                       : "text-gray-800 hover:bg-gray-100"
                     }`
                  }
                >
                  <Icon className="w-6 h-6" />
                </NavLink>
              );
            })}
          </nav>

          {/* Avatar (Bottom) */}
          <div className="mt-auto flex flex-col gap-3 items-center">
            {/* Avatar Circle */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-300 to-orange-500 flex items-center justify-center cursor-pointer hover:shadow-md transition-all">
              <span className="text-white text-lg font-bold">👤</span>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center justify-center w-12 h-12 rounded-[14px] text-gray-800 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              title="Đăng xuất"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </aside>
      </div>
    </>
  );
};

export default SidebarAdmin;
