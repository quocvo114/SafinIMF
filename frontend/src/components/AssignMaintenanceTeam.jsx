import React, { useEffect, useMemo, useState } from "react";
import { Check, X, ArchiveIcon, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  BridgeIcon,
  DropIcon,
  LightbulbIcon,
  MapPinSimpleAreaIcon,
  RoadHorizonIcon,
  SignpostIcon,
  TrafficSignalIcon,
  TreeIcon,
  UsersThreeIcon,
  HardHatIcon,
} from "@phosphor-icons/react";

const DEFAULT_TEAMS = [
  {
    id: "traffic-1",
    name: "Đội Giao Thông 1",
    status: "ready",
    statusLabel: "sẵn sàng",
    specialty: "Cầu đường",
    distance: "1.2km",
    cases: 1,
    maxCases: 5,
  },
  {
    id: "traffic-5-electric",
    name: "Đội Giao Thông 5",
    status: "ready",
    statusLabel: "sẵn sàng",
    specialty: "Đèn điện",
    distance: "3.7km",
    cases: 4,
    maxCases: 5,
  },
  {
    id: "traffic-6",
    name: "Đội Giao Thông 6",
    status: "busy",
    statusLabel: "đang bận",
    specialty: "Cầu đường",
    distance: "0.9km",
    cases: 5,
    maxCases: 5,
  },
  {
    id: "traffic-5-drain",
    name: "Đội Giao Thông 5",
    status: "ready",
    statusLabel: "sẵn sàng",
    specialty: "Thoát nước",
    distance: "2.2km",
    cases: 2,
    maxCases: 5,
  },
];

const statusStyle = {
  ready: {
    badge: "bg-[rgb(223,252,234)] text-[#157442] hover:bg-[rgb(223,252,234)]",
  },
  busy: {
    badge: "bg-[rgb(255,233,223)] text-[#BB4D1A] hover:bg-[rgb(255,233,223)]",
  },
};

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .trim();

const REPORT_TYPE_ALIASES = {
  "giao thong": "giao thong",
  dien: "dien",
  "cay xanh": "cay xanh",
  ctcc: "ctcc",
  "cong trinh cong cong": "ctcc",
};

const REPORT_TYPE_SPECIALTIES = {
  "giao thong": ["cau duong", "bien bao", "giao thong"],
  dien: ["den chieu sang", "den tin hieu giao thong", "den dien", "dien"],
  "cay xanh": ["cay bong mat"],
  ctcc: ["thoat nuoc", "cau cong", "via he", "cong trinh cong cong"],
};

const SPECIALTY_ICON_MAP = [
  { match: "cau duong", Icon: BridgeIcon },
  { match: "bien bao", Icon: SignpostIcon },
  { match: "den chieu sang", Icon: LightbulbIcon },
  { match: "den tin hieu", Icon: TrafficSignalIcon },
  { match: "cay bong mat", Icon: TreeIcon },
  { match: "thoat nuoc", Icon: DropIcon },
  { match: "cau cong", Icon: HardHatIcon },
  { match: "via he", Icon: RoadHorizonIcon },
];

const SPECIALTY_TONE_MAP = [
  {
    match: "cau duong",
    iconClass: "text-orange-600",
    textClass: "text-orange-600",
  },
  {
    match: "bien bao",
    iconClass: "text-[#FF9C08]",
    textClass: "text-[#FF9C08]",
  },
  {
    match: "den chieu sang",
    iconClass: "text-[#FFDE08]",
    textClass: "text-[#FDCA00]",
  },
  {
    match: "den tin hieu",
    iconClass: "text-rose-500",
    textClass: "text-rose-500",
  },
  {
    match: "cay bong mat",
    iconClass: "text-[#74C365]",
    textClass: "text-[#74C365]",
  },
  {
    match: "thoat nuoc",
    iconClass: "text-sky-400",
    textClass: "text-sky-400",
  },
  {
    match: "cau cong",
    iconClass: "text-[#B78FF2]",
    textClass: "text-[#B78FF2]",
  },
  {
    match: "via he",
    iconClass: "text-zinc-500",
    textClass: "text-zinc-500 ",
  },
];

const getSpecialtyIcon = (specialty) => {
  const normalized = normalizeText(specialty);
  if (!normalized) return null;
  return (
    SPECIALTY_ICON_MAP.find((item) => normalized.includes(item.match))?.Icon ||
    null
  );
};

