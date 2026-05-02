import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar"; 
import { NavbarAdmin } from "./NavBar";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";

const LayoutAdmin = () => {
  const location = useLocation();
  const isAdminMapRoute = location.pathname === "/admin/overview";

  if (isAdminMapRoute) {
    return (
      <SidebarProvider>
        <div className="relative h-screen w-full overflow-hidden bg-gray-100">
          <AdminSidebar />

          <div className="absolute inset-0 z-0">
            <Outlet />
          </div>

          <div className="ml-4 pointer-events-none absolute left-[6rem] right-3 top-3 z-30 sm:right-4 sm:top-4">
            <div className="pointer-events-auto">
              <NavbarAdmin />
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "5.5rem" }}>
      <div className="flex h-screen w-full bg-gray-100 overflow-x-hidden">
        <AdminSidebar />

        <div className="fixed left-3 top-3 z-50 md:hidden">
          <SidebarTrigger className="h-9 w-9 rounded-lg border border-gray-200 bg-white shadow-sm hover:bg-gray-50" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-3 pt-14 sm:px-4 sm:pt-4">
            <NavbarAdmin />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default LayoutAdmin;
