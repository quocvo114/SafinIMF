import { useEffect, useState } from "react";
import {
  Camera,
  CircleDot,
  Clock3,
  Hash,
  MapPin,
  RefreshCcw,
  Send,
  Users,
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import ImageViewer from "./ImageViewer";
import LocationMapInline from "./LocationMapInline";

import incidentApi from "../services/api/incidentApi";
import { reportApi } from "../services/api/reportApi";

function normalizeTypeKey(type) {
  return String(type || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function isValidImage(value) {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return Boolean(
    normalized && normalized !== "null" && normalized !== "undefined",
  );
}

function getStatusValueClass(status) {
  const normalizedStatus = normalizeTypeKey(status);

  if (normalizedStatus === "dang cho") {
    return "text-[#3B3B3B]";
  }

  if (normalizedStatus === "dang xu ly") {
    return "text-[#FDCA00]";
  }

  if (normalizedStatus === "da giai quyet" || normalizedStatus === "da xu ly") {
    return "text-[#74C200]";
  }

  if (normalizedStatus === "da hoan tat") {
    return "text-[#74C200]";
  }

  return "text-zinc-800";
}

function getIconToneClass(tone = "blue") {
  if (tone === "status-waiting") {
    return "bg-[#E9EBEC] text-[#3B3B3B]";
  }

  if (tone === "status-processing") {
    return "bg-[#FDCA00] text-[#FFF242]";
  }

  if (tone === "status-resolved") {
    return "bg-[#74C200] text-[#B0FF3B]";
  }

  if (tone === "status-error") {
    return "bg-[#FEE2E2] text-[#EF4444]";
  }

  if (tone === "status-warning") {
    return "bg-[#FFEDD5] text-[#F97316]";
  }

  return "bg-[#DCEEFF] text-[#3B82F6]";
}

function getStatusIconTone(status) {
  const normalizedStatus = normalizeTypeKey(status);

  if (normalizedStatus === "dang cho") {
    return "status-waiting";
  }

  if (normalizedStatus === "dang xu ly") {
    return "status-processing";
  }

  if (normalizedStatus === "da giai quyet" || normalizedStatus === "da xu ly") {
    return "status-resolved";
  }

  if (normalizedStatus === "da hoan tat") {
    return "status-resolved";
  }

  return "status-waiting";
}

function getConfidenceColorClass(score) {
  if (score === null || score === undefined) return "text-zinc-500";
  if (score >= 80) return "text-[#65a30d]"; // Green
  if (score >= 70) return "text-[#eab308]"; // Yellow
  if (score >= 50) return "text-[#f97316]"; // Orange
  return "text-[#ef4444]"; // Red
}

function getConfidenceIconTone(score) {
  if (score === null || score === undefined) return "status-waiting";
  if (score >= 80) return "status-resolved";
  if (score >= 70) return "status-processing";
  if (score >= 50) return "status-warning";
  return "status-error";
}

function getConfidenceValue(score, details) {
  if (score === null || score === undefined) return "Chưa đánh giá";
  const level = details?.level || "";
  return `${score}% ${level ? `- ${level}` : ""}`;
}

function InfoBlock({
  icon: Icon,
  label,
  value,
  valueClassName = "",
  iconTone = "blue",
  className = "",
  onClick,
  meta,
}) {
  const normalizedValue = value || "Chưa có dữ liệu";
  const metaNode = meta ? (
    typeof meta === "string" ? (
      <p className="mt-0.5 text-[10px] font-medium text-zinc-500">{meta}</p>
    ) : (
      <div className="mt-0.5">{meta}</div>
    )
  ) : null;

  return (
    <div className={`flex items-center gap-2.5 ${className}`} onClick={onClick}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${getIconToneClass(iconTone)}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        <p
          className={`mt-0.5 break-words text-[13px] font-semibold leading-tight text-zinc-900 truncate ${valueClassName}`}
        >
          {normalizedValue}
        </p>
        {metaNode}
      </div>
    </div>
  );
}

function formatLocationDisplay(loc) {
  if (!loc) return "Chưa có vị trí";
  // Extract content inside parentheses: "lat, lng (Address)" -> "Address"
  const match = loc.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    const inside = match[1].trim();
    // Check if the inside part is just another coordinate pair
    if (!/^[\d.-]+,\s*[\d.-]+$/.test(inside)) {
      return inside;
    }
  }
  // If no parentheses, but starts with coordinates: "lat, lng"
  if (/^[\d.-]+,\s*[\d.-]+$/.test(loc.trim())) {
    return "Đang chờ cập nhật địa chỉ..."; // Or just return the coordinates if needed
  }
  return loc;
}

function ConfidenceScoreWidget({ score, details }) {
  const hasScore = score !== null && score !== undefined;

  const levelConfig = (() => {
    if (!hasScore)
      return {
        color: "text-zinc-400",
        bg: "bg-zinc-100",
        border: "border-zinc-200",
        label: "Chưa đánh giá",
      };
    if (score >= 90)
      return {
        color: "text-[#15803d]",
        bg: "bg-[#dcfce7]",
        border: "border-[#86efac]",
        label: "Rất tin cậy",
      };
    if (score >= 80)
      return {
        color: "text-[#166534]",
        bg: "bg-[#f0fdf4]",
        border: "border-[#bbf7d0]",
        label: "Tin cậy cao",
      };
    if (score >= 70)
      return {
        color: "text-[#854d0e]",
        bg: "bg-[#fefce8]",
        border: "border-[#fef08a]",
        label: "Tin cậy TB",
      };
    if (score >= 50)
      return {
        color: "text-[#9a3412]",
        bg: "bg-[#fff7ed]",
        border: "border-[#fdba74]",
        label: "Tin cậy thấp",
      };
    return {
      color: "text-[#991b1b]",
      bg: "bg-[#fef2f2]",
      border: "border-[#fca5a5]",
      label: "Không đủ tin cậy",
    };
  })();

  const ScoreIcon = !hasScore
    ? Shield
    : score >= 80
      ? ShieldCheck
      : score >= 50
        ? Shield
        : ShieldAlert;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border ${levelConfig.border} ${levelConfig.bg} px-3 py-2 h-full`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${levelConfig.bg} ${levelConfig.color}`}
      >
        <ScoreIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider text-zinc-500`}
          >
            Điểm tin cậy báo cáo
          </span>
          {hasScore && (
            <span className={`text-sm font-black ${levelConfig.color}`}>
              {score}%
            </span>
          )}
        </div>
        <span className={`text-xs font-semibold ${levelConfig.color}`}>
          {levelConfig.label}
        </span>
      </div>
      {hasScore && (
        <div className="w-16 h-1.5 rounded-full bg-zinc-200 overflow-hidden shrink-0">
          <div
            className={`h-full rounded-full ${levelConfig.color.replace("text-", "bg-")}`}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function ReportDetailQLKV({
  data,
  close,
  onUpdateStatus,
  onSendProcess,
}) {
  const [showAIModal, setShowAIModal] = useState(false);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const isOpen = Boolean(data);
  const [afterImageFailed, setAfterImageFailed] = useState(false);
  const [imageViewer, setImageViewer] = useState({ open: false, index: 0 });
  const [clusterPeers, setClusterPeers] = useState([]);
  const [clusterPeersLoading, setClusterPeersLoading] = useState(false);

  const incidentImages = Array.isArray(data?.images)
    ? data.images.filter((img) => isValidImage(img))
    : [];

  const beforeImage =
    incidentImages[0] ||
    (isValidImage(data?.image) ? data.image : "") ||
    (isValidImage(data?.imageUrl) ? data.imageUrl : "") ||
    "";

  const afterImage =
    (isValidImage(data?.afterImg) ? data.afterImg : "") ||
    (isValidImage(data?.after_img) ? data.after_img : "") ||
    (isValidImage(data?.afterImage) ? data.afterImage : "") ||
    "";

  const normalizedBeforeImage =
    typeof beforeImage === "string" ? beforeImage.trim() : "";
  const normalizedAfterImage =
    typeof afterImage === "string" ? afterImage.trim() : "";
  const effectiveAfterImage =
    normalizedBeforeImage && normalizedAfterImage === normalizedBeforeImage
      ? ""
      : afterImage;

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

  useEffect(() => {
    let isActive = true;

    const fetchClusterPeers = async () => {
      if (!isOpen || !data) {
        if (isActive) {
          setClusterPeers([]);
          setClusterPeersLoading(false);
        }
        return;
      }

      if (data.clusterSourceId) {
        if (isActive) {
          setClusterPeers([]);
          setClusterPeersLoading(false);
        }
        return;
      }

      const reportId = data?.id || data?.report_id || data?._id;
      if (!reportId) {
        return;
      }

      setClusterPeersLoading(true);
      try {
        const response = await reportApi.getClusterPeers(reportId);
        const peers = Array.isArray(response?.data?.peers)
          ? response.data.peers
          : [];
        if (isActive) {
          setClusterPeers(peers);
        }
      } catch (error) {
        if (isActive) {
          setClusterPeers([]);
        }
      } finally {
        if (isActive) {
          setClusterPeersLoading(false);
        }
      }
    };

    fetchClusterPeers();

    return () => {
      isActive = false;
    };
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const viewerIncidentImages =
    incidentImages.length > 0
      ? incidentImages
      : beforeImage
        ? [beforeImage]
        : [];

  const showAfterImage = Boolean(effectiveAfterImage) && !afterImageFailed;

  const hasAfterInIncidentImages = showAfterImage
    ? viewerIncidentImages.some(
        (img) =>
          typeof img === "string" &&
          img.trim() === String(effectiveAfterImage).trim(),
      )
    : false;

  const allImages =
    showAfterImage && !hasAfterInIncidentImages
      ? [...viewerIncidentImages, effectiveAfterImage]
      : [...viewerIncidentImages];

  const afterImageIndex = showAfterImage
    ? allImages.findIndex(
        (img) => String(img).trim() === String(effectiveAfterImage).trim(),
      )
    : -1;

  const openImageViewer = (index) => {
    setImageViewer({ open: true, index });
  };

  // Parse lat/lng from report
  const parseCoord = (value, min, max) => {
    const num = Number(value);
    return Number.isFinite(num) && num >= min && num <= max ? num : null;
  };

  const reportLat =
    parseCoord(data?.lat ?? data?.reportLatitude, -90, 90) ??
    (() => {
      const m = String(data?.location || "").match(
        /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
      );
      return m ? parseCoord(m[1], -90, 90) : null;
    })();

  const reportLng =
    parseCoord(data?.lng ?? data?.reportLongitude, -180, 180) ??
    (() => {
      const m = String(data?.location || "").match(
        /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/,
      );
      return m ? parseCoord(m[2], -180, 180) : null;
    })();

  const displayLocation = formatLocationDisplay(data.location);

  const statusValueClass = getStatusValueClass(data.status);
  const statusIconTone = getStatusIconTone(data.status);
  const issueTitle = data.issueTitle || data.title || "Chưa có tiêu đề";
  const teamName =
    data.assignedTeamName ||
    data.handlingTeamName ||
    data.team ||
    data.handlerTeam ||
    "Chưa phân công";
  const clusterSourceId = data.clusterSourceId
    ? String(data.clusterSourceId)
    : "";
  const assignedTeamNote = clusterSourceId
    ? `Phụ trách qua báo cáo #${clusterSourceId}`
    : "";
  const normalizedStatus = normalizeTypeKey(data.status);
  const isResolved =
    normalizedStatus === "da hoan tat" || normalizedStatus === "da giai quyet" || normalizedStatus === "da xu ly";
  const hasAssignedTeam = Boolean(
    data?.assignedTeamId ||
    data?.assignedTeamName ||
    data?.team ||
    data?.handlerTeam,
  );
  const isAssignBlocked = isResolved || hasAssignedTeam;
  const assignLabel = isResolved
    ? "Đã giải quyết"
    : hasAssignedTeam
      ? "Đã phân công"
      : "Gửi xử lý";

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && close?.()}>
        <DialogContent
          showCloseButton={false}
          className="z-[70] flex h-[88vh] max-h-[850px] w-[calc(100vw-1.5rem)] max-w-[660px] flex-col gap-0 overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-[#f3f4f6] p-0 shadow-2xl sm:w-[calc(100vw-3rem)] sm:!max-w-[660px]"
        >
          <DialogHeader className="flex items-center justify-between flex-row px-6 pt-5 pb-3 border-b border-[#d8dde5] shrink-0">
            <DialogTitle className="text-xl font-bold leading-tight text-zinc-900">
              Chi tiết báo cáo
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-full bg-[#ebebeb] text-zinc-500 hover:bg-zinc-200"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3.5">
            <div className="flex flex-col gap-2.5 h-full">
              {/* Type + Title */}
              <div>
                {(() => {
                  const typeObj = incidentTypes.find(
                    (t) => t.name === data.type,
                  );
                  const badgeStyle =
                    typeObj && typeObj.color
                      ? { backgroundColor: typeObj.color, color: "#fff" }
                      : { backgroundColor: "#f97316", color: "#fff" };

                  return (
                    <Badge
                      variant="secondary"
                      className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold leading-none"
                      style={badgeStyle}
                    >
                      {data.type || "Khác"}
                    </Badge>
                  );
                })()}
                <h3 className="mt-1.5 text-lg font-bold leading-snug text-[#3D3D3D]">
                  {issueTitle}
                </h3>
              </div>

              {/* Description */}
              {data.description && data.description.trim() && (
                <div className="rounded-xl bg-white p-3 border border-gray-200">
                  <p className="text-sm italic leading-relaxed text-zinc-600">
                    {data.description}
                  </p>
                </div>
              )}

              {clusterSourceId && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800">
                        Báo cáo này được tự động cập nhật theo báo cáo
                        {` #${clusterSourceId}`} (cùng cụm).
                      </p>
                      {data.clusterSyncNote && (
                        <p className="mt-1 text-[11px] text-blue-700">
                          {data.clusterSyncNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!clusterSourceId && clusterPeersLoading && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs font-semibold text-emerald-700">
                    Đang tải danh sách báo cáo đã đồng bộ...
                  </p>
                </div>
              )}

              {!clusterSourceId &&
                !clusterPeersLoading &&
                clusterPeers.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <div>
                        <p className="text-xs font-semibold text-emerald-800">
                          Báo cáo này là chuẩn của cụm — đã đồng bộ cho
                          {` ${clusterPeers.length}`} báo cáo liên quan:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {clusterPeers.map((peer) => {
                            const peerId =
                              peer?.id || peer?.report_id || peer?._id || "";
                            if (!peerId) {
                              return null;
                            }
                            return (
                              <span
                                key={String(peerId)}
                                className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
                              >
                                #{peerId}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Info Grid 2x2 compact */}
              <div className="grid grid-cols-2 gap-2">
                <InfoBlock
                  icon={Hash}
                  label="Mã BC"
                  value={data.id}
                  valueClassName="text-[#2563EB]"
                />
                <LocationMapInline
                  lat={reportLat}
                  lng={reportLng}
                  address={displayLocation}
                  title={issueTitle}
                >
                  <InfoBlock
                    icon={MapPin}
                    label="Vị trí"
                    value={displayLocation}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  />
                </LocationMapInline>
                <InfoBlock icon={Clock3} label="Thời gian" value={data.time} />
                <InfoBlock
                  icon={CircleDot}
                  label="Trạng thái"
                  value={data.status || "Đang chờ"}
                  valueClassName={statusValueClass}
                  iconTone={statusIconTone}
                />
                <div className="col-span-2 grid grid-cols-2 gap-2 mt-1">
                  <InfoBlock
                    icon={Users}
                    label="Đội phụ trách"
                    value={teamName}
                    meta={assignedTeamNote}
                    className="h-full"
                  />
                  <div className="h-full">
                    <ConfidenceScoreWidget
                      score={data.confidenceScore}
                      details={data.scoringDetails}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Note */}
              {data.progressNote && (
                <div className="rounded-xl bg-white p-3 border border-gray-200">
                  <p className="text-sm italic leading-relaxed text-zinc-600">
                    <span className="font-semibold text-zinc-800">
                      Ghi chú của đội xử lý:{" "}
                    </span>
                    {data.progressNote}
                  </p>
                </div>
              )}

              {/* Photos - flexible height row */}
              <div className="grid grid-cols-2 gap-2 flex-1 min-h-[200px]">
                <div className="flex flex-col bg-[#ececef] rounded-xl p-2.5 overflow-hidden h-full">
                  <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
                    <Camera className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-zinc-900">
                      Ảnh Sự Cố
                    </span>
                  </div>
                  <div className="flex-1 rounded-lg overflow-hidden bg-[#dcdcdf] min-h-0">
                    {beforeImage ? (
                      <img
                        src={beforeImage}
                        alt="Ảnh sự cố"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openImageViewer(0)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col bg-[#ececef] rounded-xl p-2.5 overflow-hidden h-full">
                  <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
                    <Camera className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-600">
                      Ảnh Khắc Phục
                    </span>
                  </div>
                  <div className="flex-1 rounded-lg overflow-hidden bg-[#dcdcdf] min-h-0">
                    {showAfterImage ? (
                      <img
                        src={effectiveAfterImage}
                        alt="Ảnh khắc phục"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() =>
                          openImageViewer(
                            afterImageIndex >= 0 ? afterImageIndex : 0,
                          )
                        }
                        onError={() => setAfterImageFailed(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-zinc-400">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="!mx-0 !mb-0 !border-t border-[#d8dde5] shrink-0 items-center justify-end gap-2.5 px-6 py-4 sm:flex-row">
            <Button
              variant="outline"
              className="h-10 w-full rounded-[10px] border-[#b8bcc5] bg-[#f7f7f8] px-5 text-sm font-semibold text-[#2f64da] hover:bg-[#eceef2] sm:h-11 sm:w-auto sm:text-base"
              onClick={() => onUpdateStatus?.(data)}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Cập nhật trạng thái
            </Button>
            <Button
              className="h-10 w-full rounded-[10px] bg-[#2f64da] px-7 text-sm font-semibold text-white hover:bg-[#2555c7] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:w-auto sm:text-base"
              onClick={() => onSendProcess?.(data)}
              disabled={isAssignBlocked}
            >
              {assignLabel}
              <Send className="ml-2 h-4 w-4" />
            </Button>
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