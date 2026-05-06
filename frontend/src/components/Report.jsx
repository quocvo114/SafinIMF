import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Upload,
  MapPin,
  X,
  AlertCircle,
  CloudUpload,
  Loader2,
} from "lucide-react";
import Toast from "./Toast";
import { reportApi } from "../services/api/reportApi";
import incidentApi from "../services/api/incidentApi";
import { useAuth } from "../context/AuthContext";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5050/api";

const LEGACY_INCIDENT_OPTIONS = [
  { value: "Giao Thông", label: "Giao Thông" },
  { value: "Điện", label: "Điện" },
  { value: "Cây Xanh", label: "Cây Xanh" },
  { value: "CTCC", label: "CTCC" },
];

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGES = 1;
const MAX_IMAGES = 3;

function ReportForm({ onClose, autoOpenCamera = false, initialImage = null }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState(
    initialImage ? [initialImage] : [],
  );
  const [location, setLocation] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState({
    lat: null,
    lng: null,
  });
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [incidentOptions, setIncidentOptions] = useState(
    LEGACY_INCIDENT_OPTIONS,
  );
  const [incidentTypeLoading, setIncidentTypeLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [hasFetchedLocation, setHasFetchedLocation] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (autoOpenCamera) {
      openCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCamera]);

  useEffect(() => {
    const fetchIncidentTypes = async () => {
      try {
        setIncidentTypeLoading(true);
        const response = await incidentApi.getIncidentTypes();

        if (response?.success && Array.isArray(response.data)) {
          const activeOptions = response.data
            .filter((item) => item?.active !== false)
            .map((item) => ({
              value: item.name,
              label: item.name,
            }));

          setIncidentOptions(activeOptions);
          return;
        }

        setIncidentOptions(LEGACY_INCIDENT_OPTIONS);
      } catch (error) {
        console.error("Failed to fetch incident types:", error);
        setIncidentOptions(LEGACY_INCIDENT_OPTIONS);
      } finally {
        setIncidentTypeLoading(false);
      }
    };

    fetchIncidentTypes();
  }, []);

  useEffect(() => {
    if (
      incidentType &&
      !incidentOptions.some((option) => option.value === incidentType)
    ) {
      setIncidentType("");
    }
  }, [incidentType, incidentOptions]);

  useEffect(() => {
    if (!hasFetchedLocation && !location) {
      setHasFetchedLocation(true);
      getLocation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFetchedLocation, location]);

  const showErrorToast = (message) => {
    setToast({ message, type: "error" });
  };

  const showSuccessToast = (message) => {
    setToast({ message, type: "success" });
  };

  const validateFiles = (files) => {
    const currentCount = uploadedImages.length;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      showErrorToast(`Bạn chỉ được tải tối đa ${MAX_IMAGES} ảnh.`);
      return [];
    }

    const selectedFiles = Array.from(files || []).slice(0, remainingSlots);
    const validFiles = [];

    for (const file of selectedFiles) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        showErrorToast(`File "${file.name}" phải là JPG hoặc PNG.`);
        continue;
      }

      if (file.size > MAX_IMAGE_BYTES) {
        showErrorToast(`Ảnh "${file.name}" vượt quá 5MB.`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  };

  const convertFilesToBase64 = (files) => {
    return Promise.all(
      files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          }),
      ),
    );
  };

  const triggerAutoLocationOnFirstImage = () => {
    if (!hasFetchedLocation && uploadedImages.length === 0) {
      setHasFetchedLocation(true);
      getLocation();
    }
  };

  const validateBase64ImagesForSubmit = (images) => {
    for (let i = 0; i < images.length; i += 1) {
      const image = images[i];
      if (typeof image !== "string" || !image.trim()) {
        showErrorToast(`Ảnh thứ ${i + 1} không hợp lệ.`);
        return false;
      }

      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(
        image.trim(),
      );
      if (!match) {
        showErrorToast(`Ảnh thứ ${i + 1} phải ở định dạng JPG/PNG.`);
        return false;
      }

      const mimeType = match[1].toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
        showErrorToast(`Ảnh thứ ${i + 1} phải là JPG hoặc PNG.`);
        return false;
      }

      const base64Payload = match[2].replace(/\s/g, "");
      const bytes = Math.floor((base64Payload.length * 3) / 4);
      if (bytes > MAX_IMAGE_BYTES) {
        showErrorToast(`Ảnh thứ ${i + 1} vượt quá 5MB.`);
        return false;
      }
    }

    return true;
  };

  // Upload ảnh chỉ thêm ảnh, vị trí hiện tại đã được lấy tự động khi mở form
  const handleImageUpload = async (e) => {
    const files = validateFiles(e.target.files || []);
    if (!files.length) return;

    try {
      const base64Images = await convertFilesToBase64(files);
      setUploadedImages((prev) => [...prev, ...base64Images]);
      triggerAutoLocationOnFirstImage();
    } catch (error) {
      console.error("Error reading files:", error);
      showErrorToast("Không thể đọc ảnh tải lên.");
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  const handleDropFiles = async (files) => {
    const validFiles = validateFiles(files);
    if (!validFiles.length) return;

    try {
      const base64Images = await convertFilesToBase64(validFiles);
      setUploadedImages((prev) => [...prev, ...base64Images]);
      triggerAutoLocationOnFirstImage();
    } catch (error) {
      console.error("Error reading dropped files:", error);
      showErrorToast("Không thể đọc ảnh kéo thả.");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer?.files;
    if (files?.length) {
      await handleDropFiles(files);
    }
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const getLocation = async () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ GPS");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setLocationCoordinates({ lat: latitude, lng: longitude });
        setGpsCoordinates({ latitude, longitude });
        setGpsAccuracy(accuracy);

        console.log(`📍 GPS accuracy: ${Math.round(accuracy)}m`);
        if (accuracy > 100) {
          console.warn("⚠️ GPS accuracy thấp (>100m). Vị trí có thể không chính xác.");
        }

        try {
          const response = await fetch(
            `${API_BASE_URL}/geocode/reverse?lat=${latitude}&lon=${longitude}`,
          );

          if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
          }

          const result = await response.json();
          const resolvedAddress =
            result?.data?.address || result?.data?.fullAddress || "";

          if (result.success && resolvedAddress) {
            setLocation(resolvedAddress);
          } else {
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (err) {
          console.error("Error getting address:", err);
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          alert("Không thể lấy địa chỉ. Vui lòng nhập thủ công.");
        }

        setLocationLoading(false);
      },
      (error) => {
        console.error("GPS error:", error);
        setLocationLoading(false);

        if (error.code === 1) {
          alert(
            "Bạn đã chặn quyền truy cập vị trí. Hãy cho phép lại trong trình duyệt (biểu tượng ổ khóa bên cạnh URL).",
          );
        } else if (error.code === 2) {
          alert(
            "Không xác định được vị trí. Vui lòng thử lại hoặc nhập địa chỉ thủ công.",
          );
        } else if (error.code === 3) {
          alert(
            "Lấy vị trí quá lâu (timeout). Vui lòng thử lại hoặc nhập địa chỉ thủ công.",
          );
        } else {
          alert("Không thể lấy vị trí GPS. Vui lòng nhập địa chỉ thủ công.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const openCamera = async () => {
    try {
      if (uploadedImages.length >= MAX_IMAGES) {
        showErrorToast(`Bạn chỉ được tải tối đa ${MAX_IMAGES} ảnh.`);
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      setStream(mediaStream);
      setShowCamera(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (error) {
      console.error(error);
      alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    if (uploadedImages.length >= MAX_IMAGES) {
      showErrorToast(`Bạn chỉ được tải tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");

    const shouldGetLocation = !hasFetchedLocation && uploadedImages.length === 0;

    setUploadedImages((prev) => [...prev, imageData]);

    if (shouldGetLocation) {
      getLocation();
      setHasFetchedLocation(true);
    }

    closeCamera();
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const resetForm = () => {
    setTitle("");
    setIncidentType("");
    setDescription("");
    setUploadedImages([]);
    setLocation("");
    setLocationCoordinates({ lat: null, lng: null });
    setGpsCoordinates(null);
    setGpsAccuracy(null);
    setHasFetchedLocation(false);
    setDragActive(false);
  };

  const handleCancel = () => {
    closeCamera();
    resetForm();
    onClose && onClose();
  };

  const geocodeAddress = async (address) => {
    if (!address) return { lat: null, lng: null };
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&accept-language=vi`,
        {
          headers: {
            "User-Agent": "ReportApp/1.0 (Contact: admin@example.com)",
          },
        },
      );
      if (!response.ok) return { lat: null, lng: null };
      const result = await response.json();
      if (!Array.isArray(result) || result.length === 0) return { lat: null, lng: null };
      const lat = parseFloat(result[0]?.lat);
      const lng = parseFloat(result[0]?.lon);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      return { lat: null, lng: null };
    } catch {
      return { lat: null, lng: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !incidentType) {
      alert("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    if (trimmedDescription.length < 5 || trimmedDescription.length > 500) {
      showErrorToast("Mô tả phải từ 5 đến 500 ký tự.");
      return;
    }

    if (
      uploadedImages.length < MIN_IMAGES ||
      uploadedImages.length > MAX_IMAGES
    ) {
      showErrorToast(`Bạn cần tải từ ${MIN_IMAGES} đến ${MAX_IMAGES} ảnh.`);
      return;
    }

    if (!validateBase64ImagesForSubmit(uploadedImages)) {
      return;
    }

    if (!location && !gpsCoordinates) {
      alert("Vui lòng nhập vị trí hoặc cho phép truy cập GPS");
      return;
    }

    const userId = user?._id || user?.user_id;
    if (!userId) {
      alert("Bạn cần đăng nhập để gửi báo cáo");
      return;
    }

    setIsSubmitting(true);
    let keepSubmitting = false;

    try {
      let submitLat = null;
      let submitLng = null;

      if (Number.isFinite(locationCoordinates.lat) && Number.isFinite(locationCoordinates.lng)) {
        submitLat = Number(locationCoordinates.lat);
        submitLng = Number(locationCoordinates.lng);
      } else if (gpsCoordinates) {
        submitLat = gpsCoordinates.latitude;
        submitLng = gpsCoordinates.longitude;
      } else if (location) {
        const geocoded = await geocodeAddress(location);
        submitLat = geocoded.lat;
        submitLng = geocoded.lng;
      }

      const reportData = {
        userId,
        title: trimmedTitle,
        type: incidentType,
        location: location || (gpsCoordinates ? `${gpsCoordinates.latitude}, ${gpsCoordinates.longitude}` : "Chưa xác định"),
        latitude: submitLat,
        longitude: submitLng,
        lat: submitLat,
        lng: submitLng,
        description: trimmedDescription,
        images: uploadedImages,
      };

      const response = await reportApi.createReport(reportData);

      if (response.success) {
        keepSubmitting = true;
        showSuccessToast("Đã gửi báo cáo thành công!");
        setTimeout(() => {
          resetForm();
          setIsSubmitting(false);
          onClose && onClose();
          navigate("/myreport", { replace: true });
        }, 1500);
      } else {
        showErrorToast("Gửi báo cáo thất bại!");
      }
    } catch (error) {
      console.error("Error creating report:", error);
      showErrorToast(error.response?.data?.message || "Lỗi khi gửi báo cáo!");
    } finally {
      if (!keepSubmitting) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-3 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            handleCancel();
          }
        }}
      >
        <div className="relative w-full max-w-5xl overflow-hidden rounded-[24px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <button
            type="button"
            onClick={handleCancel}
            className="absolute right-4 top-4 z-20 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-white px-5 py-6 sm:px-8 sm:py-7 lg:min-h-[560px]">
                <div className="max-w-[520px]">
                  <h2 className="text-[24px] font-bold leading-tight text-[#111111] sm:text-[28px]">
                    Tạo báo cáo sự cố
                  </h2>

                  <p className="mt-2.5 text-sm leading-5 text-[#707070]">
                    Vui lòng cung cấp thông tin chi tiết về sự cố hạ tầng để đội
                    ngũ kỹ thuật kịp thời xử lý.
                  </p>

                  <div className="mt-6 space-y-5">
                    <div>
                      <Label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide leading-normal text-[#2b2b2b]">
                        Tiêu đề sự cố
                      </Label>
                      <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Mô tả ngắn gọn sự cố"
                        className="h-11 py-0 w-full rounded-xl border border-transparent !bg-[#f4f5f6] px-4 text-sm text-[#222] outline-none transition placeholder:text-[#9b9b9b] focus:border-[#5d5fef] focus:!bg-white focus:ring-4 focus:ring-[#5d5fef]/10 shadow-none"
                      />
                    </div>

                    <div>
                      <Label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide leading-normal text-[#2b2b2b]">
                        Loại sự cố
                      </Label>

                      <Select value={incidentType} onValueChange={setIncidentType}>
                        <SelectTrigger
                          style={{ width: "100%", height: "44px" }}
                          className={`flex !h-11 py-0 items-center justify-between rounded-xl border px-4 text-left text-sm transition focus:outline-none focus:ring-4 focus:ring-[#5d5fef]/10 hover:!bg-[#e8e9eb] [&_svg]:!size-5 [&_svg]:!text-[#9b9b9b] [&_svg]:opacity-100 shadow-none ${
                            incidentType
                              ? "border-transparent !bg-[#f4f5f6] text-[#222]"
                              : "border-transparent !bg-[#f4f5f6] text-[#9b9b9b] data-[placeholder]:!text-[#9b9b9b]"
                          }`}
                        >
                          <SelectValue
                            placeholder={
                              incidentTypeLoading
                                ? "Đang tải loại sự cố..."
                                : "Chọn loại sự cố"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent
                          position="popper"
                          className="z-[10020] w-[var(--radix-select-trigger-width)] max-h-[260px] rounded-xl border border-gray-100 bg-white p-1 text-sm shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
                        >
                          {incidentOptions.length > 0 ? (
                            incidentOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="rounded-lg py-2 text-sm font-normal text-[#222] focus:bg-[#f5f6ff] focus:text-[#3b3df5] data-[state=checked]:font-medium"
                              >
                                {option.label}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem
                              value="__no_incident_type"
                              disabled
                              className="rounded-lg py-2 text-sm text-gray-400"
                            >
                              Chưa có loại sự cố khả dụng
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-2">
                      <Label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide leading-normal text-[#2b2b2b]">
                        Mô tả chi tiết
                      </Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={6}
                        placeholder="Mô tả chi tiết về sự cố: Tình trạng hiện tại, mức độ nghiêm trọng, các yếu tố liên quan..."
                        className="w-full min-h-[140px] resize-none rounded-2xl border border-transparent !bg-[#f4f5f6] px-4 py-3.5 text-sm leading-5 text-[#222] outline-none transition placeholder:text-[#9b9b9b] focus:border-[#5d5fef] focus:!bg-white focus:ring-4 focus:ring-[#5d5fef]/10 shadow-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col bg-[#f8f9fa] px-5 py-6 sm:px-8 sm:py-7 lg:min-h-[560px]">
                <div className="mx-auto flex h-full w-full max-w-[520px] flex-col">
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wide text-[#2b2b2b]">
                      Hình ảnh sự cố
                    </h3>
                    <p className="mt-0.5 text-xs text-[#8b8b8b]">
                      Định dạng JPG, PNG (1-3 ảnh, tối đa 5MB/ảnh)
                    </p>
                  </div>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-4 rounded-[20px] border-2 border-dashed bg-[#fcfcfc] p-5 transition sm:p-6 ${
                      dragActive
                        ? "border-[#5d5fef] bg-[#f7f7ff]"
                        : "border-[#d7d7d7]"
                    }`}
                  >
                    {uploadedImages.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {uploadedImages.map((img, index) => (
                            <div
                              key={index}
                              className="group relative overflow-hidden rounded-xl bg-[#f2f2f2]"
                            >
                              <img
                                src={img}
                                alt={`uploaded-${index}`}
                                className="h-24 w-full object-cover sm:h-28"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-1.5 top-1.5 rounded-full bg-black/65 p-1 text-white opacity-100 transition hover:bg-red-500 sm:opacity-0 sm:group-hover:opacity-100"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={openCamera}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dddddd] bg-white text-sm font-medium text-[#333] transition hover:border-[#5d5fef] hover:text-[#5d5fef]"
                          >
                            <Camera className="h-4 w-4" />
                            Camera
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#dddddd] bg-white text-sm font-medium text-[#333] transition hover:border-[#5d5fef] hover:text-[#5d5fef]"
                          >
                            <Upload className="h-4 w-4" />
                            Upload
                          </button>
                        </div>

                        <p className="text-center text-[11px] text-[#8b8b8b]">
                          Đã tải {uploadedImages.length}/{MAX_IMAGES} ảnh
                        </p>
                      </div>
                    ) : (
                      <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#dcebff]">
                          <CloudUpload className="h-7 w-7 text-[#2d7ef7]" />
                        </div>

                        <h4 className="text-[20px] font-bold text-[#151515]">
                          Tải ảnh lên hoặc Chụp ảnh
                        </h4>

                        <p className="mt-2 max-w-[280px] text-[13px] leading-5 text-[#8c8c8c]">
                          Kéo thả file vào đây hoặc nhấp để chọn từ thư viện
                        </p>

                        <div className="mt-5 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                          <button
                            type="button"
                            onClick={openCamera}
                            className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl border border-[#e2e2e2] bg-white px-4 text-sm font-medium text-[#333] shadow-sm transition hover:border-[#5d5fef] hover:text-[#5d5fef]"
                          >
                            <Camera className="h-4 w-4" />
                            Camera
                          </button>

                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl border border-[#e2e2e2] bg-white px-4 text-sm font-medium text-[#333] shadow-sm transition hover:border-[#5d5fef] hover:text-[#5d5fef]"
                          >
                            <Upload className="h-4 w-4" />
                            Upload
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="mt-5">
                    <Label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide leading-normal text-[#2b2b2b]">
                      Vị trí sự cố
                    </Label>

                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center">
                        <MapPin className="h-4 w-4 text-[#8a8a8a]" />
                      </div>
                      <Input
                        type="text"
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value);
                          setLocationCoordinates({ lat: null, lng: null });
                          setGpsAccuracy(null);
                        }}
                        disabled={locationLoading}
                        placeholder="Nhập vị trí sự cố (Ví dụ: 03 Quang Trung, Hải Châu, ĐN)"
                        className="h-11 py-0 w-full rounded-xl border border-transparent !bg-white !pl-10 pr-4 text-sm text-[#222] outline-none transition placeholder:text-[#9b9b9b] focus:border-[#5d5fef] focus:ring-4 focus:ring-[#5d5fef]/10 disabled:cursor-not-allowed disabled:opacity-70 shadow-none"
                      />
                    </div>

                    <div className="mt-2.5 flex items-start gap-1.5 leading-4 text-[#8d8d8d]">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#9b9b9b]" />
                      <p className="whitespace-nowrap text-[10.5px] tracking-tight">
                        Vui lòng nhập chính xác vị trí của sự cố để thuận tiện
                        cho đội xử lý tiến hành khắc phục.
                      </p>
                    </div>
                    {gpsAccuracy !== null && gpsAccuracy > 100 && (
                      <div className="mt-2 flex items-start gap-1.5 leading-4 text-amber-600">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                        <p className="text-[10.5px] tracking-tight">
                          ⚠️ Độ chính xác GPS thấp (~{Math.round(gpsAccuracy)}m). Nên nhập địa chỉ thủ công để chính xác hơn.
                        </p>
                      </div>
                    )}
                    {gpsAccuracy !== null && gpsAccuracy <= 100 && (
                      <div className="mt-2 flex items-start gap-1.5 leading-4 text-green-600">
                        <p className="text-[10.5px] tracking-tight">
                          ✓ GPS chính xác ~{Math.round(gpsAccuracy)}m
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex flex-col-reverse gap-2 pt-6 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-[#555] transition hover:bg-gray-100 hover:text-gray-600 bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Huỷ bỏ
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#3f39f5] px-7 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(63,57,245,0.28)] transition hover:bg-[#322cf0] hover:text-white disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        "Gửi báo cáo"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {showCamera && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4">
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#111]">
                    Chụp ảnh sự cố
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Sau khi chụp ảnh, hệ thống sẽ tự động lấy GPS hiện tại.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCamera}
                  className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="h-auto max-h-[68vh] w-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-gray-300 px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#3f39f5] px-6 text-sm font-semibold text-white transition hover:bg-[#322cf0]"
                >
                  <Camera className="h-5 w-5" />
                  Chụp ảnh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ReportForm;
