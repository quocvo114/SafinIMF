import React, { useEffect, useMemo, useState } from "react";
import { Check, Wrench, X, Navigation, ArchiveIcon, Lock } from "lucide-react";
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
    .trim();

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
  if (!reportType || reportType === "all") return true;
  const normalizedReportType = normalizeText(reportType);
  const normalizedSpecialty = normalizeText(team?.specialty || "");
  if (!normalizedReportType || !normalizedSpecialty) return false;
  return (
    normalizedSpecialty.includes(normalizedReportType) ||
    normalizedReportType.includes(normalizedSpecialty)
  );
};

const TeamCard = ({ team, selected, onSelect }) => {
  const cases = Math.max(toNumber(team?.cases, 0), 0);
  const maxCases = Math.max(toNumber(team?.maxCases, 5), 1);
  const isAtCapacity = isTeamAtCapacity(team);
  const isSelected = selected && !isAtCapacity;
  const badgeClass = statusStyle[isAtCapacity ? "busy" : "ready"].badge;
  const specialtyLabel = team?.specialty || "Chưa rõ lĩnh vực";
  const statusLabel = isAtCapacity ? "đang bận" : "sẵn sàng";

  return (
    <button
      type="button"
      onClick={() => {
        if (!isAtCapacity) onSelect(team.id);
      }}
      disabled={isAtCapacity}
      className={cn(
        "border-white flex min-h-20 w-full items-center justify-between gap-3 rounded-[20px] bg-[rgb(248,249,251)] p-4 text-left sm:px-5 border-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-70",
        isSelected ? "border-[#2562E9] " : "border-transparent",
      )}
    >
      <div className="flex min-w-0 items-center gap-4 sm:gap-[25px]">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[15px] bg-[rgb(233,235,236)]">
          <Wrench className="h-7 w-7 text-zinc-500" strokeWidth={1.9} />
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
            <span>{specialtyLabel}</span>
            <Navigation
              className="h-4 w-4 -mr-3"
              strokeWidth={1.9}
            ></Navigation>
            <span>{team.distance}</span>
            <span className="flex items-center gap-2">
              <ArchiveIcon className="h-4 w-4 " strokeWidth={1.9}></ArchiveIcon>
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
}) => {
  const filteredTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];
    return teams.filter((team) => isTeamMatchingReportType(team, reportType));
  }, [teams, reportType]);

  const selectableTeams = useMemo(
    () => filteredTeams.filter((team) => !isTeamAtCapacity(team)),
    [filteredTeams],
  );

  const [selectedTeamId, setSelectedTeamId] = useState(null);

  useEffect(() => {
    if (!filteredTeams.length) {
      setSelectedTeamId(null);
      return;
    }

    if (initialSelectedTeamId) {
      const matchesInitial = selectableTeams.some(
        (team) => team.id === initialSelectedTeamId,
      );

      if (matchesInitial) {
        setSelectedTeamId(initialSelectedTeamId);
        return;
      }
    }

    setSelectedTeamId((prev) => {
      if (prev && selectableTeams.some((team) => team.id === prev)) {
        return prev;
      }

      return selectableTeams[0]?.id ?? null;
    });
  }, [filteredTeams, selectableTeams, initialSelectedTeamId]);

  const selectedTeam = useMemo(
    () => filteredTeams.find((team) => team.id === selectedTeamId) ?? null,
    [filteredTeams, selectedTeamId],
  );

  const isSelectedTeamUnavailable =
    !selectedTeam || isTeamAtCapacity(selectedTeam);

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
              disabled={isSelectedTeamUnavailable}
              className="h-12 w-full rounded-[14px] bg-[rgba(37,99,235,1)] px-10 text-sm sm:text-base font-semibold text-white hover:bg-[rgb(29,78,216)] sm:w-auto"
            >
              Phân công
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignMaintenanceTeam;
