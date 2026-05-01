import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Building2,
  Car,
  CloudSun,
  Folder,
  MapPin,
  Navigation,
  TreePine,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const INCIDENT_ICON_OPTIONS = [
  { key: "car", label: "Giao thông", icon: Car },
  { key: "electric", label: "Điện", icon: Zap },
  { key: "tree", label: "Cây xanh", icon: TreePine },
  { key: "public", label: "Công cộng", icon: Building2 },
  { key: "map", label: "Bản đồ", icon: MapPin },
  { key: "direction", label: "Điều hướng", icon: Navigation },
  { key: "alert", label: "Cảnh báo", icon: AlertCircle },
  { key: "weather", label: "Thời tiết", icon: CloudSun },
  { key: "docs", label: "Tài liệu", icon: BookOpen },
  { key: "folder", label: "Danh mục", icon: Folder },
];

export const INCIDENT_ICON_MAP = INCIDENT_ICON_OPTIONS.reduce((acc, item) => {
  acc[item.key] = item.icon;
  return acc;
}, {});

export const INCIDENT_COLOR_OPTIONS = [
  "#f97316",
  "#fdca00",
  "#74c365",
  "#b78ff2",
  "#06b6d4",
  "#ef4444",
];

const POPUP_WIDTH = 626;
const POPUP_HEIGHT = 850;

const IncidentTypePopup = ({
  open,
  title = "Thêm/sửa loại sự cố",
  subtitle = "Cập nhật thông tin chi tiết cho danh mục hạ tầng",
  submitLabel = "Lưu thay đổi",
  name,
  description,
  selectedIcon,
  selectedColor,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onColorChange,
  onClose,
  onSubmit,
  isSaving = false,
}) => {
  const [popupScale, setPopupScale] = useState(1);

  useEffect(() => {
    if (!open) return;

    const updateScale = () => {
      const viewportWidth = window.innerWidth - 16;
      const viewportHeight = window.innerHeight - 16;
      const scaleByWidth = viewportWidth / POPUP_WIDTH;
      const scaleByHeight = viewportHeight / POPUP_HEIGHT;
      const nextScale = Math.min(1, scaleByWidth, scaleByHeight);

      setPopupScale(nextScale > 0 ? nextScale : 0.75);
    };

    updateScale();
    window.addEventListener("resize", updateScale);

    return () => window.removeEventListener("resize", updateScale);
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        className="flex h-[850px] w-[626px] max-w-none flex-col overflow-hidden rounded-[15px] border-0 bg-white p-0"
        style={{ transform: `translate(-50%, -50%) scale(${popupScale})` }}
      >
        <DialogHeader className="flex min-h-[100px] flex-row items-center justify-between bg-blue-600 px-8 py-5 text-white">
          <div className="min-w-0">
            <DialogTitle className="text-[28px] font-semibold leading-tight text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-blue-100">
              {subtitle}
            </DialogDescription>
          </div>

          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={18} />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-5 px-7 py-6">
          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-800">
              Tên loại sự cố
            </Label>
            <Input
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Nhập tên loại sự cố"
              className="h-[52px] rounded-[15px] border-gray-200 px-5"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium text-gray-800">Mô tả</Label>
            <Textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Nhập mô tả"
              className="h-[82px] resize-none rounded-[15px] border-gray-200 px-5 py-3"
            />
          </div>

          <div>
            <Label className="mb-3 block text-base font-semibold text-gray-800">
              Biểu tượng nhận diện
            </Label>
            <div className="rounded-[25px] bg-gray-100 p-3">
              <div className="grid grid-cols-5 gap-3">
                {INCIDENT_ICON_OPTIONS.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  const active = selectedIcon === iconOption.key;

                  return (
                    <Button
                      key={iconOption.key}
                      type="button"
                      variant="outline"
                      onClick={() => onIconChange(iconOption.key)}
                      className={cn(
                        "h-[82px] rounded-[15px] border bg-white text-gray-600 hover:bg-white",
                        active
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent hover:border-gray-200",
                      )}
                    >
                      <IconComponent size={26} />
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-3 block text-base font-medium text-gray-800">
              Màu sắc chủ đạo
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              {INCIDENT_COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onColorChange(color)}
                  className={cn(
                    "h-[44px] w-[44px] rounded-full border-2 transition-all",
                    selectedColor === color
                      ? "border-blue-500 ring-2 ring-blue-200"
                      : "border-white ring-1 ring-gray-200 hover:ring-gray-300",
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-auto grid grid-cols-2 gap-3 px-7 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="h-[54px] rounded-[10px] border-gray-300 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            hủy
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!name.trim() || isSaving}
            className="h-[54px] rounded-[10px] bg-blue-600 text-base font-medium text-white hover:bg-blue-700"
          >
            {isSaving ? "Đang lưu..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default IncidentTypePopup;
