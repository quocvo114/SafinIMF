import React, { useState, useRef, useEffect } from "react";
import {
  TrafficCone,
  Zap,
  TreePine,
  Building2,
  Plus,
  Camera,
  X,
  Layers,
} from "lucide-react";
import ReportForm from "./Report";
import Toast from "./Toast";
import { useNavigate } from "react-router-dom";
import MaintenanceUserSidebar from "./MaintenanceUserSidebar";
import { SidebarProvider } from "./ui/sidebar";
import { NavbarAdmin } from "./NavBar";

const categories = [
  {
    id: "traffic",
    name: "Giao Thông",
    icon: <TrafficCone size={18} />,
    bgColor: "#f97316",
    textColor: "#ffffff",
    activeBgColor: "#f97316",
  },
  {
    id: "electric",
    name: "Điện",
    icon: <Zap size={18} />,
    bgColor: "#eab308",
    textColor: "#ffffff",
    activeBgColor: "#eab308",
  },
  {
    id: "tree",
    name: "Cây Xanh",
    icon: <TreePine size={18} />,
    bgColor: "#22c55e",
    textColor: "#ffffff",
    activeBgColor: "#22c55e",
  },
  {
    id: "public",
    name: "Công Trình",
    icon: <Building2 size={18} />,
    bgColor: "#a855f7",
    textColor: "#ffffff",
    activeBgColor: "#a855f7",
  },
];

export default function MaintenanceHomeOverlayUI({
  selectedCategory,
  setSelectedCategory,
  onSearch,
  userAvatar,
  userName,
  mapElement,
}) {
  const navigate = useNavigate();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showCameraOnly, setShowCameraOnly] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle any outside click logic here if needed
    };

    return () => {
      // Cleanup
    };
  }, []);

  // Mở camera
  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setShowCameraOnly(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch (error) {
      // ✅ Cleanup: Camera access error handling silenced
      alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  // Đóng camera
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCameraOnly(false);
  };

  // Chụp ảnh
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");

    // Đóng camera, lưu ảnh và mở form Report
    closeCamera();
    setCapturedImage(imageData);
    setIsReportOpen(true);
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

      <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
        {/* MAP AREA - Background */}
        {mapElement && (
          <div className="absolute inset-0 z-0 w-full h-full">{mapElement}</div>
        )}

        {/* Floating Sidebar - Left Top (aligned with categories) */}
        <div className="absolute left-3 top-4 z-90">
          <SidebarProvider>
            <MaintenanceUserSidebar />
          </SidebarProvider>
        </div>

        {/* Floating Navbar */}
        <div
          className="pointer-events-none absolute right-4 top-4 z-20"
          style={{ left: "var(--maintenance-sidebar-offset, 6rem)" }}
        >
          <div className="pointer-events-auto">
            <NavbarAdmin />
          </div>
        </div>

        {/* Floating Categories - Right Top (below navbar) */}
        <div
          className="absolute right-4 top-24 z-10 flex gap-3 overflow-x-auto scrollbar-hide"
          style={{ left: "var(--maintenance-sidebar-offset, 6rem)" }}
        >
          <button
            onClick={() => setSelectedCategory("all")}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 sm:h-10 sm:px-4 ${
              selectedCategory === "all" ? "shadow-md" : "hover:shadow-sm"
            }`}
            style={{
              backgroundColor: "#2563EB",
              color: "#ffffff",
              border: "none",
            }}
          >
            <Layers size={18} />
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 sm:h-10 sm:px-4 ${
                selectedCategory === c.id ? "shadow-md" : "hover:shadow-sm"
              }`}
              style={{
                backgroundColor: c.bgColor,
                color: "#ffffff",
                border: "none",
              }}
            >
              <span className="icon-wrap">{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
