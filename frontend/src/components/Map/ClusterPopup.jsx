import { useMemo } from "react";

const TYPE_LABELS = Object.freeze({
  traffic: "Giao thông",
  electric: "Điện",
  tree: "Cây xanh",
  building: "Công trình công cộng",
});

const resolveReportId = (report) =>
  report?.id ?? report?.report_id ?? report?._id ?? "Không rõ";

const resolveReporterName = (report) =>
  report?.reporterName ?? report?.reporter ?? "Ẩn danh";

const parseTimeMs = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getTime();
    }

    const matched = value.match(
      /(\d{1,2}):(\d{2}).*?(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    );
    if (matched) {
      const [, hour, minute, day, month, year] = matched;
      const reconstructed = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
      );
      if (!Number.isNaN(reconstructed.getTime())) {
        return reconstructed.getTime();
      }
    }
  }

  return null;
};

const resolveTimeMs = (report) =>
  parseTimeMs(report?.createdAtMs) ??
  parseTimeMs(report?.createdAt) ??
  parseTimeMs(report?.created_at) ??
  parseTimeMs(report?.time);

const formatTimestamp = (report) => {
  const timeMs = resolveTimeMs(report);
  if (timeMs !== null) {
    const date = new Date(timeMs);
    const time = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const dateText = date.toLocaleDateString("vi-VN");
    return `${time}, ${dateText}`;
  }

  if (report?.displayDate) {
    return report.displayDate;
  }

  return "Không rõ";
};

export default function ClusterPopup({ type, reports }) {
  const typeLabel = TYPE_LABELS[type] || "Sự cố";

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const timeA = resolveTimeMs(a) ?? Number.MAX_SAFE_INTEGER;
      const timeB = resolveTimeMs(b) ?? Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });
  }, [reports]);

  return (
    <div className="cluster-popup">
      <div className="cluster-popup__header">
        <strong>
          {typeLabel} ({reports.length} báo cáo)
        </strong>
      </div>
      <div className="cluster-popup__divider" />
      <div className="cluster-popup__list">
        {sortedReports.map((report) => (
          <div key={resolveReportId(report)} className="cluster-popup__item">
            <span className="cluster-popup__bullet">•</span>
            <span>
              [#{resolveReportId(report)}] {formatTimestamp(report)} –{" "}
              {resolveReporterName(report)}
            </span>
          </div>
        ))}
      </div>
      {/* <div className="cluster-popup__divider" /> */}
      {/* <div className="cluster-popup__footer">Xem chi tiết từng báo cáo →</div> */}
    </div>
  );
}
