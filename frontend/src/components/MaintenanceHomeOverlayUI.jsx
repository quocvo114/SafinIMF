import React, { useState, useRef, useEffect } from "react";
import {
  TrafficCone,
  Zap,
  TreePine,
  Building2,
  Plus,
  Camera,
  X,
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
      console.error(error);
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
          <div className="absolute inset-0 z-0 w-full h-full">
            {mapElement}
          </div>
        )}

        {/* Floating Sidebar - Left Top (aligned with categories) */}
        <div className="absolute left-6 top-4 z-10">
          <SidebarProvider>
            <MaintenanceUserSidebar />
          </SidebarProvider>
        </div>

        {/* Floating Navbar */}
        <div className="pointer-events-none absolute left-28 right-4 top-4 z-20">
          <div className="pointer-events-auto">
            <NavbarAdmin />
          </div>
        </div>

        {/* Floating Categories - Right Top (below navbar) */}
        <div className="absolute left-28 right-4 top-24 z-10 flex gap-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 sm:h-10 sm:px-4 ${
              selectedCategory === "all" ? "shadow-md" : "hover:shadow-sm"
            }`}
            style={{
              backgroundColor: "#2563EB",
              color: "#ffffff",
              border: "none"
            }}
          >
            <span>📍</span>
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
                border: "none"
              }}
            >
              <span className="icon-wrap">{c.icon}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {/* Floating Buttons - Bottom Right */}
        <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 pointer-events-auto">
          {/* Camera Button */}
          <button
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-all"
            onClick={openCamera}
            title="Chụp ảnh"
          >
            <Camera size={20} />
          </button>

          {/* Plus Button */}
          <button
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-all"
            onClick={() => setIsReportOpen((prev) => !prev)}
            title="Tạo báo cáo mới"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Report Form Modal */}
      {isReportOpen && (
        <div className="interactive">
          <ReportForm 
            onClose={() => {
              setIsReportOpen(false);
              setCapturedImage(null);
            }} 
            initialImage={capturedImage}
          />
        </div>
      )}

      {/* CAMERA MODAL */}
      {showCameraOnly && (
        <div className="interactive fixed inset-0 bg-black bg-opacity-90 z-[10000] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl">
            <div className="bg-white rounded-t-lg p-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Chụp ảnh sự cố</h2>
              <button
                onClick={closeCamera}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-[60vh] object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="bg-white rounded-b-lg p-4">
              <button
                onClick={capturePhoto}
                className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors font-medium"
              >
                <Camera className="w-5 h-5" />
                <span>Chụp ảnh</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
