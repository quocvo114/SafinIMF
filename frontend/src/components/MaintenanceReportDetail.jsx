import React, { useState, useRef } from "react";
import {
  X,
  Hash,
  MapPin,
  Clock,
  Activity,
  Camera,
  CloudUpload,
  Send,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { reportApi } from "../services/api/reportApi";
import { toast } from "sonner";
import ImageViewer from "./ImageViewer";
import LocationMapInline from "./LocationMapInline";

export default function MaintenanceReportDetail({
  isOpen,
  onClose,
  report,
  onUpdate,
}) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [progressNote, setProgressNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [imageViewer, setImageViewer] = useState({ open: false, index: 0 });
  const fileInputRef = useRef(null);

  if (!isOpen || !report) return null;

  const reportImageUrl = report?.image || report?.images?.[0] || "";
  const allImages = [reportImageUrl, report?.afterImg].filter(Boolean);

  const openImageViewer = (index) => {
    setImageViewer({ open: true, index });
  };

  // Parse lat/lng from report
  const parseCoord = (value, min, max) => {
    const num = Number(value);
    return Number.isFinite(num) && num >= min && num <= max ? num : null;
  };

  const reportLat =
    parseCoord(report?.lat ?? report?.reportLatitude, -90, 90) ??
    (() => {
      const m = String(report?.location || "").match(
        /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
      );
      return m ? parseCoord(m[1], -90, 90) : null;
    })();

  const reportLng =
    parseCoord(report?.lng ?? report?.reportLongitude, -180, 180) ??
    (() => {
      const m = String(report?.location || "").match(
        /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
      );
      return m ? parseCoord(m[2], -180, 180) : null;
    })();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ảnh vượt quá 10MB. Vui lòng chọn ảnh khác.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ chấp nhận file ảnh (JPG, PNG).");
      return;
    }
    setSelectedImage(URL.createObjectURL(file));
    setSelectedImageFile(file);
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const convertImageToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmitProgress = async () => {
    if (!selectedImageFile) {
      toast.error("Vui lòng upload ảnh sau khi khắc phục.");
      return;
    }
    setIsSubmitting(true);
    try {
      const base64Image = await convertImageToBase64(selectedImageFile);
      const reportId = report?.id || report?._id || report?.report_id;
      const response = await reportApi.updateProgress(reportId, {
        afterImg: base64Image,
        progressNote: progressNote.trim() || undefined,
      });
      if (response.success) {
        toast.success("Cập nhật tiến độ thành công!");
        setShowConfirm(false);
        setSelectedImage(null);
        setSelectedImageFile(null);
        setProgressNote("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        onUpdate?.();
        onClose();
      } else {
        toast.error(response.message || "Cập nhật tiến độ thất bại.");
      }
    } catch (error) {
      console.error("Update progress error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật tiến độ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "Đang Chờ":
        return { color: "text-gray-500", bg: "bg-gray-100", label: "Đang Chờ" };
      case "Đang Xử Lý":
        return {
          color: "text-[#FFB020]",
          bg: "bg-amber-100",
          label: "Đang Xử Lý",
        };
      case "Đã Giải Quyết":
        return {
          color: "text-[#74C200]",
          bg: "bg-green-100",
          label: "Đã Giải Quyết",
        };
      default:
        return {
          color: "text-gray-500",
          bg: "bg-gray-100",
          label: status || "Không rõ",
        };
    }
  };

  const statusInfo = getStatusInfo(report?.status);
  const displayLocation = (() => {
    const loc = report?.location;
    if (!loc) return "---";
    if (/^[\d.-]+,\s*[\d.-]+$/.test(loc.trim())) return "Chưa cập nhật địa chỉ";
    return loc;
  })();

  // ---- CONFIRM DIALOG ----
  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Xác nhận cập nhật
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Báo cáo sẽ chuyển đến Quản lý khu vực với trạng thái{" "}
            <strong>"Đã Giải Quyết"</strong>. Bạn có chắc chắn?
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowConfirm(false)}
              disabled={isSubmitting}
              className="h-auto px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitProgress}
              disabled={isSubmitting}
              className="h-auto flex items-center gap-1.5 rounded-xl bg-[#2b6cb0] hover:bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
            >
              {isSubmitting ? (
                "Đang gửi..."
              ) : (
                <>
                  Xác nhận gửi <CheckCircle className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- MAIN MODAL ----
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-[600px] max-h-[90vh] flex flex-col rounded-[24px] bg-white shadow-2xl overflow-hidden">
          {/* Header - cố định */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-bold text-gray-900">
              Chi tiết báo cáo
            </h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body - cuộn được */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Type + Title */}
            <div>
              <Badge className="inline-flex items-center rounded-full bg-[#FF7F1F] hover:bg-[#FF7F1F] px-2.5 py-0.5 h-auto border-0 text-[10px] font-semibold text-white tracking-wide shadow-sm mb-1.5">
                {report?.type || "Giao Thông"}
              </Badge>
              <h1 className="text-lg font-bold text-gray-900 leading-snug">
                {report?.title || "Chi tiết sự cố"}
              </h1>
            </div>

            {/* Description */}
            {report?.description && (
              <div className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                <p className="text-xs italic leading-relaxed text-gray-600">
                  {report.description}
                </p>
              </div>
            )}

            {/* Details Grid 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                  <Hash className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Mã BC
                  </span>
                  <p className="text-sm font-bold text-blue-600 truncate">
                    {report?.id || report?.report_id || "---"}
                  </p>
                </div>
              </div>
              <LocationMapInline
                lat={reportLat}
                lng={reportLng}
                address={displayLocation}
                title={report?.title}
              >
                <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Vị trí
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {displayLocation}
                    </p>
                  </div>
                </div>
              </LocationMapInline>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Thời gian
                  </span>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {report?.time || "---"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${statusInfo.bg} ${statusInfo.color}`}
                >
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Trạng thái
                  </span>
                  <p
                    className={`text-sm font-bold ${statusInfo.color} truncate`}
                  >
                    {statusInfo.label}
                  </p>
                </div>
              </div>
            </div>

            {/* Photos - chiều cao cố định */}
            <div className="grid grid-cols-2 gap-3" style={{ height: "160px" }}>
              {/* Ảnh sự cố */}
              <div className="flex flex-col bg-gray-100 rounded-2xl p-2 overflow-hidden">
                <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
                  <Camera className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-gray-900">
                    Ảnh Sự Cố
                  </span>
                </div>
                <div className="flex-1 rounded-xl overflow-hidden bg-gray-200 min-h-0">
                  {reportImageUrl ? (
                    <img
                      src={reportImageUrl}
                      alt="Sự cố"
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openImageViewer(0)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      Không có ảnh
                    </div>
                  )}
                </div>
              </div>

              {/* Ảnh khắc phục */}
              <div className="flex flex-col bg-gray-100 rounded-2xl p-2 overflow-hidden">
                <div className="flex items-center justify-between mb-1.5 px-0.5 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-semibold text-blue-500">
                      Ảnh Khắc Phục
                    </span>
                  </div>
                  {selectedImage && (
                    <button
                      onClick={handleRemoveImage}
                      className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg"
                  onChange={handleImageUpload}
                />

                <div className="flex-1 rounded-xl overflow-hidden bg-gray-200 min-h-0">
                  {selectedImage ? (
                    <div
                      className="w-full h-full cursor-pointer group relative"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <img
                        src={selectedImage}
                        alt="Khắc phục"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CloudUpload className="h-5 w-5 text-white mb-0.5" />
                        <span className="text-white text-[10px] font-medium">
                          Thay đổi
                        </span>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="w-full h-full rounded-xl border-2 border-dashed border-gray-300 bg-transparent hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1.5 group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500 group-hover:scale-105 transition-transform">
                        <CloudUpload className="h-4 w-4" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-semibold text-gray-700">
                          Tải ảnh khắc phục
                        </p>
                        <p className="text-[9px] text-gray-400">
                          JPG, PNG (≤10MB)
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Progress Note textarea */}
            <div>
              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Ghi chú tiến độ (tùy chọn)
              </label>
              <textarea
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder="Mô tả ngắn về quá trình khắc phục..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-800 placeholder:text-gray-400 outline-none resize-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
              <p className="text-[10px] text-gray-400 mt-0.5 text-right">
                {progressNote.length}/300
              </p>
            </div>
          </div>

          {/* Footer - cố định */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-gray-100 shrink-0">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-auto px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (!selectedImageFile) {
                  toast.error("Vui lòng upload ảnh sau khi khắc phục.");
                  return;
                }
                setShowConfirm(true);
              }}
              disabled={isSubmitting}
              className="h-auto flex items-center gap-1.5 rounded-xl bg-[#2b6cb0] hover:bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
            >
              Cập nhật tiến độ
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <ImageViewer
        images={allImages}
        initialIndex={imageViewer.index}
        isOpen={imageViewer.open}
        onClose={() => setImageViewer({ open: false, index: 0 })}
      />
    </>
  );
}
