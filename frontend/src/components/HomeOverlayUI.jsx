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

export default function HomeOverlayUI({
  selectedCategory,
  setSelectedCategory,
  onSearch,
  userAvatar,
  userName,
  mapElement,
  showAuthButtons = true,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [showCameraOnly, setShowCameraOnly] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [localToast, setLocalToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const canCreateReport = () => {
    const isAuthenticated = Boolean(user || localStorage.getItem("token"));
    if (isAuthenticated) {
      return true;
    }

    toast.error("Vui lòng đăng nhập để sử dụng chức năng này");
    setTimeout(() => {
      navigate("/signin");
    }, 500);
    return false;
  };

  const handleAuthConfirm = (action) => {
    setConfirmAction(action);
    setShowConfirmDialog(true);
  };

  const proceedWithAuth = () => {
    if (confirmAction === "signin") {
      navigate("/signin");
    } else if (confirmAction === "signup") {
      navigate("/register");
    } else if (confirmAction === "camera") {
      setShowConfirmDialog(false);
      setConfirmAction(null);
      openCamera();
      return;
    } else if (confirmAction === "report") {
      setShowConfirmDialog(false);
      setConfirmAction(null);
      setIsReportOpen(true);
      return;
    }
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const cancelAuth = () => {
    setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleCameraClick = () => {
    const isAuthenticated = Boolean(user || localStorage.getItem("token"));
    if (isAuthenticated) {
      openCamera();
    } else {
      handleAuthConfirm("camera");
    }
  };

  const handlePlusClick = () => {
    const isAuthenticated = Boolean(user || localStorage.getItem("token"));
    if (isAuthenticated) {
      setIsReportOpen((prev) => !prev);
    } else {
      handleAuthConfirm("report");
    }
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
    if (!canCreateReport()) {
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

        {/* Floating Sidebar - Left Top (only show when authenticated) */}
        {user && (
          <div className="absolute left-3 top-4 z-10">
            <SidebarProvider>
              <UserSidebar />
            </SidebarProvider>
          </div>
        )}

        {/* Floating Categories - Right Top (only show when authenticated) */}
        {user && (
          <div
            className="absolute top-4 right-4 z-10 flex gap-2 overflow-x-auto scrollbar-hide"
            style={{ left: "var(--user-sidebar-offset, 6rem)" }}
          >
            {/* Category buttons */}
            <button
              onClick={() => setSelectedCategory("all")}
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
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
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
        )}

        {/* Auth Buttons - Top Right Corner (only show when not authenticated) */}
        {showAuthButtons && !user ? (
          <div className="absolute top-4 right-4 z-10 flex gap-3">
            <button
              onClick={() => navigate("/signin")}
              className="flex items-center gap-2 px-6 h-12 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 bg-white text-blue-600 hover:shadow-lg shadow-lg border-2 border-blue-600 hover:bg-blue-50"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex items-center gap-2 px-6 h-12 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 bg-blue-600 text-white hover:shadow-lg shadow-lg hover:bg-blue-700"
            >
              Sign Up
            </button>
          </div>
        ) : null}

        {/* Floating Buttons - Bottom Right (always show) */}
        <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 pointer-events-auto">
          {/* Camera Button */}
          <button
            className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center bg-black text-white hover:bg-gray-800 transition-all"
            onClick={handleCameraClick}
            title="Chụp ảnh"
          >
            <Camera size={20} />
          </button>

          {/* Plus Button */}
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-all hover:bg-gray-800 md:h-14 md:w-14"
            onClick={handlePlusClick}
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

      {/* CONFIRMATION DIALOG */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[10001] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {confirmAction === "signin" 
                ? "Đăng Nhập" 
                : confirmAction === "signup" 
                ? "Tạo Tài Khoản" 
                : confirmAction === "camera" 
                ? "Chụp Ảnh" 
                : "Tạo Báo Cáo"}
            </h2>
            <p className="text-gray-600 mb-6">
              {confirmAction === "signin" 
                ? "Bạn có muốn đăng nhập không?" 
                : confirmAction === "signup" 
                ? "Bạn có muốn tạo tài khoản mới không?"
                : confirmAction === "camera"
                ? "Vui lòng đăng nhập để sử dụng chức năng chụp ảnh"
                : "Vui lòng đăng nhập để tạo báo cáo mới"}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelAuth}
                className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={proceedWithAuth}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                Tiếp Tục
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
