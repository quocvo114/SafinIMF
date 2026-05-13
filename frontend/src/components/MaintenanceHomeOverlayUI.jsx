import React, { useState, useRef, useEffect } from "react";
import { TrafficCone, Zap, TreePine, Building2, X, Layers } from "lucide-react";
import ReportForm from "./Report";
import Toast from "./Toast";
import MaintenanceUserSidebar from "./MaintenanceUserSidebar";
import { SidebarProvider } from "./ui/sidebar";
import { NavbarAdmin } from "./NavBar";
import incidentApi from "../services/api/incidentApi";
import { INCIDENT_ICON_MAP } from "./IncidentTypePopup";

const DEFAULT_CATEGORIES = [
  {
    id: "traffic",
    name: "Giao Thông",
    iconKey: "car",
    bgColor: "#f97316",
    textColor: "#ffffff",
    activeBgColor: "#F97316",
    borderColor: "#c2410c",
  },
  {
    id: "electric",
    name: "Điện",
    iconKey: "electric",
    bgColor: "#eab308",
    textColor: "#ffffff",
    activeBgColor: "#FDCA00",
    borderColor: "#AD8D0C",
  },
  {
    id: "tree",
    name: "Cây Xanh",
    iconKey: "tree",
    bgColor: "#22c55e",
    textColor: "#ffffff",
    activeBgColor: "#74C365",
    borderColor: "#15803d",
  },
  {
    id: "public",
    name: "Công Trình",
    iconKey: "public",
    bgColor: "#a855f7",
    textColor: "#ffffff",
    activeBgColor: "#B78FF2",
    borderColor: "#7e22ce",
  },
];



export default function MaintenanceHomeOverlayUI({
  selectedCategory,
  setSelectedCategory,
  mapElement,
}) {
  const navigate = useNavigate();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showCameraOnly, setShowCameraOnly] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await incidentApi.getIncidentTypes();
        if (res?.success && Array.isArray(res.data)) {
          const apiCategories = res.data.map(type => ({
            id: type.name, // Đồng bộ với Dashboard/AdminDashboard sử dụng tên làm ID lọc
            name: type.name,
            iconKey: type.iconKey || "public",
            bgColor: type.color || "#f97316",
            textColor: "#ffffff",
            activeBgColor: type.color || "#f97316",
          }));
          setCategories(apiCategories.length > 0 ? apiCategories : DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error("Failed to fetch incident types", err);
      }
    };
    fetchCategories();
  }, []);

  const [toast, setToast] = useState(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle any outside click logic here if needed
    };

    return () => {
      // Cleanup
    };
  }, []);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
        {/* MAP AREA - Background */}
        {mapElement && (
          <div className="absolute inset-0 z-0 w-full h-full">{mapElement}</div>
        )}

        {/* Floating Sidebar - Left Top */}
        <div className="absolute left-3 top-4 z-90">
          <SidebarProvider>
            <MaintenanceUserSidebar />
          </SidebarProvider>
        </div>

        {/* Floating Navbar */}
        <div
          className="pointer-events-none absolute right-6 top-6 z-20"
          style={{ left: "calc(var(--maintenance-sidebar-offset, 6rem) + 1rem)" }}
        >
          <div className="pointer-events-auto">
            <NavbarAdmin />
          </div>
        </div>

        {/* Floating Categories - Right Top (below navbar) */}
        <div
          className="absolute right-6 top-24 z-10 flex gap-2 scrollbar-hide px-10 py-1.5 -mx-1"
          style={{ left: "calc(var(--maintenance-sidebar-offset, 6rem) + 1rem)" }}
        >
          {/* Nút "Tất cả" */}
          <button
            onClick={() => setSelectedCategory("all")}
            className={`
              relative flex items-center gap-2 px-4 h-10 rounded-full text-xs font-medium
              transition-all duration-300 ease-out whitespace-nowrap flex-shrink-0
              ${selectedCategory === "all" ? "z-10" : "hover:opacity-100"}
            `}
            style={{
              backgroundColor:
                selectedCategory === "all" ? "#2563EB" : "#2563EB55",
              color: "#ffffff",
              border:
                selectedCategory === "all"
                  ? "2px solid #2563EB"
                  : "2px solid transparent",
              boxShadow:
                selectedCategory === "all"
                  ? "0 4px 90px #2563EB35, 0 0 0 9px #2563EB12, inset 0 0px 9px rgba(255,255,255,0.5)"
                  : "none",
              transform:
                selectedCategory === "all"
                  ? "scale(1.03) translateY(-1px)"
                  : "scale(1)",
            }}
          >
            <Layers size={18} color="#ffffff" />
            <span>Tất cả</span>
          </button>

          {/* Các nút category */}
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`
                relative flex items-center gap-2 px-4 h-10 rounded-full text-xs font-medium
                transition-all duration-300 ease-out whitespace-nowrap flex-shrink-0
                ${selectedCategory === c.id ? "z-10" : "hover:opacity-100"}
              `}
              style={{
                backgroundColor:
                  selectedCategory === c.id ? c.bgColor : `${c.bgColor}55`,
                color: "#ffffff",
                border:
                  selectedCategory === c.id
                    ? `2px solid ${c.bgColor}`
                    : "2px solid transparent",
                boxShadow:
                  selectedCategory === c.id
                    ? `0 4px 90px ${c.bgColor}35, 0 0 0 9px ${c.bgColor}12, inset 0 0px 9px rgba(255,255,255,0.5)`
                    : "none",
                transform:
                  selectedCategory === c.id
                    ? "scale(1.03) translateY(-1px)"
                    : "scale(1)",
              }}
            >
              {React.cloneElement(c.icon, {
                size: 18,
                color: "#ffffff",
              })}
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
