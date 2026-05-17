const Report = require("../models/Report");
const ReportRepository = require("../repositories/ReportRepository");

const CLUSTER_RADIUS_M = 20;
const CLUSTER_TIME_WINDOW_HOURS = 48;
const EARTH_RADIUS_M = 6371000;

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const deltaLat = toRadians(lat2 - lat1);
  const deltaLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
};

const resolveCoordinates = (report) => {
  const lat = Number(report?.lat ?? report?.reportLatitude);
  const lng = Number(report?.lng ?? report?.reportLongitude);

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return { lat, lng };
  }

  return null;
};

const resolveTimeMs = (report) => {
  if (!report) return null;

  const dateValue = report.createdAt || report.created_at;
  if (!dateValue) return null;

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getTime();
};

const buildClusterNote = (sourceId) =>
  `Tự động cập nhật theo báo cáo #${sourceId} (cùng cụm)`;

async function getSourceReport(sourceId) {
  if (!sourceId) return null;

  const query = ReportRepository.buildIdQuery(sourceId);
  if (!query) return null;

  return Report.findOne(query);
}

async function findClusterPeers(sourceReport) {
  if (!sourceReport?.type) {
    return [];
  }

  const sourceCoords = resolveCoordinates(sourceReport);
  if (!sourceCoords) {
    return [];
  }

  const sourceTimeMs = resolveTimeMs(sourceReport);
  const query = { type: sourceReport.type };

  if (sourceTimeMs !== null) {
    const windowMs = CLUSTER_TIME_WINDOW_HOURS * 60 * 60 * 1000;
    query.createdAt = {
      $gte: new Date(sourceTimeMs - windowMs),
      $lte: new Date(sourceTimeMs + windowMs),
    };
  }

  const candidates = await Report.find(query)
    .select(
      "_id id type status lat lng reportLatitude reportLongitude createdAt assignedTeamId assignedTeamName clusterSourceId",
    )
    .lean();

  return candidates.filter((candidate) => {
    if (String(candidate?._id) === String(sourceReport?._id)) {
      return false;
    }

    const candidateCoords = resolveCoordinates(candidate);
    if (!candidateCoords) {
      return false;
    }

    const distance = haversineDistance(
      sourceCoords.lat,
      sourceCoords.lng,
      candidateCoords.lat,
      candidateCoords.lng,
    );

    return distance <= CLUSTER_RADIUS_M;
  });
}

async function syncStatusToInProgress(sourceId) {
  const source = await getSourceReport(sourceId);
  if (!source) {
    return { updated: 0, skipped: 0 };
  }

  const peers = await findClusterPeers(source);
  if (!peers.length) {
    return { updated: 0, skipped: 0 };
  }

  const now = new Date();
  const updates = [];

  for (const peer of peers) {
    // Không đồng bộ lên "Đang Xử Lý" nếu báo cáo đã giải quyết hoặc đã hoàn tất
    if (
      peer.status === "Đã Giải Quyết" ||
      peer.status === "Đã Hoàn Tất"
    ) {
      continue;
    }

    if (peer.clusterSourceId && peer.clusterSourceId !== source.id) {
      continue;
    }

    updates.push({
      updateOne: {
        filter: { _id: peer._id },
        update: {
          status: "Đang Xử Lý",
          clusterSourceId: source.id,
          clusterSyncedAt: now,
          clusterSyncNote: buildClusterNote(source.id),
          assignedTeamId: source.assignedTeamId || source.handlingTeamId || "",
          assignedTeamName:
            source.assignedTeamName || source.handlingTeamName || "",
          handlingTeamId: source.handlingTeamId || source.assignedTeamId || "",
          handlingTeamName:
            source.handlingTeamName || source.assignedTeamName || "",
        },
      },
    });
  }

  if (updates.length) {
    await Report.bulkWrite(updates);
  }

  return { updated: updates.length, skipped: peers.length - updates.length };
}

async function syncStatusToResolved(sourceId) {
  const source = await getSourceReport(sourceId);
  if (!source) {
    return { updated: 0, skipped: 0 };
  }

  const peers = await Report.find({ clusterSourceId: source.id }).lean();
  if (!peers.length) {
    return { updated: 0, skipped: 0 };
  }

  const now = new Date();
  const updates = [];

  for (const peer of peers) {
    if (
      peer.status === "Đã Giải Quyết" ||
      peer.status === "Đã Hoàn Tất"
    ) {
      continue;
    }

    updates.push({
      updateOne: {
        filter: { _id: peer._id },
        update: {
          status: "Đã Giải Quyết",
          afterImg: source.afterImg || "",
          clusterSyncedAt: now,
          clusterSyncNote: buildClusterNote(source.id),
        },
      },
    });
  }

  if (updates.length) {
    await Report.bulkWrite(updates);
  }

  return { updated: updates.length, skipped: peers.length - updates.length };
}

/**
 * Khi QLKV xác nhận source report "Đã Hoàn Tất",
 * đồng bộ tất cả follower report lên "Đã Hoàn Tất" kèm afterImg + progressNote.
 */
async function syncStatusToCompleted(sourceId) {
  const source = await getSourceReport(sourceId);
  if (!source) {
    return { updated: 0, skipped: 0 };
  }

  const peers = await Report.find({ clusterSourceId: source.id }).lean();
  if (!peers.length) {
    return { updated: 0, skipped: 0 };
  }

  const now = new Date();
  const updates = [];

  for (const peer of peers) {
    if (peer.status === "Đã Hoàn Tất") {
      continue; // Đã hoàn tất rồi, bỏ qua
    }

    updates.push({
      updateOne: {
        filter: { _id: peer._id },
        update: {
          status: "Đã Hoàn Tất",
          afterImg: source.afterImg || "",
          progressNote: source.progressNote || "",
          teamResolved: true,
          clusterSyncedAt: now,
          clusterSyncNote: buildClusterNote(source.id),
        },
      },
    });
  }

  if (updates.length) {
    await Report.bulkWrite(updates);
  }

  return { updated: updates.length, skipped: peers.length - updates.length };
}

async function syncStatusToWaiting(sourceId) {
  const source = await getSourceReport(sourceId);
  if (!source) {
    return { updated: 0, skipped: 0 };
  }

  const peers = await Report.find({ clusterSourceId: source.id }).lean();
  if (!peers.length) {
    return { updated: 0, skipped: 0 };
  }

  const updates = [];

  for (const peer of peers) {
    if (
      peer.status === "Đã Giải Quyết" ||
      peer.status === "Đã Hoàn Tất"
    ) {
      continue;
    }

    updates.push({
      updateOne: {
        filter: { _id: peer._id },
        update: {
          status: "Đang Chờ",
          clusterSourceId: null,
          clusterSyncedAt: null,
          clusterSyncNote: null,
          assignedTeamId: "",
          assignedTeamName: "",
          handlingTeamId: "",
          handlingTeamName: "",
        },
      },
    });
  }

  if (updates.length) {
    await Report.bulkWrite(updates);
  }

  return { updated: updates.length, skipped: peers.length - updates.length };
}

module.exports = {
  findClusterPeers,
  syncStatusToInProgress,
  syncStatusToResolved,
  syncStatusToCompleted,
  syncStatusToWaiting,
};
