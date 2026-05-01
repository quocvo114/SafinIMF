const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const AUTH_USER_ID = "USR-001";

jest.mock("../src/repositories/ReportRepository", () => ({
  create: jest.fn(),
}));

jest.mock("../src/repositories/IncidentTypeRepository", () => ({
  ensureDefaults: jest.fn(),
  findActiveByName: jest.fn(),
}));

jest.mock("../src/services/ai/aiVerification.service", () => ({
  verifyAllImages: jest.fn(),
}));

const ReportRepository = require("../src/repositories/ReportRepository");
const IncidentTypeRepository = require("../src/repositories/IncidentTypeRepository");
const {
  verifyAllImages,
} = require("../src/services/ai/aiVerification.service");
const { createApp } = require("../src/app");

const app = createApp();

function makeAuthHeader() {
  const token = jwt.sign(
    {
      id: AUTH_USER_ID,
      role: "citizen",
    },
    process.env.JWT_SECRET,
  );

  return `Bearer ${token}`;
}

function postReport(payload) {
  return request(app)
    .post("/api/reports")
    .set("Authorization", makeAuthHeader())
    .send(payload);
}

function makeDataUrl(mimeType = "image/jpeg", bytes = 1024) {
  const buffer = Buffer.alloc(bytes, 1);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function createPayload(overrides = {}) {
  return {
    userId: AUTH_USER_ID,
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

    verifyAllImages.mockResolvedValue({
      allPassed: true,
      results: [
        {
          aiVerified: true,
          aiPercent: 92.5,
          aiLabel: "pothole",
          aiTotalObjects: 1,
          aiSource: "mock://ai",
        },
      ],
      summary: {
        aiVerified: true,
        aiPercent: 92.5,
        aiLabel: "pothole",
        aiTotalObjects: 1,
        aiSource: "mock://ai",
      },
    });

    ReportRepository.create.mockResolvedValue({
      _id: "mongo-id",
      id: "RPT-TEST",
      report_id: "RPT-TEST",
    });
  });

  test("creates report successfully when payload and AI are valid", async () => {
    const response = await postReport(createPayload()).expect(201);

    expect(response.body.success).toBe(true);
    expect(verifyAllImages).toHaveBeenCalledTimes(1);
    expect(ReportRepository.create).toHaveBeenCalledTimes(1);
  });

  test.each([10, 100])(
    "accepts description boundary length %i",
    async (length) => {
      const response = await postReport(
        createPayload({
          description: "a".repeat(length),
        }),
      ).expect(201);

      expect(response.body.success).toBe(true);
    },
  );

  test.each([9, 101])(
    "rejects invalid description length %i",
    async (length) => {
      const response = await postReport(
        createPayload({
          description: "a".repeat(length),
        }),
      ).expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("VALIDATION_ERROR");
      expect(ReportRepository.create).not.toHaveBeenCalled();
    },
  );

  test("rejects when image count is 0", async () => {
    const response = await postReport(
      createPayload({
        images: [],
      }),
    ).expect(400);

    expect(response.body.message).toMatch(/1 đến 3 ảnh/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("accepts with exactly 3 images", async () => {
    const response = await postReport(
      createPayload({
        images: [makeDataUrl(), makeDataUrl("image/png"), makeDataUrl()],
      }),
    ).expect(201);

    expect(response.body.success).toBe(true);
  });

  test("rejects with 4 images", async () => {
    const response = await postReport(
      createPayload({
        images: [makeDataUrl(), makeDataUrl(), makeDataUrl(), makeDataUrl()],
      }),
    ).expect(400);

    expect(response.body.message).toMatch(/1 đến 3 ảnh/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects unsupported file format like PDF", async () => {
    const response = await postReport(
      createPayload({
        images: [
          makeDataUrl("application/pdf", 2000),
          makeDataUrl("image/jpeg", 1000),
          makeDataUrl("image/png", 1000),
        ],
      }),
    ).expect(400);

    expect(response.body.message).toMatch(/JPG hoặc PNG/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects image over 5MB", async () => {
    const response = await postReport(
      createPayload({
        images: [
          makeDataUrl("image/jpeg", 5 * 1024 * 1024 + 1),
          makeDataUrl("image/jpeg", 1000),
          makeDataUrl("image/png", 1000),
        ],
      }),
    ).expect(400);

    expect(response.body.message).toMatch(/vượt quá 5MB/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects coordinates outside Da Nang", async () => {
    const response = await postReport(
      createPayload({
        location: "10.7626, 106.6602",
      }),
    ).expect(400);

    expect(response.body.message).toMatch(/ngoài phạm vi Đà Nẵng/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects when AI validation fails", async () => {
    verifyAllImages.mockResolvedValue({
      allPassed: false,
      failedIndex: 0,
      isTimeout: false,
      aiError: "Model API lỗi 500",
    });

    const response = await postReport(createPayload()).expect(422);

    expect(response.body.code).toBe("AI_VALIDATION_FAILED");
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects when AI returns no detection", async () => {
    verifyAllImages.mockResolvedValue({
      allPassed: false,
      failedIndex: 0,
      isTimeout: false,
      aiError: "Ảnh không liên quan đến sự cố hạ tầng",
    });

    const response = await postReport(createPayload()).expect(422);

    expect(response.body.code).toBe("AI_VALIDATION_FAILED");
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("returns 500 when AI service throws timeout error", async () => {
    verifyAllImages.mockRejectedValue(
      new Error("Model API timeout sau 10000ms"),
    );

    const response = await postReport(createPayload()).expect(500);

    expect(response.body.success).toBe(false);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("returns 500 when DB create fails", async () => {
    ReportRepository.create.mockRejectedValue(new Error("DB connection error"));

    const response = await postReport(createPayload()).expect(500);

    expect(response.body.success).toBe(false);
    expect(ReportRepository.create).toHaveBeenCalledTimes(1);
  });

  test("rejects create report without auth token", async () => {
    const response = await request(app)
      .post("/api/reports")
      .send(createPayload())
      .expect(401);

    expect(response.body.message).toMatch(/Unauthorized|Token/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });

  test("rejects when payload userId mismatches authenticated user", async () => {
    const response = await postReport(
      createPayload({
        userId: "SOMEONE_ELSE",
      }),
    ).expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/không thể tạo báo cáo/);
    expect(ReportRepository.create).not.toHaveBeenCalled();
  });
});
