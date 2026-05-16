import { describe, expect, it } from "vitest";
import { clusterReports, haversineDistance } from "./clusterReports";

const basePosition = [16.0471, 108.2068];

const buildReport = (overrides = {}) => ({
  id: `report-${Math.random()}`,
  type: "traffic",
  position: basePosition,
  createdAt: "2026-05-13T10:00:00Z",
  ...overrides,
});

const shiftLat = (lat, meters) => lat + meters / 111111;

describe("clusterReports", () => {
  it("clusters reports of same type within radius and time window", () => {
    const reports = [
      buildReport(),
      buildReport({
        id: "report-2",
        position: [shiftLat(basePosition[0], 10), basePosition[1]],
        createdAt: "2026-05-13T12:00:00Z",
      }),
    ];

    const clusters = clusterReports(reports, 20, 48);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(2);
  });

  it("does not cluster different types", () => {
    const reports = [
      buildReport(),
      buildReport({ id: "report-2", type: "electric" }),
    ];

    const clusters = clusterReports(reports, 20, 48);

    expect(clusters).toHaveLength(2);
    expect(clusters.map((cluster) => cluster.count)).toEqual([1, 1]);
  });

  it("does not cluster reports beyond radius", () => {
    const reports = [
      buildReport(),
      buildReport({
        id: "report-2",
        position: [shiftLat(basePosition[0], 80), basePosition[1]],
      }),
    ];

    const clusters = clusterReports(reports, 20, 48);

    expect(clusters).toHaveLength(2);
  });

  it("does not cluster reports beyond time window", () => {
    const reports = [
      buildReport({ createdAt: "2026-05-10T00:00:00Z" }),
      buildReport({
        id: "report-2",
        createdAt: "2026-05-12T13:00:00Z",
      }),
    ];

    const clusters = clusterReports(reports, 20, 48);

    expect(clusters).toHaveLength(2);
  });

  it("keeps large clusters intact", () => {
    const reports = Array.from({ length: 12 }, (_, index) =>
      buildReport({ id: `report-${index + 1}` }),
    );

    const clusters = clusterReports(reports, 20, 48);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(12);
  });

  it("calculates distances in meters", () => {
    const distance = haversineDistance(16, 108, 16, 108.0001);
    expect(distance).toBeGreaterThan(0);
  });
});
