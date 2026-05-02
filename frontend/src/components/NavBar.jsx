import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, MapPin, LogOut, Settings, User, BookOpen, Folder, Zap, AlertCircle, Trees, Building2, CloudSun, Navigation } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import { Button } from "@/components/ui/button";

// const Avatar = ({ src, alt }) => (
//   <img
//     src={src}
//     alt={alt}
//     className="h-8 w-8 rounded-full object-cover ring-1 ring-black/5"
//     onError={(e) => (e.currentTarget.style.display = "none")}
//   />
// );

const CATEGORIES = [
  { id: "all", label: "Tất Cả", icon: "📋", color: "blue" },
  { id: "traffic", label: "Giao Thông", icon: "🚗", color: "orange" },
  { id: "electricity", label: "Điện", icon: "⚡", color: "yellow" },
  { id: "water", label: "IU", icon: "💧", color: "red" },
  { id: "green", label: "Cây Xanh", icon: "🌳", color: "green" },
  { id: "public", label: "Công Trình Công Cộng", icon: "🏗️", color: "purple" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [openUser, setOpenUser] = useState(false);
  const [openNoti, setOpenNoti] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  // Refs để detect click outside
  const userRef = useRef(null);
  const notiRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userRef.current && !userRef.current.contains(event.target)) {
        setOpenUser(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setOpenNoti(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ===============================
  // LOCATION & DATE
  // ===============================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [location, setLocation] = useState({
    city: "Đang tải...",
    country: "",
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60 * 1000); // cập nhật mỗi phút
    return () => clearInterval(timer);
  }, []);

  // Lấy vị trí thành phố
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Gọi API với zoom=8 để lấy cấp tỉnh/thành phố
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=8&addressdetails=1&accept-language=vi`,
            );
            const data = await response.json();
            console.log("Full location data:", data);
            const addressParts = data.display_name.split(", ");
            const city =
              addressParts.length >= 2
                ? addressParts[1]
                : data.address.city ||
                  data.address.state ||
                  "Vị trí không xác định";

            const country = data.address.country || "";
            setLocation({ city, country });
          } catch (error) {
            setLocation({ city: "Không thể xác định", country: "" });
          }
        },
        () => {
          setLocation({ city: "Chưa cấp quyền", country: "" });
        },
      );
    } else {
      setLocation({ city: "Không hỗ trợ", country: "" });
    }
  }, []);

  const formatDate = (d) =>
    d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });

  // ===============================
  // 🔔 NOTIFICATION
  // ===============================
  const [noti, setNoti] = useState([
    {
      id: "1",
      title: "Báo cáo mới được gửi",
      message: "Hư hỏng đường tại Quận Hải Châu - Đang chờ xử lý",
      severity: "info",
      createdAt: new Date().toISOString(),
      unread: true,
    },
    {
      id: "2",
      title: "Báo cáo đã được phê duyệt",
      message: "Báo cáo về hư hỏng cầu đã được xác nhận bởi quản trị viên",
      severity: "success",
      createdAt: new Date(Date.now() - 3600e3).toISOString(),
      unread: true,
    },
  ]);

  const markAllRead = () =>
    setNoti((prev) => prev.map((n) => ({ ...n, unread: false })));

  const handleLogout = () => {
    setToast({ message: "Đăng xuất thành công!", type: "success" });
    setOpenUser(false);
    setTimeout(() => {
      logout();
      navigate("/signin");
    }, 1500);
  };

  // ===============================
  // 🧭 NAVBAR UI
  // ===============================
  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

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

      <header
        className="relative z-40"
        style={{ transition: "background-color 300ms ease, color 300ms ease" }}
      >
      <div
        className="bg-white/95 backdrop-blur border-b border-gray-200 
                   px-4 py-3 flex items-center justify-between gap-4 flex-wrap"
        style={{ minHeight: "70px" }}
      >
        {/* LOCATION + USER INFO */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center gap-2 rounded-full 
                        bg-gray-100/90 
                        text-gray-700 
                        px-3 py-2 shadow-sm text-sm"
          >
            <MapPin className="h-4 w-4 opacity-70" />
            <span className="font-medium">{location.city}</span>
            {location.country && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-xs">{formatDate(currentDate)}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>
              Xin chào,{" "}
              <span className="font-semibold text-gray-800">
                {user?.full_name || "Người dùng"}
              </span>{" "}
              👋
            </span>
          </div>
        </div>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {/* 🔔 Notification */}
          <div className="relative" ref={notiRef}>
            <button
              onClick={() => setOpenNoti((v) => !v)}
              className="relative h-10 w-10 rounded-full 
                       bg-white 
                       border border-gray-200 
                       shadow-sm hover:bg-gray-50"
            >
              <Bell className="mx-auto h-5 w-5 text-gray-800" />
              {noti.some((n) => n.unread) && (
                <span className="absolute -top-0.5 -right-0.5 inline-block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>

            {openNoti && (
              <div
                className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 
                           bg-white/95 backdrop-blur shadow-lg p-2"
              >
                <div className="flex items-center justify-between px-2 py-1">
                  <p className="text-sm font-semibold text-gray-800">Thông báo</p>
                  <button
                    onClick={markAllRead}
                    className="text-xs rounded-full px-2 py-1 hover:bg-gray-100 text-gray-600"
                  >
                    Đánh dấu đã đọc
                  </button>
                </div>

                <div className="max-h-80 overflow-auto pr-1">
                  {noti.length === 0 ? (
                    <p className="text-xs text-gray-500 px-3 py-6 text-center">
                      Không có thông báo
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {noti.map((n) => (
                        <li
                          key={n.id}
                          className={`flex gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 ${
                            n.unread ? "bg-gray-50" : ""
                          }`}
                        >
                          <div className="pt-1">
                            <span
                              className={`inline-block h-2 w-2 rounded-full ${
                                n.severity === "critical"
                                  ? "bg-red-500"
                                  : n.severity === "warning"
                                  ? "bg-amber-500"
                                  : "bg-blue-500"
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-gray-800">
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-xs text-gray-600 overflow-hidden text-ellipsis">
                                {n.message}
                              </p>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 👤 User */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setOpenUser((v) => !v)}
              className="group flex items-center gap-3 
                         rounded-full 
                         bg-amber-50 
                         px-4 py-2 shadow-sm 
                         hover:bg-amber-100"
            >
              <User className="h-4 w-4" />
            </button>

            {openUser && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl 
                            border border-gray-200 
                            bg-white/95 
                            backdrop-blur shadow-lg p-2 z-50"
              >
                <ul className="space-y-1">
                  <li>
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 
                                       hover:bg-gray-50 text-sm text-gray-800"
                    >
                      <User className="h-4 w-4" /> Hồ sơ
                    </button>
                  </li>
                  <li>
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 
                                       hover:bg-gray-50 text-sm text-gray-800"
                    >
                      <Settings className="h-4 w-4" /> Cài đặt
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setOpenUser(false);
                        setShowLogoutConfirm(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 
                                 hover:bg-gray-50 text-sm text-red-600"
                    >
                      <LogOut className="h-4 w-4" /> Đăng xuất
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      </header>
    </>
  );
}

export function NavbarAdmin() {
  const [temperature, setTemperature] = useState(25);
  const [openNoti, setOpenNoti] = useState(false);

  const notiRef = useRef(null);

  // Đóng dropdown thông báo khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setOpenNoti(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [location, setLocation] = useState({
    city: "Đang tải...",
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const [locationResponse, weatherResponse] = await Promise.all([
              fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=8&addressdetails=1&accept-language=vi`,
              ),
              fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&timezone=Asia%2FBangkok`,
              ),
            ]);

            const data = await locationResponse.json();
            const addressParts = data.display_name.split(", ");
            const city =
              addressParts.length >= 2
                ? addressParts[1]
                : data.address.city ||
                  data.address.state ||
                  "Vị trí không xác định";
            setLocation({ city });

            if (weatherResponse.ok) {
              const weatherData = await weatherResponse.json();
              const currentTemp = weatherData?.current?.temperature_2m;
              if (typeof currentTemp === "number") {
                setTemperature(Math.round(currentTemp));
              }
            }
          } catch (error) {
            setLocation({ city: "TP. Đà Nẵng" });
          }
        },
        () => {
          setLocation({ city: "TP. Đà Nẵng" });
        },
      );
    } else {
      setLocation({ city: "TP. Đà Nẵng" });
    }
  }, []);

  const [noti, setNoti] = useState([
    {
      id: "1",
      title: "Báo cáo mới được gửi",
      message: "Hư hỏng đường tại Quận Hải Châu - Đang chờ xử lý",
      severity: "info",
      createdAt: new Date().toISOString(),
      unread: true,
    },
    {
      id: "2",
      title: "Báo cáo đã được phê duyệt",
      message: "Báo cáo về hư hỏng cầu đã được xác nhận bởi quản trị viên",
      severity: "success",
      createdAt: new Date(Date.now() - 3600e3).toISOString(),
      unread: true,
    },
  ]);

  const markAllRead = () =>
    setNoti((prev) => prev.map((n) => ({ ...n, unread: false })));

  const formatDate = (d) => {
    const day = d.toLocaleDateString("en-GB", { day: "2-digit" });
    const month = d.toLocaleDateString("en-GB", { month: "short" });
    const year = d.toLocaleDateString("en-GB", { year: "2-digit" });
    return `${day} ${month}, ${year}`;
  };

  const displayCity =
    location.city && location.city !== "Đang tải..."
      ? location.city.toLowerCase().includes("đà nẵng")
        ? "TP. Đà Nẵng"
        : `TP. ${location.city.replace(/^TP\.\s*/i, "")}`
      : "TP. Đà Nẵng";

  return (
    <>
      <header className="relative z-40">
        <div
          className="bg-white border border-gray-200 rounded-[30px] shadow-sm
                   px-3 py-2.5 sm:px-5 flex items-center justify-between gap-2 sm:gap-4"
          style={{ minHeight: "60px" }}
        >
          <div className="flex w-full items-center gap-2 sm:w-auto sm:gap-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-0 flex-1 justify-center rounded-full border-gray-200 bg-[#eaeaea] px-3 text-sm text-gray-700 hover:bg-[#eaeaea] sm:flex-none sm:px-5"
            >
              <CloudSun className="h-4 w-4 text-gray-500" />
              <span className="whitespace-nowrap font-medium text-gray-700">
                {temperature}°C
              </span>
              <span className="hidden text-gray-400 sm:inline">|</span>
              <span className="hidden whitespace-nowrap font-medium text-gray-600 sm:inline">
                {formatDate(currentDate)}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-0 flex-1 justify-center rounded-full border-gray-200 bg-[#eaeaea] px-3 text-sm text-gray-800 hover:bg-[#eaeaea] sm:flex-none sm:px-5"
            >
              <Navigation className="h-4 w-4 text-gray-700" />
              <span className="truncate font-semibold">{displayCity}</span>
            </Button>

            <div className="relative" ref={notiRef}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setOpenNoti((v) => !v)}
                className="relative h-10 w-10 rounded-full border border-gray-300 bg-[#f3f3f3] shadow-sm hover:bg-gray-100"
              >
                <Bell className="mx-auto h-6 w-6 text-gray-800" />
                {noti.some((n) => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 inline-block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#f3f3f3]" />
                )}
              </Button>

              {openNoti && (
                <div
                  className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 
                           bg-white/95 backdrop-blur shadow-lg p-2 z-50"
                >
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-sm font-semibold text-gray-800">
                      Thông báo
                    </p>
                    <button
                      onClick={markAllRead}
                      className="text-xs rounded-full px-2 py-1 hover:bg-gray-100 text-gray-600"
                    >
                      Đánh dấu đã đọc
                    </button>
                  </div>

                  <div className="max-h-80 overflow-auto pr-1">
                    {noti.length === 0 ? (
                      <p className="text-xs text-gray-500 px-3 py-6 text-center">
                        Không có thông báo
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {noti.map((n) => (
                          <li
                            key={n.id}
                            className={`flex gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 ${
                              n.unread ? "bg-gray-50" : ""
                            }`}
                          >
                            <div className="pt-1">
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  n.severity === "critical"
                                    ? "bg-red-500"
                                    : n.severity === "warning"
                                      ? "bg-amber-500"
                                      : "bg-blue-500"
                                }`}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate text-gray-800">
                                {n.title}
                              </p>
                              {n.message && (
                                <p className="text-xs text-gray-600 overflow-hidden text-ellipsis">
                                  {n.message}
                                </p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

