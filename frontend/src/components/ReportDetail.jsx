import { useEffect, useState } from "react";
import {
  Camera,
  X,
  MapPin,
  Clock,
  FileText,
  Hash,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

import ImageViewer from "./ImageViewer";
import { reportApi } from "../services/api/reportApi";
import incidentApi from "../services/api/incidentApi";

function getTypeLabel(type) {
  if (!type) return "Khác";
  return String(type);
}

function getStatusLabel(status) {
  if (!status) return "Đang chờ";
  return String(status);
}

function getTypeBadgeClass(type) {
  const typeStr = String(type || "")
    .toLowerCase()
    .trim();

  const colorMap = {
    "đường sá": "bg-[#f97316] text-white hover:bg-[#ea580c]",
    "giao thông": "bg-[#f97316] text-white hover:bg-[#ea580c]",
    "cây xanh": "bg-[#22c55e] text-white hover:bg-[#16a34a]",
    "đèn giao thông": "bg-[#eab308] text-white hover:bg-[#ca8a04]",
    "thấp thỏm": "bg-[#ef4444] text-white hover:bg-[#dc2626]",
    "cấp nước": "bg-[#06b6d4] text-white hover:bg-[#0891b2]",
    "vệ sinh": "bg-[#a855f7] text-white hover:bg-[#9333ea]",
  };

  return colorMap[typeStr] || "bg-[#f97316] text-white hover:bg-[#ea580c]";
}

function getStatusBadgeClass(status) {
  const statusStr = String(status || "")
    .toLowerCase()
    .trim();
  if (statusStr === "đang chờ" || statusStr === "pending") {
    return "bg-[#d4d4d8] text-white hover:bg-[#a1a1aa]";
  }
  if (statusStr === "đã xử lý" || statusStr === "resolved") {
    return "bg-[#22c55e] text-white hover:bg-[#16a34a]";
  }
  if (statusStr === "đang xử lý" || statusStr === "processing") {
    return "bg-[#3b82f6] text-white hover:bg-[#2563eb]";
  }
  return "bg-[#d4d4d8] text-white hover:bg-[#a1a1aa]";
}

const getIncidentImages = (data) => {
  const images = [];
  if (data?.images && Array.isArray(data.images)) {
    data.images.forEach((img) => {
      if (
        typeof img === "string" &&
        img.trim() &&
        img.trim().toLowerCase() !== "null" &&
        img.trim().toLowerCase() !== "undefined"
      ) {
        images.push(img);
      }
    });
  }

  if (
    data?.image &&
    typeof data.image === "string" &&
    data.image.trim() &&
    data.image.trim().toLowerCase() !== "null" &&
    data.image.trim().toLowerCase() !== "undefined"
  ) {
    if (!images.includes(data.image)) {
      images.push(data.image);
    }
  }

  if (
    data?.imageUrl &&
    typeof data.imageUrl === "string" &&
    data.imageUrl.trim() &&
    data.imageUrl.trim().toLowerCase() !== "null" &&
    data.imageUrl.trim().toLowerCase() !== "undefined"
  ) {
    if (!images.includes(data.imageUrl)) {
      images.push(data.imageUrl);
    }
  }

  return images;
};

export default function ReportDetail({ data, close }) {
  const [incidentTypes, setIncidentTypes] = useState([]);
  const isOpen = Boolean(data);

  const [freshData, setFreshData] = useState(data);
  const reportIdToUse = data?.id || data?.report_id;

  useEffect(() => {
    if (!reportIdToUse || !isOpen) return;

    const fetchFreshData = async () => {
      try {
        const response = await reportApi.getReportById(reportIdToUse);
        const freshReport = response?.data || response;
        setFreshData(freshReport);
      } catch (err) {
        console.error("Error fetching fresh report data:", err);
        setFreshData(data);
      }
    };

    fetchFreshData();
  }, [reportIdToUse, data, isOpen]);

  const displayData = freshData || data;
  const incidentImages = getIncidentImages(displayData);
  const beforeImage = incidentImages[0] || "";

  let afterImageCandidate = displayData?.afterImg || displayData?.after_img;
  const afterImage =
    typeof afterImageCandidate === "string" &&
    afterImageCandidate.trim().toLowerCase() !== "null" &&
    afterImageCandidate.trim().toLowerCase() !== "undefined"
      ? afterImageCandidate
      : "";

  const normalizedBeforeImage =
    typeof beforeImage === "string" ? beforeImage.trim() : "";
  const normalizedAfterImage =
    typeof afterImage === "string" ? afterImage.trim() : "";
  const effectiveAfterImage =
    normalizedBeforeImage && normalizedAfterImage === normalizedBeforeImage
      ? ""
      : afterImage;

  const [afterImageFailed, setAfterImageFailed] = useState(false);
  const [imageViewer, setImageViewer] = useState({ open: false, index: 0 });

  useEffect(() => {
    const fetchIncidentTypes = async () => {
      try {
        const response = await incidentApi.getIncidentTypes();
        if (response?.success && Array.isArray(response.data)) {
          setIncidentTypes(response.data);
        }
      } catch (error) {
        console.error("Failed to load incident types", error);
      }
    };
    if (isOpen) fetchIncidentTypes();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setImageViewer({ open: false, index: 0 });
    }
  }, [isOpen]);

  useEffect(() => {
    setAfterImageFailed(false);
  }, [effectiveAfterImage]);

  if (!isOpen) return null;

  const showAfterImage = Boolean(effectiveAfterImage) && !afterImageFailed;

  const viewerIncidentImages = incidentImages.length > 0
    ? incidentImages
    : beforeImage
      ? [beforeImage]
      : [];

  const hasAfterInIncidentImages = showAfterImage
    ? viewerIncidentImages.some(
        (img) =>
          typeof img === "string" &&
          img.trim() === String(effectiveAfterImage).trim(),
      )
    : false;

  const allImages = showAfterImage && !hasAfterInIncidentImages
    ? [...viewerIncidentImages, effectiveAfterImage]
    : [...viewerIncidentImages];

  const openImageViewerForIncident = () => {
    if (viewerIncidentImages.length > 0) {
      setImageViewer({ open: true, index: 0 });
    }
  };

  const openImageViewerForAfter = () => {
    if (showAfterImage) {
      setImageViewer({ open: true, index: viewerIncidentImages.length });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && close?.()}>
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => {
            if (imageViewer.open) {
              e.preventDefault();
            }
          }}
          className="z-[60] flex max-h-[96vh] w-[min(94vw,820px)] flex-col gap-0 overflow-hidden rounded-[12px] border border-[#f0f0f0] bg-white p-0 shadow-2xl sm:w-[min(92vw,820px)] sm:max-w-[820px]"
        >
          <DialogHeader className="bg-white px-4 pt-4 pb-2 sm:px-5 sm:pt-5">
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <DialogTitle className="pr-2 text-xl font-bold leading-snug text-zinc-900">
                {displayData?.title || "Không có tiêu đề"}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full bg-[#f5f5f5] text-zinc-500 hover:bg-[#ebebeb] hover:text-zinc-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`h-6 rounded-full px-3 text-[12px] font-semibold border-0 ${!incidentTypes.find(t => String(t.name).toLowerCase() === String(displayData?.type).toLowerCase().trim()) ? getTypeBadgeClass(displayData?.type) : ''}`}
                style={
                  (() => {
                    const typeStr = String(displayData?.type || "").toLowerCase().trim();
                    const typeObj = incidentTypes.find(t => String(t.name).toLowerCase() === typeStr);
                    if (typeObj && typeObj.color) {
                      return {
                        backgroundColor: typeObj.color,
                        color: "#ffffff"
                      };
                    }
                    return {};
                  })()
                }
              >
                {getTypeLabel(displayData?.type)}
              </Badge>
              <Badge
                className={`h-6 rounded-full px-3 text-[12px] font-semibold border-0 ${getStatusBadgeClass(displayData?.status)}`}
              >
                {getStatusLabel(displayData?.status)}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="flex flex-col gap-3 sm:gap-4 px-4 py-4 sm:px-5">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Mã báo cáo
                  </p>
                </div>
                <p className="text-[15px] font-semibold text-zinc-900 pl-8">
                  {displayData?.id || "N/A"}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                    Vị trí
                  </p>
                </div>
                <p className="text-[15px] font-semibold leading-snug text-zinc-900 pl-8">
                  {(() => {
                    const loc = displayData?.location;
                    if (!loc) return "Chưa có vị trí";
                    const match = loc.match(/\(([^)]+)\)/);
                    if (match && match[1]) {
                      const inside = match[1].trim();
                      if (!/^[\d.-]+,\s*[\d.-]+$/.test(inside)) return inside;
                    }
                    if (/^[\d.-]+,\s*[\d.-]+$/.test(loc.trim()))
                      return "Chưa cập nhật địa chỉ cụ thể";
                    return loc;
                  })()}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                    Thời gian
                  </p>
                </div>
                <p className="text-[15px] font-semibold text-zinc-900 pl-8">
                  {displayData?.time || "Chưa có thời gian"}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Mô tả
                  </p>
                </div>
                <div className="ml-8 rounded-[10px] bg-[#f8f9fa] px-4 py-3.5 border border-[#e5e7eb] shadow-sm">
                  <p className="text-[14px] italic leading-relaxed text-zinc-700">
                    {displayData?.description ||
                      "Chưa có mô tả cho báo cáo này."}
                  </p>
                </div>
              </div>

              {displayData?.progressNote && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#166534] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ghi chú từ đội xử
                    lý
                  </p>
                  <div className="rounded-[10px] bg-[#f0fdf4] px-4 py-3.5 border border-[#bbf7d0] mt-0.5">
                    <p className="text-[14px] italic leading-relaxed text-[#166534]">
                      {displayData.progressNote}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col rounded-[10px] bg-[#f8f9fa] p-2 sm:p-3 min-w-0 border border-[#f0f0f0]">
                  <div className="flex items-center text-[14px] font-medium text-[#2563eb] mb-3">
                    <Camera className="mr-2 h-4 w-4" />
                    Ảnh Sự Cố
                  </div>
                  <div className="relative w-full overflow-hidden rounded-[8px] bg-white border border-[#e5e7eb] h-40">
                    {beforeImage ? (
                      <>
                        <img
                          src={beforeImage}
                          alt="Ảnh sự cố"
                          className="absolute inset-0 h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                          onClick={openImageViewerForIncident}
                        />
                        {viewerIncidentImages.length > 1 && (
                          <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white pointer-events-none z-10 backdrop-blur-sm">
                            1 / {viewerIncidentImages.length}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[13px] text-zinc-400">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col rounded-[10px] bg-[#f8f9fa] p-2 sm:p-3 min-w-0 border border-[#f0f0f0]">
                  <div className="flex items-center text-[14px] font-medium text-[#2563eb] mb-3">
                    <Camera className="mr-2 h-4 w-4" />
                    Ảnh Sau Khắc Phục
                  </div>
                  <div className="relative w-full overflow-hidden rounded-[8px] bg-[#e5e7eb] border border-[#e5e7eb] h-40">
                    {showAfterImage ? (
                      <img
                        src={effectiveAfterImage}
                        alt="Ảnh sau khắc phục"
                        className="absolute inset-0 h-full w-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={openImageViewerForAfter}
                        onError={() => setAfterImageFailed(true)}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#e5e7eb]" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="!mx-0 !mb-0 !border-t-0 shrink-0 bg-white px-4 py-3 sm:px-5 flex sm:justify-end">
            <DialogClose asChild>
              <Button className="h-10 w-full sm:w-auto rounded-[8px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-8 text-[14px] font-semibold transition-colors">
                Đóng
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageViewer
        images={allImages}
        initialIndex={imageViewer.index}
        isOpen={imageViewer.open}
        onClose={() => setImageViewer({ open: false, index: 0 })}
      />
    </>
  );
}
