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

function resolveImage(data, index) {
  const imageCandidate =
    data && Array.isArray(data.images) ? data.images[index] : "";

  if (typeof imageCandidate === "string") {
    const normalizedCandidate = imageCandidate.trim().toLowerCase();
    if (
      normalizedCandidate &&
      normalizedCandidate !== "null" &&
      normalizedCandidate !== "undefined"
    ) {
      return imageCandidate;
    }
  } else if (imageCandidate) {
    return imageCandidate;
  }

  if (data && index === 0 && data.image) {
    if (typeof data.image === "string") {
      const normalizedSingleImage = data.image.trim().toLowerCase();
      if (
        normalizedSingleImage &&
        normalizedSingleImage !== "null" &&
        normalizedSingleImage !== "undefined"
      ) {
        return data.image;
      }
    } else {
      return data.image;
    }
  }

  return "";
}

export default function ReportDetail({ data, close }) {
  const isOpen = Boolean(data);

  if (!isOpen) return null;

  const beforeImage = resolveImage(data, 0);
  const afterImage = resolveImage(data, 1);
  const [afterImageFailed, setAfterImageFailed] = useState(false);
  const [imageViewer, setImageViewer] = useState({ open: false, index: 0 });

  const allImages = [beforeImage, afterImage].filter(Boolean);

  const openImageViewer = (index) => {
    setImageViewer({ open: true, index });
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
          className="z-[60] flex max-h-[90vh] w-[min(92vw,760px)] flex-col gap-0 overflow-hidden rounded-[18px] border border-[#d8e6ff] bg-white p-0 shadow-2xl sm:w-[min(88vw,760px)] sm:max-w-[760px]"
        >
        <DialogHeader className="rounded-t-[18px] bg-white px-4 pt-3 sm:px-5 sm:pt-4 md:px-6 md:pt-4">
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

        <Separator className="mt-2 bg-[#dbe8ff]" />

        <ScrollArea className="max-h-[calc(90vh-170px)] px-4 py-3 sm:px-5 md:px-6">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-3">
              <div className="rounded-[12px] border border-[#dce9ff] bg-[#edf5ff] px-3 py-2 sm:px-3.5 sm:py-2.5">
                <p className="text-[11px] font-medium uppercase text-[#A3A3A3]">
                  Mã báo cáo
                </p>
                <p className="text-xl font-semibold leading-tight text-[#1E67D6]">
                  {data.id || "N/A"}
                </p>
              </div>

              <div className="rounded-[12px] border border-[#e6e6dc] bg-[#fff9ea] px-3 py-2 sm:px-3.5 sm:py-2.5">
                <p className="text-[11px] font-medium uppercase text-[#A3A3A3]">
                  Thời gian
                </p>
                <p className="text-sm font-semibold leading-tight text-zinc-900">
                  {data.time || "Chua co thoi gian"}
                </p>
              </div>
            </div>

            <div className="rounded-[12px] border border-[#e4ecfb] bg-[#f7faff] px-3 py-2.5 sm:px-3.5 sm:py-3">
              <p className="text-[11px] font-medium uppercase text-[#A3A3A3]">
                Vị trí
              </p>
              <p
                className="text-sm font-semibold leading-tight text-zinc-900"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {(() => {
                  const loc = data.location;
                  if (!loc) return "Chưa có vị trí";
                  const match = loc.match(/\(([^)]+)\)/);
                  if (match && match[1]) {
                    const inside = match[1].trim();
                    if (!/^[\d.-]+,\s*[\d.-]+$/.test(inside)) return inside;
                  }
                  if (/^[\d.-]+,\s*[\d.-]+$/.test(loc.trim())) return "Chưa cập nhật địa chỉ cụ thể";
                  return loc;
                })()}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[11px] font-medium uppercase text-[#A3A3A3]">
                Mô tả
              </p>
              <div className="rounded-[10px] border border-[#e4ecfb] bg-[#f5f9ff] px-3 py-2.5 sm:px-3.5 sm:py-3">
                <p
                  className="text-xs italic leading-snug text-zinc-700"
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

            <div className="grid gap-3 md:grid-cols-2">
              <Card className="gap-0 rounded-[12px] border border-[#dce9ff] bg-[#f6faff] py-0 ring-0 shadow-sm">
                <CardHeader className="px-3 pb-1 pt-2 sm:px-3.5 sm:pt-2.5">
                  <CardTitle className="flex text-xs font-medium text-[#1E67D6]">
                    <Camera className="mr-1.5 h-4 w-4 text-[#1E67D6]" />
                    Ảnh sự cố
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2.5 sm:px-3.5 sm:pb-3">
                  <div className="mx-auto aspect-[16/9] w-full max-h-[190px] overflow-hidden rounded-[10px] bg-white">
                    {beforeImage ? (
                      <img
                        src={beforeImage}
                        alt="Anh su co"
                        className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer(0)}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-zinc-400 sm:text-sm">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-[12px] border border-[#dce9ff] bg-[#f6faff] py-0 ring-0 shadow-sm">
                <CardHeader className="px-3 pb-1 pt-2 sm:px-3.5 sm:pt-2.5">
                  <CardTitle className="flex text-xs font-medium text-[#1E67D6]">
                    <Camera className="mr-1.5 h-4 w-4 text-[#1E67D6]" />
                    Ảnh sau khắc phục
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2.5 sm:px-3.5 sm:pb-3">
                  <div className="mx-auto aspect-[16/9] w-full max-h-[190px] overflow-hidden rounded-[10px] bg-[#f2f2f2]">
                    {showAfterImage ? (
                      <img
                        src={afterImage}
                        alt="Anh sau khac phuc"
                        className="h-full w-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer(allImages.indexOf(afterImage))}
                        onError={() => setAfterImageFailed(true)}
                      />
                    ) : (
                      <Skeleton className="h-full w-full rounded-[10px] bg-zinc-200/60" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="!mx-0 !mb-0 !border-t-0 shrink-0 bg-white px-4 py-2.5 sm:px-5 md:px-6">
          <DialogClose asChild>
            <Button className="h-9 w-full rounded-[10px] bg-[#2562e9] text-sm font-semibold text-white hover:bg-[#1f56d1] sm:h-10 sm:w-[160px]">
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
