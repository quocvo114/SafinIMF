import { useEffect, useState } from "react";
import { Camera, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import ImageViewer from "./ImageViewer";

function getTypeLabel(type) {
  if (!type) return "khac";
  return String(type);
}

function normalizeTypeKey(type) {
  return String(type || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function getTypeBadgeClass(type) {
  const normalizedType = normalizeTypeKey(type);

  if (normalizedType === "giao thong") {
    return "bg-[#F97316] text-white hover:bg-[#F97316]";
  }

  if (normalizedType === "dien") {
    return "bg-[#FDCA00] text-white hover:bg-[#FDCA00]";
  }

  if (normalizedType === "cay xanh") {
    return "bg-[#74C365] text-white hover:bg-[#74C365]";
  }

  if (normalizedType === "ctcc" || normalizedType === "cong trinh cong cong") {
    return "bg-[#B78FF2] text-white hover:bg-[#B78FF2]";
  }

  return "bg-orange-500 text-white hover:bg-orange-500";
}

function getStatusLabel(status) {
  if (!status) return "dang cho";
  return String(status);
}

function getIncidentImages(data) {
  if (!data) return [];
  let imgs = [];
  if (Array.isArray(data.images) && data.images.length > 0) {
    imgs = data.images;
  } else if (data.image) {
    imgs = [data.image];
  }
  return imgs.filter((img) => {
    if (!img) return false;
    if (typeof img === "string") {
      const lower = img.trim().toLowerCase();
      if (lower === "null" || lower === "undefined" || lower === "")
        return false;
    }
    return true;
  });
}

export default function ReportDetail({ data, close }) {
  const isOpen = Boolean(data);

  if (!isOpen) return null;

  const incidentImages = getIncidentImages(data);
  const beforeImage = incidentImages.length > 0 ? incidentImages[0] : "";
  const afterImage =
    data.afterImg &&
    typeof data.afterImg === "string" &&
    data.afterImg.trim().toLowerCase() !== "null"
      ? data.afterImg
      : "";

  const [afterImageFailed, setAfterImageFailed] = useState(false);
  const [imageViewer, setImageViewer] = useState({
    open: false,
    index: 0,
    list: [],
  });

  const openImageViewer = (index, list) => {
    setImageViewer({ open: true, index, list });
  };

  useEffect(() => {
    setAfterImageFailed(false);
  }, [afterImage]);

  const showAfterImage = Boolean(afterImage) && !afterImageFailed;

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
          className="z-[60] flex max-h-[90vh] w-[min(96vw,600px)] flex-col gap-0 overflow-hidden rounded-[18px] border border-[#d8e6ff] bg-white p-0 shadow-2xl sm:w-[min(90vw,600px)] sm:max-w-[600px]"
        >
          <DialogHeader className="shrink-0 rounded-t-[18px] bg-white px-4 pt-3 pb-2 sm:px-5 sm:pt-4 md:px-6 md:pt-4">
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="pr-2 text-base font-semibold leading-snug text-zinc-900 sm:text-lg lg:text-xl">
                {data.title || "Khong co tieu de"}
              </DialogTitle>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full bg-[#f5f5f5] text-zinc-600 hover:bg-[#ebebeb] sm:h-9 sm:w-9"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={`h-7 rounded-full px-3 text-xs font-semibold ${getTypeBadgeClass(data.type)}`}
              >
                {getTypeLabel(data.type)}
              </Badge>
              <Badge className="h-7 rounded-full bg-[#d5d5d5] px-3 text-xs font-semibold text-zinc-800 hover:bg-[#d5d5d5]">
                {getStatusLabel(data.status)}
              </Badge>
            </div>
          </DialogHeader>

          <Separator className="bg-[#dbe8ff] shrink-0" />

          <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5 md:px-6 min-h-0 custom-scrollbar">
            <div className="flex flex-col gap-2.5">
              <div className="grid gap-2 sm:grid-cols-2 md:gap-3">
                <div className="rounded-[10px] border border-[#dce9ff] bg-[#edf5ff] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#8898b5] tracking-wide mb-0.5">
                    Mã báo cáo
                  </p>
                  <p className="text-[15px] font-bold leading-tight text-[#1E67D6] truncate">
                    {data.id || "N/A"}
                  </p>
                </div>

                <div className="rounded-[10px] border border-[#e6e6dc] bg-[#fff9ea] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#b3b092] tracking-wide mb-0.5">
                    Thời gian
                  </p>
                  <p className="text-[13px] font-semibold leading-tight text-zinc-900 truncate">
                    {data.time || "Chua co thoi gian"}
                  </p>
                </div>
              </div>

              <div className="rounded-[10px] border border-[#e4ecfb] bg-[#f7faff] px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-[#8898b5] tracking-wide mb-0.5">
                  Vị trí
                </p>
                <p className="text-[13px] font-semibold leading-tight text-zinc-900 truncate">
                  {(() => {
                    const loc = data.location;
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

              <div>
                <p className="mb-1 text-[10px] font-bold uppercase text-[#8898b5] tracking-wide px-1">
                  Mô tả
                </p>
                <div className="rounded-[10px] border border-[#e4ecfb] bg-[#f5f9ff] px-3 py-2.5">
                  <p
                    className="text-[13px] italic leading-snug text-zinc-700"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {data.description || "Chua co mo ta cho bao cao nay."}
                  </p>
                </div>
              </div>

              {data.progressNote && (
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase text-green-700 tracking-wide px-1">
                    Ghi chú từ đội xử lý
                  </p>
                  <div className="rounded-[10px] border border-green-100 bg-green-50 px-3 py-2.5">
                    <p className="text-[13px] italic leading-snug text-green-800">
                      {data.progressNote}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col rounded-[12px] border border-[#dce9ff] bg-[#f6faff] p-2 shadow-sm">
                  <div className="mb-1.5 flex items-center px-1 text-[11px] font-bold uppercase tracking-wide text-[#1E67D6]">
                    <Camera className="mr-1.5 h-3.5 w-3.5 text-[#1E67D6]" />
                    Ảnh sự cố
                  </div>
                  <div className="w-full h-[150px] overflow-hidden rounded-[8px] bg-white border border-[#e2e8f0]">
                    {beforeImage ? (
                      <img
                        src={beforeImage}
                        alt="Anh su co"
                        className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer(0, incidentImages)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col rounded-[12px] border border-[#dce9ff] bg-[#f6faff] p-2 shadow-sm">
                  <div className="mb-1.5 flex items-center px-1 text-[11px] font-bold uppercase tracking-wide text-[#1E67D6]">
                    <Camera className="mr-1.5 h-3.5 w-3.5 text-[#1E67D6]" />
                    Ảnh sau khắc phục
                  </div>
                  <div className="w-full h-[150px] overflow-hidden rounded-[8px] bg-[#f2f2f2] border border-[#e2e8f0]">
                    {showAfterImage ? (
                      <img
                        src={afterImage}
                        alt="Anh sau khac phuc"
                        className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer(0, [afterImage])}
                        onError={() => setAfterImageFailed(true)}
                      />
                    ) : (
                      <Skeleton className="h-full w-full rounded-[8px] bg-zinc-200/60" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="shrink-0 bg-white px-4 py-3 sm:px-5 md:px-6 border-t border-[#e2e8f0]">
            <DialogClose asChild>
              <Button className="h-10 sm:h-11 w-full rounded-xl bg-blue-600 text-white font-bold text-sm sm:text-base hover:bg-blue-700 transition-all flex items-center justify-center shadow-sm">
                Đóng
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <ImageViewer
        images={imageViewer.list}
        initialIndex={imageViewer.index}
        isOpen={imageViewer.open}
        onClose={() => setImageViewer({ open: false, index: 0, list: [] })}
      />
    </>
  );
}
