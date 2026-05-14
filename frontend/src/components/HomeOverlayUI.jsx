import React, { useState, useRef, useEffect } from "react";
import {
  TrafficCone,
  Zap,
  TreePine,
  Building2,
  Plus,
  Camera,
  LayoutGrid,
  X,
} from "lucide-react";
import ReportForm from "./Report";
// Toast component imported but shadowed - using sonner toast directly
import UserSidebar from "./UserSidebar";
import { SidebarProvider } from "./ui/sidebar";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import incidentApi from "../services/api/incidentApi";
import { INCIDENT_ICON_MAP } from "./IncidentTypePopup";

const DEFAULT_CATEGORIES = [
  {
    id: "traffic",
    name: "Giao Thông",
    iconKey: "car",
    bgColor: "#f97316",
    textColor: "#ffffff",
    activeBgColor: "#f97316",
  },
  {
    id: "electric",
    name: "Điện",
    iconKey: "electric",
    bgColor: "#eab308",
    textColor: "#ffffff",
    activeBgColor: "#eab308",
  },
  {
    id: "tree",
    name: "Cây Xanh",
    iconKey: "tree",
    bgColor: "#22c55e",
    textColor: "#ffffff",
    activeBgColor: "#22c55e",
  },
  {
    id: "public",
    name: "Công Trình",
    iconKey: "public",
    bgColor: "#a855f7",
    textColor: "#ffffff",
    activeBgColor: "#a855f7",
  },
];

export default function HomeOverlayUI({
  selectedCategory,
  setSelectedCategory,
  onSearch,
  userAvatar,
  userName,
  mapElement,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showCameraOnly, setShowCameraOnly] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [localToast, setLocalToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await incidentApi.getIncidentTypes();
        if (res?.success && Array.isArray(res.data)) {
          const apiCategories = res.data.map(type => ({
            id: type.name, // Use name as ID for filtering since reports save 'type' as name
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

  const requireAuth = () => {
    const isAuthenticated = Boolean(user || localStorage.getItem("token"));
    if (isAuthenticated) {
      return true;
    }

    navigate("/signin");
    return false;
  };

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
    if (!requireAuth()) {
      return;
    }

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
      toast.error(
        "Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.",
      );
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
      <div className="w-full h-screen flex flex-col bg-background relative overflow-hidden">
        {/* MAP AREA - Background */}
        {mapElement && (
          <div className="absolute inset-0 z-0 w-full h-full">{mapElement}</div>
        )}

        {/* Floating Sidebar - Left Top (aligned with categories) */}
        <div className="absolute left-3 top-4 z-10">
          <SidebarProvider>
            <UserSidebar />
          </SidebarProvider>
        </div>

        {/* Floating Categories - Right Top (next to sidebar) */}
        <div
          className="absolute top-4 right-4 z-10 flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ left: "var(--user-sidebar-offset, 6rem)" }}
        >
          <button
            onClick={() => {
              if (requireAuth()) setSelectedCategory("all");
            }}
            className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              selectedCategory === "all" ? "shadow-md" : "hover:shadow-sm"
            }`}
            style={{
              backgroundColor: "#2563EB",
              color: "#ffffff",
              border: "none",
            }}
          >
            <span className="icon-wrap">
              <LayoutGrid size={18} />
            </span>
            <span>Tất cả</span>
          </button>
          {categories.map((c) => {
            const IconComp = INCIDENT_ICON_MAP[c.iconKey] || Building2;
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (requireAuth()) setSelectedCategory(c.id);
                }}
                className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === c.id ? "shadow-md" : "hover:shadow-sm"
                }`}
                style={{
                  backgroundColor: c.bgColor,
                  color: "#ffffff",
                  border: "none",
                }}
              >
                <span className="icon-wrap"><IconComp size={18} /></span>
                <span>{c.name}</span>
              </button>
            );
          })}
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
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-all hover:bg-gray-800 md:h-14 md:w-14"
            onClick={() => {
              if (!requireAuth()) {
                return;
              }
              setIsReportOpen((prev) => !prev);
            }}
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
