import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReportForm from "./Report";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { _id: "USR-001", user_id: "USR-001" },
  }),
}));

const mockCreateReport = vi.fn();
vi.mock("../services/api/reportApi", () => ({
  reportApi: {
    createReport: (...args) => mockCreateReport(...args),
  },
}));

const mockGetIncidentTypes = vi.fn();
vi.mock("../services/api/incidentApi", () => ({
  default: {
    getIncidentTypes: (...args) => mockGetIncidentTypes(...args),
  },
}));

vi.mock("./ui/select", () => {
  const ReactModule = require("react");
  const SelectContext = ReactModule.createContext({
    value: "",
    onValueChange: () => {},
  });

  const Select = ({ value, onValueChange, children }) => (
    <SelectContext.Provider
      value={{ value: value || "", onValueChange: onValueChange || (() => {}) }}
    >
      <div>{children}</div>
    </SelectContext.Provider>
  );

  const SelectTrigger = ({ children }) => <div>{children}</div>;
  const SelectValue = ({ placeholder }) => <span>{placeholder}</span>;

  const SelectContent = ({ children }) => {
    const ctx = ReactModule.useContext(SelectContext);
    return (
      <select
        aria-label="Loại sự cố"
        value={ctx.value}
        onChange={(event) => ctx.onValueChange(event.target.value)}
      >
        <option value="">Chọn loại sự cố</option>
        {children}
      </select>
    );
  };

  const SelectItem = ({ value, children, disabled }) => (
    <option value={value} disabled={disabled}>
      {children}
    </option>
  );

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

function makeBase64ImageDataUrl(byteSize = 1024, mimeType = "image/jpeg") {
  const bytes = new Uint8Array(byteSize);
  const binary = String.fromCharCode(...bytes);
  return `data:${mimeType};base64,${btoa(binary)}`;
}

describe("PB05 Report form UI validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetIncidentTypes.mockResolvedValue({
      success: true,
      data: [{ name: "Giao Thông", active: true }],
    });

    mockCreateReport.mockResolvedValue({ success: true });

    vi.stubGlobal("alert", vi.fn());
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { address: "Hải Châu, Đà Nẵng" },
        }),
      }),
    );

    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 16.0544,
              longitude: 108.2022,
            },
          });
        }),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function fillRequiredFields({ description }) {
    fireEvent.change(screen.getByPlaceholderText("Mô tả ngắn gọn sự cố"), {
      target: { value: "Sự cố ổ gà trước nhà" },
    });

    const select = await screen.findByLabelText("Loại sự cố");
    fireEvent.change(select, { target: { value: "Giao Thông" } });

    fireEvent.change(
      screen.getByPlaceholderText(
        "Mô tả chi tiết về sự cố: Tình trạng hiện tại, mức độ nghiêm trọng, các yếu tố liên quan....",
      ),
      {
        target: { value: description },
      },
    );
  }

  test("shows error when description length is under 10 chars", async () => {
    render(
      <ReportForm onClose={vi.fn()} initialImage={makeBase64ImageDataUrl()} />,
    );

    await fillRequiredFields({ description: "quá ngắn" });

    fireEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

    expect(
      await screen.findByText("Mô tả phải từ 10 đến 100 ký tự."),
    ).toBeInTheDocument();
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  test("shows error when image count is less than 3", async () => {
    render(
      <ReportForm onClose={vi.fn()} initialImage={makeBase64ImageDataUrl()} />,
    );

    await fillRequiredFields({
      description: "Mô tả hợp lệ với độ dài lớn hơn mười ký tự",
    });

    fireEvent.click(screen.getByRole("button", { name: "Gửi báo cáo" }));

    expect(
      await screen.findByText("Bạn cần tải từ 3 đến 5 ảnh."),
    ).toBeInTheDocument();
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  test("rejects non JPG/PNG file on upload", async () => {
    const { container } = render(<ReportForm onClose={vi.fn()} />);

    const fileInput = container.querySelector("input[type='file']");
    const pdfFile = new File(["dummy pdf"], "test.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, {
      target: { files: [pdfFile] },
    });

    expect(
      await screen.findByText('File "test.pdf" phải là JPG hoặc PNG.'),
    ).toBeInTheDocument();
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  test("rejects image larger than 5MB on upload", async () => {
    const { container } = render(<ReportForm onClose={vi.fn()} />);

    const fileInput = container.querySelector("input[type='file']");
    const bigImage = new File(
      [new Uint8Array(5 * 1024 * 1024 + 1)],
      "big.jpg",
      {
        type: "image/jpeg",
      },
    );

    fireEvent.change(fileInput, {
      target: { files: [bigImage] },
    });

    await waitFor(() => {
      expect(
        screen.getByText('Ảnh "big.jpg" vượt quá 5MB.'),
      ).toBeInTheDocument();
    });

    expect(mockCreateReport).not.toHaveBeenCalled();
  });
});