const getSpecialtyTone = (specialty) => {
  const normalized = normalizeText(specialty);
  if (!normalized) {
    return { iconClass: "text-zinc-500", textClass: "text-zinc-600" };
  }

  return (
    SPECIALTY_TONE_MAP.find((item) => normalized.includes(item.match)) || {
      iconClass: "text-zinc-500",
      textClass: "text-zinc-600",
    }
  );
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isTeamAtCapacity = (team) => {
  const maxCases = Math.max(toNumber(team?.maxCases, 5), 1);
  const cases = Math.max(toNumber(team?.cases, 0), 0);
  return cases >= maxCases;
};

const isTeamMatchingReportType = (team, reportType) => {
  if (!reportType || normalizeText(reportType) === "all") return true;
  const normalizedSpecialty = normalizeText(team?.specialty || "");
  if (!normalizedSpecialty) return false;

  const normalizedType = normalizeText(reportType);
  const typeKey = REPORT_TYPE_ALIASES[normalizedType] || normalizedType;
  const allowedSpecialties = REPORT_TYPE_SPECIALTIES[typeKey] || [];

  if (allowedSpecialties.length) {
    return allowedSpecialties.some((specialty) =>
      normalizedSpecialty.includes(specialty),
    );
  }

  return (
    normalizedSpecialty.includes(normalizedType) ||
    normalizedType.includes(normalizedSpecialty)
  );
};

const TeamCard = ({ team, selected, onSelect }) => {
  const cases = Math.max(toNumber(team?.cases, 0), 0);
  const maxCases = Math.max(toNumber(team?.maxCases, 5), 1);
  const isAtCapacity = isTeamAtCapacity(team);
  const isSelected = selected;
  const badgeClass = statusStyle[isAtCapacity ? "busy" : "ready"].badge;
  const specialtyLabel = team?.specialty || "Chưa rõ lĩnh vực";
  const SpecialtyIcon = getSpecialtyIcon(team?.specialty);
  const specialtyTone = getSpecialtyTone(team?.specialty);
  const statusLabel = isAtCapacity ? "đang bận" : "sẵn sàng";

  return (
    <button
      type="button"
      onClick={() => onSelect(team.id)}
      className={cn(
        "border-white flex min-h-20 w-full items-center justify-between gap-3 rounded-[20px] bg-[rgb(248,249,251)] p-4 text-left sm:px-5 border-2 transition-colors duration-200",
        isSelected ? "border-[#2562E9] " : "border-transparent",
      )}
    >
      <div className="flex min-w-0 items-center gap-4 sm:gap-[25px]">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[15px] bg-[rgb(233,235,236)]">
          <UsersThreeIcon
            weight="fill"
            color="#3B3B3B"
            className="h-7 w-7"
            strokeWidth={1.9}
          />
        </div>

        <div className="min-w-0 space-y-2 sm:space-y-[15px]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-5">
            <p className="truncate text-[17px] font-semibold text-zinc-900">
              {team.name}
            </p>
            <Badge
              className={cn(
                "rounded-[599px] px-[10px] py-[5px] text-[13px] font-semibold",
                badgeClass,
              )}
            >
              {statusLabel}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-[#3B3B3B] sm:gap-5">
            <span className="flex items-center gap-2">
              {SpecialtyIcon && (
                <SpecialtyIcon
                  weight="fill"
                  className={`h-4 w-4 ${specialtyTone.iconClass}`}
                />
              )}
              <span className={specialtyTone.textClass}>{specialtyLabel}</span>
            </span>
            <MapPinSimpleAreaIcon
              weight="fill"
              className="h-4 w-4 -mr-3"
              strokeWidth={1.9}
            ></MapPinSimpleAreaIcon>
            <span>{team.distance}</span>
            <span className="flex items-center gap-2">
              <ArchiveIcon
                weight="fill"
                className="h-4 w-4 text-[#3B3B3B]"
                strokeWidth={1.9}
              ></ArchiveIcon>
              {cases}/{maxCases} Cases
            </span>
          </div>
        </div>
      </div>

      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isAtCapacity
            ? "bg-zinc-200 text-zinc-500"
            : isSelected
              ? "bg-[#2562E9] text-white"
              : "bg-transparent text-transparent",
        )}
      >
        {isAtCapacity ? (
          <Lock className="h-4 w-4" strokeWidth={2.2} />
        ) : (
          <Check className="h-4 w-4" strokeWidth={2.5} />
        )}
      </span>
    </button>
  );
};

