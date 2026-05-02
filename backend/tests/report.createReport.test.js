const request = require("supertest");

jest.mock("../src/repositories/ReportRepository", () => ({
  create: jest.fn(),
}));

jest.mock("../src/repositories/IncidentTypeRepository", () => ({
  ensureDefaults: jest.fn(),
  findActiveByName: jest.fn(),
}));

jest.mock("../src/services/ai/aiVerification.service", () => ({
  verifyImageWithModel: jest.fn(),
}));

const ReportRepository = require("../src/repositories/ReportRepository");
const IncidentTypeRepository = require("../src/repositories/IncidentTypeRepository");
const {
  verifyImageWithModel,
} = require("../src/services/ai/aiVerification.service");
const { createApp } = require("../src/app");

const app = createApp();

function makeDataUrl(mimeType = "image/jpeg", bytes = 1024) {
  const buffer = Buffer.alloc(bytes, 1);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function createPayload(overrides = {}) {
  return {
    userId: "USR-001",
    title: "Ổ gà lớn trước nhà dân",
    type: "Giao Thông",
    location: "16.0544, 108.2022 (Đà Nẵng)",
    description: "Mặt đường xuất hiện ổ gà lớn, gây nguy hiểm giao thông",
    images: [
      makeDataUrl("image/jpeg", 1000),
      makeDataUrl("image/png", 1200),
      makeDataUrl("image/jpeg", 1400),
    ],
    ...overrides,
  };
}

describe("PB05 - POST /api/reports", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    IncidentTypeRepository.ensureDefaults.mockResolvedValue(undefined);
    IncidentTypeRepository.findActiveByName.mockResolvedValue({
      name: "Giao Thông",
    });

    verifyImageWithModel.mockResolvedValue({
      aiVerified: true,
      aiPercent: 92.5,
      aiLabel: "pothole",
      aiTotalObjects: 1,
      aiSource: "mock://ai",
    });

    ReportRepository.create.mockResolvedValue({
      _id: "mongo-id",
      id: "RPT-TEST",
      report_id: "RPT-TEST",
    });
  });

  test("creates report successfully when payload and AI are valid", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(createPayload())
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(verifyImageWithModel).toHaveBeenCalledTimes(1);
    expect(ReportRepository.create).toHaveBeenCalledTimes(1);
  });

  test.each([10, 100])(
    "accepts description boundary length %i",
    async (length) => {
      const response = await request(app)
        .post("/api/reports")
        .send(
          createPayload({
            description: "a".repeat(length),
          }),
        )
        .expect(201);

      expect(response.body.success).toBe(true);
    },
  );

  test.each([9, 101])(
    "rejects invalid description length %i",
    async (length) => {
      const response = await request(app)
        .post("/api/reports")
        .send(
          createPayload({
            description: "a".repeat(length),
          }),
        )
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(ReportRepository.create).not.toHaveBeenCalled();
    },
  );

  test("rejects with only 2 images", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(
        createPayload({
          images: [makeDataUrl(), makeDataUrl("image/png")],
        }),
      )
      .expect(400);

    expect(response.body.message).toMatch(/3 đến 5 ảnh/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("accepts with exactly 5 images", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(
        createPayload({
          images: [
            makeDataUrl(),
            makeDataUrl("image/png"),
            makeDataUrl(),
            makeDataUrl("image/png"),
            makeDataUrl(),
          ],
        }),
      )
      .expect(201);

    expect(response.body.success).toBe(true);
  });

  test("rejects with 6 images", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(
        createPayload({
          images: [
            makeDataUrl(),
            makeDataUrl(),
            makeDataUrl(),
            makeDataUrl(),
            makeDataUrl(),
            makeDataUrl(),
          ],
        }),
      )
      .expect(400);

    expect(response.body.message).toMatch(/3 đến 5 ảnh/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects unsupported file format like PDF", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(
        createPayload({
          images: [
            makeDataUrl("application/pdf", 2000),
            makeDataUrl("image/jpeg", 1000),
            makeDataUrl("image/png", 1000),
          ],
        }),
      )
      .expect(400);

    expect(response.body.message).toMatch(/JPG hoặc PNG/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects image over 5MB", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(
        createPayload({
          images: [
            makeDataUrl("image/jpeg", 5 * 1024 * 1024 + 1),
            makeDataUrl("image/jpeg", 1000),
            makeDataUrl("image/png", 1000),
          ],
        }),
      )
      .expect(400);

    expect(response.body.message).toMatch(/vượt quá 5MB/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects coordinates outside Da Nang", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(
        createPayload({
          location: "10.7626, 106.6602",
        }),
      )
      .expect(400);

    expect(response.body.message).toMatch(/ngoài phạm vi Đà Nẵng/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects when AI validation fails", async () => {
    verifyImageWithModel.mockResolvedValue({
      aiVerified: false,
      aiError: "Model API lỗi 500",
      aiPercent: null,
      aiLabel: "",
      aiTotalObjects: 0,
      aiSource: null,
    });

    const response = await request(app)
      .post("/api/reports")
      .send(createPayload())
      .expect(422);

    expect(response.body.code).toBe("AI_VALIDATION_FAILED");
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects when AI returns no detection", async () => {
    verifyImageWithModel.mockResolvedValue({
      aiVerified: true,
      aiPercent: 0,
      aiLabel: "No detection",
      aiTotalObjects: 0,
      aiSource: "mock://ai",
    });

    const response = await request(app)
      .post("/api/reports")
      .send(createPayload())
      .expect(422);

    expect(response.body.code).toBe("AI_VALIDATION_FAILED");
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("returns 500 when AI service throws timeout error", async () => {
    verifyImageWithModel.mockRejectedValue(
      new Error("Model API timeout sau 10000ms"),
    );

    const response = await request(app)
      .post("/api/reports")
      .send(createPayload())
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("returns 500 when DB create fails", async () => {
    ReportRepository.create.mockRejectedValue(new Error("DB connection error"));

    const response = await request(app)
      .post("/api/reports")
      .send(createPayload())
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(ReportRepository.create).toHaveBeenCalledTimes(1);
  });
});