const AssignMaintenanceTeam = ({
  open = false,
  reportCode = "BCGT3101",
  teams = DEFAULT_TEAMS,
  initialSelectedTeamId,
  reportType,
  onClose,
  onAssign,
  onCancel,
  isSubmitting,
  errorMessage,
}) => {
  // Listen for team updates and refresh
  useEffect(() => {
    const handleTeamsChanged = () => {
      // When teams:changed event fires, parent component will re-fetch teams
      // This component will receive updated teams prop automatically
    };
    window.addEventListener("teams:changed", handleTeamsChanged);
    return () => window.removeEventListener("teams:changed", handleTeamsChanged);
  }, []);
  const filteredTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];
    return teams.filter((team) => isTeamMatchingReportType(team, reportType));
  }, [teams, reportType]);

  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    if (!filteredTeams.length) {
      setSelectedTeamId(null);
      return;
    }

    if (initialSelectedTeamId) {
      const matchesInitial = filteredTeams.some(
        (team) => team.id === initialSelectedTeamId,
      );

      if (matchesInitial) {
        setSelectedTeamId(initialSelectedTeamId);
        return;
      }
    }

    setSelectedTeamId((prev) => {
      if (prev && filteredTeams.some((team) => team.id === prev)) {
        return prev;
      }

      return filteredTeams[0]?.id ?? null;
    });
  }, [filteredTeams, initialSelectedTeamId]);

  const selectedTeam = useMemo(
    () => filteredTeams.find((team) => team.id === selectedTeamId) ?? null,
    [filteredTeams, selectedTeamId],
  );

  const isSelectedTeamUnavailable = !selectedTeam;

  const handleAssign = () => {
    if (isSelectedTeamUnavailable) return;
    onAssign?.(selectedTeam);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose?.();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="z-[70] flex max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-[620px] flex-col gap-0 overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-white p-1 shadow-2xl sm:w-[calc(100vw-3rem)] sm:!max-w-[620px]"
      >
        <div className="flex min-h-0 h-full w-full flex-col items-end gap-6 px-4 py-4 sm:gap-[28px] sm:px-5 sm:py-5">
          <DialogHeader className="w-full pb-1">
            <div className="flex w-full items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-xl leading-tight font-bold text-zinc-900 sm:text-2xl">
                  Phân công đội xử lý
                </DialogTitle>
                <DialogDescription className="text-[15px] font-normal text-[#757575] sm:text-base">
                  Chọn đội xử lý cho báo cáo{" "}
                  <span className="font-semibold italic text-[#2562E9]">
                    #{reportCode}
                  </span>
                </DialogDescription>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                className="h-10 w-10 shrink-0 rounded-full border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="min-h-0 w-full flex-1 space-y-4 sm:space-y-5">
            <p className="text-base font-bold leading-none text-zinc-900 sm:text-[14px] uppercase">
              đội ngũ khả dụng
            </p>

            <ScrollArea className="h-[min(46vh,430px)] w-full pr-2 sm:h-[min(50vh,480px)]">
              {filteredTeams.length === 0 ? (
                <div className="rounded-[16px] border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
                  Không có đội xử lý phù hợp.
                </div>
              ) : (
                <div className="space-y-[14px] pr-2 sm:space-y-5">
                  {filteredTeams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      selected={team.id === selectedTeamId}
                      onSelect={setSelectedTeamId}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
            {errorMessage && (
              <div className="mt-2 text-sm text-red-500 font-medium px-4">
                {errorMessage}
              </div>
            )}
          </div>

          <DialogFooter className="mt-auto w-full !border-t border-[#d8dde5] px-0 pt-3 sm:flex-row sm:justify-end sm:gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="h-12 text-sm sm:text-base font-semibold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-700"
            >
              Quay lại
            </Button>

            <Button
              type="button"
              onClick={handleAssign}
              disabled={isSelectedTeamUnavailable || isSubmitting}
              className="h-12 w-full rounded-[14px] bg-[rgba(37,99,235,1)] px-10 text-sm sm:text-base font-semibold text-white hover:bg-[rgb(29,78,216)] sm:w-auto"
            >
              {isSubmitting ? "Đang phân công..." : "Phân công"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignMaintenanceTeam;
