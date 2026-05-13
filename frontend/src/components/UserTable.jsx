import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  X,
  ChevronDown,
  Eye,
  EyeOff,
  Map,
  UserCheck,
  AlertTriangle,
  Copy,
  CheckCircle2,
  Check,
} from "lucide-react";
import userApi from "../services/api/userApi";
import { areaApi } from "../services/api/areaApi";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "User", label: "User" },
  { value: "QTV", label: "QLKV" },
  { value: "KTV", label: "ĐXL" },
];

const roleLabels = {
  User: "User",
  QTV: "QLKV",
  KTV: "ĐXL",
};

const normalizeRole = (role) => {
  if (!role) return "User";
  if (role === "citizen" || role === "User") return "User";
  if (role === "admin" || role === "QTV" || role === "Admin") return "QTV";
  if (role === "maintenance" || role === "KTV") return "KTV";
  return role;
};

const removeAccents = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt động" },
  { value: "locked", label: "Bị Khóa" },
  { value: "banned", label: "Bị Cấm" },
];

const statusStyle = {
  active: "bg-emerald-100 text-emerald-700",
  locked: "bg-amber-100 text-amber-700",
  banned: "bg-red-100 text-red-700",
};

const statusLabel = {
  active: "Hoạt Động",
  locked: "Bị Khóa",
  banned: "Bị Cấm",
};

const emptyForm = {
  name: "",
  phone: "",
  role: "QTV",
  area: "Sơn Trà",
  status: "active",
  password: "",
};

const normalizeUser = (user) => ({
  id: user.id || `user${String(user.user_id || "").padStart(3, "0")}`,
  user_id: user.user_id,
  name: user.name || user.full_name || "",
  phone: user.phone || "",
  role: normalizeRole(user.role),
  area: user.area || "",
  status: user.status || user.account_status || "active",
});

const resolveUserId = (user) => {
  if (Number.isFinite(user?.user_id)) {
    return user.user_id;
  }

  const fallback = Number(String(user?.id || "").replace(/\D/g, ""));
  return Number.isFinite(fallback) ? fallback : null;
};

export default function UserTable() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [areas, setAreas] = useState([]);
  const [searchAreaQuery, setSearchAreaQuery] = useState("");
  const [isFilterAreaOpen, setIsFilterAreaOpen] = useState(false);
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const pageSize = 6;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [copyToast, setCopyToast] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form states
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const generateRandomPasswordStr = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleAddClick = () => {
    setFormData({ ...emptyForm, password: generateRandomPasswordStr() });
    setShowPassword(false);
    setShowAddModal(true);
  };

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await userApi.getManagementUsers({
        search,
        role: roleFilter,
        area: areaFilter,
        status: statusFilter,
        page: currentPage,
        limit: pageSize,
      });

      const payload = response?.data;
      setUsers((payload?.data || []).map(normalizeUser));
      setTotalPages(payload?.pagination?.totalPages || 1);
    } catch (error) {
      setUsers([]);
      setTotalPages(1);
      setErrorMessage(
        error?.response?.data?.message || "Không thể tải danh sách người dùng",
      );
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, areaFilter, statusFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await areaApi.getAllAreas();
        if (response.data?.success) {
          setAreas(response.data.data || []);
        }
      } catch (error) {}
    };
    fetchAreas();
  }, []);

  useEffect(() => {
    if (errorInfo) {
      const timer = setTimeout(() => setErrorInfo(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorInfo]);

  useEffect(() => {
    if (copyToast) {
      const timer = setTimeout(() => setCopyToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copyToast]);

  const totalPagesSafe = Math.max(totalPages, 1);
  const safePage = Math.min(currentPage, totalPagesSafe);
  const pageUsers = users;

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () =>
    setCurrentPage((p) => Math.min(totalPagesSafe, p + 1));

  // Handle Add User
  const handleAddUser = async () => {
    try {
      await userApi.createManagementUser(formData);
      const submittedInfo = {
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };
      setShowAddModal(false);
      setFormData(emptyForm);
      setShowPassword(false);
      setSuccessInfo(submittedInfo);
      await fetchUsers();
    } catch (error) {
      setErrorInfo(error?.response?.data?.message || "Không thể thêm người dùng");
    }
  };

  // Handle Edit User
  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      role: user.role,
      area: user.area,
      status: user.status,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const userId = resolveUserId(editingUser);
      if (!userId) {
        setErrorInfo("Không xác định được ID người dùng");
        return;
      }

      await userApi.updateManagementUser(userId, formData);
      setShowEditModal(false);
      setEditingUser(null);
      setFormData(emptyForm);
      await fetchUsers();
    } catch (error) {
      setErrorInfo(error?.response?.data?.message || "Không thể cập nhật người dùng");
    }
  };

  // Handle Delete User
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const userId = resolveUserId(userToDelete);
      if (!userId) {
        setErrorInfo("Không xác định được ID người dùng");
        setUserToDelete(null);
        return;
      }

      // Check 1: Không được xóa tài khoản đang đăng nhập
      if (user && resolveUserId(user) === userId) {
        setErrorInfo("Không thể xóa tài khoản đang đăng nhập hiện tại.");
        setUserToDelete(null);
        return;
      }

      // Check 2: Không được xóa tài khoản QLKV duy nhất
      if (userToDelete.role === "QTV" || userToDelete.role === "QLKV") {
        const qtvRes = await userApi.getManagementUsers({ role: "QTV", page: 1, limit: 1 });
        const qtvTotal = qtvRes?.data?.pagination?.total;
        
        if (qtvTotal !== undefined && qtvTotal <= 1) {
          setErrorInfo("Không thể xóa. Cần có ít nhất 1 Quản lý khu vực (QLKV) trong hệ thống.");
          setUserToDelete(null);
          return;
        }
      }

      await userApi.deleteManagementUser(userId);
      setUserToDelete(null);
      await fetchUsers();
    } catch (error) {
      setErrorInfo(error?.response?.data?.message || "Không thể xóa người dùng");
      setUserToDelete(null);
    }
  };

  // Handle Lock/Unlock User
  const handleToggleLock = async (user) => {
    try {
      const userId = resolveUserId(user);
      if (!userId) {
        setErrorInfo("Không xác định được ID người dùng");
        return;
      }

      const nextStatus = user.status === "active" ? "locked" : "active";
      await userApi.updateManagementUserStatus(userId, nextStatus);
      await fetchUsers();
    } catch (error) {
      setErrorInfo(
        error?.response?.data?.message || "Không thể đổi trạng thái người dùng",
      );
    }
  };

  return (
    <div className="space-y-4 w-full flex flex-col flex-1 min-w-0">
      {/* Hàng filter trên cùng */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="flex-1 w-full lg:w-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm bg-[#f8fafc] border-gray-200 text-gray-700">
            <Search className="w-4 h-4 opacity-70" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm bằng tên hoặc SĐT"
              className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400"
            />
          </div>
        </div>

        {/* Droplist + button */}
        <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:gap-3 w-full lg:w-auto">
          {/* Vai trò */}
          <div className="relative flex-1 lg:flex-none min-w-[140px]">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-4 pr-10 py-2.5 lg:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Khu vực */}
          <Popover 
            open={isFilterAreaOpen} 
            onOpenChange={(open) => {
              setIsFilterAreaOpen(open);
              if (!open) setSearchAreaQuery("");
            }}
          >
            <PopoverTrigger asChild>
              <button className="flex relative flex-1 lg:flex-none min-w-[140px] items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm">
                <span className="truncate text-left flex-1">
                  {areaFilter === "all"
                    ? "Tất cả khu vực"
                    : areas.find((a) => a.name === areaFilter)?.name ||
                      "Tất cả khu vực"}
                </span>
                <ChevronDown className="shrink-0 ml-2 h-4 w-4 text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[200px] p-2 bg-white border border-gray-200 shadow-xl rounded-xl z-50"
              align="start"
              side="bottom"
              sideOffset={8}
            >
              <Input
                placeholder="Tìm phường/xã..."
                value={searchAreaQuery}
                onChange={(e) => setSearchAreaQuery(e.target.value)}
                className="mb-2 h-9 text-sm rounded-md"
              />
              <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                <div
                  className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors ${areaFilter === "all" ? "bg-gray-100 font-medium" : ""}`}
                  onClick={() => {
                    setAreaFilter("all");
                    setIsFilterAreaOpen(false);
                    setCurrentPage(1);
                  }}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${areaFilter === "all" ? "opacity-100" : "opacity-0"}`}
                  />
                  Tất cả khu vực
                </div>
                {areas
                  .filter((a) =>
                    removeAccents(a.name).includes(
                      removeAccents(searchAreaQuery)
                    )
                  )
                  .map((area) => (
                    <div
                      key={area.area_id}
                      className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors ${areaFilter === area.name ? "bg-gray-100 font-medium" : ""}`}
                      onClick={() => {
                        setAreaFilter(area.name);
                        setIsFilterAreaOpen(false);
                        setCurrentPage(1);
                      }}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${areaFilter === area.name ? "opacity-100" : "opacity-0"}`}
                      />
                      {area.name}
                    </div>
                  ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Trạng thái */}
          <div className="relative flex-1 lg:flex-none min-w-[140px]">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-4 pr-10 py-2.5 lg:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Nút Thêm User */}
          <button
            type="button"
            onClick={handleAddClick}
            className="ml-auto flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Thêm User
          </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[500px] max-h-full flex flex-col overflow-hidden">
              <div className="bg-[#0b5cd6] p-4 sm:p-5 text-white pb-5 sm:pb-6 shrink-0">
                <h3 className="text-xl sm:text-2xl font-bold mb-1">
                  Thêm Người Dùng Mới
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm">
                  Điền thông tin chi tiết để cấp quyền truy cập hệ thống.
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Họ và tên người dùng
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                    placeholder="Nhập tên đầy đủ..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
                      maxLength={10}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                      placeholder="0912 345 678"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Vai trò
                    </label>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                      >
                        <option value="QTV">QLKV</option>
                        <option value="KTV">ĐXL</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Khu vực
                  </label>
                  <Popover
                    open={areaPickerOpen}
                    onOpenChange={(open) => {
                      setAreaPickerOpen(open);
                      if (!open) setSearchAreaQuery("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium cursor-pointer"
                      >
                        <span className="truncate">
                          {formData.area || "-- Chọn khu vực --"}
                        </span>
                        <Map className="w-5 h-5 text-gray-500 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="z-[10001] w-[--radix-popover-trigger-width] rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                      align="start"
                      side="bottom"
                      sideOffset={8}
                    >
                      <Input
                        placeholder="Tìm phường/xã..."
                        value={searchAreaQuery}
                        onChange={(e) => setSearchAreaQuery(e.target.value)}
                        className="mb-2 h-9 text-sm rounded-md"
                      />
                      <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {areas
                          .filter((a) =>
                            removeAccents(a.name).includes(
                              removeAccents(searchAreaQuery)
                            )
                          )
                          .map((a) => {
                            const selected = formData.area === a.name;
                            return (
                              <div
                                key={a.area_id}
                                className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors ${selected ? "bg-gray-100 font-medium" : ""}`}
                                onClick={() => {
                                  setFormData({ ...formData, area: a.name });
                                  setAreaPickerOpen(false);
                                  setSearchAreaQuery("");
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`}
                                />
                                {a.name}
                              </div>
                            );
                          })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium pr-12 tracking-widest placeholder:tracking-normal"
                      placeholder="••••••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 pt-1">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setFormData(emptyForm);
                      setShowPassword(false);
                    }}
                    className="flex-1 py-2 sm:py-2.5 px-4 border-2 border-[#0b5cd6] rounded-full text-[#0b5cd6] font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddUser}
                    className="flex-1 py-2 sm:py-2.5 px-4 bg-[#0b5cd6] text-white rounded-full font-semibold hover:bg-[#094bb0] transition-colors shadow-lg shadow-blue-500/30 text-sm sm:text-base"
                  >
                    Thêm
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit User Modal */}
      {showEditModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[500px] max-h-full flex flex-col overflow-hidden">
              <div className="bg-[#0b5cd6] p-4 sm:p-5 text-white pb-5 sm:pb-6 shrink-0">
                <h3 className="text-xl sm:text-2xl font-bold mb-1">
                  Chỉnh Sửa User
                </h3>
                <p className="text-blue-100 text-xs sm:text-sm">
                  Cập nhật thông tin chi tiết của người dùng này.
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                    Họ và tên người dùng
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                    placeholder="Nhập tên"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData({ ...formData, phone: val });
                      }}
                      maxLength={10}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                      placeholder="Ví dụ: 0912345678"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Vai trò
                    </label>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                      >
                        <option value="User">User</option>
                        <option value="QTV">Quản lý khu vực</option>
                        <option value="KTV">ĐXL</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Khu vực
                    </label>
                  <Popover
                    open={areaPickerOpen}
                    onOpenChange={(open) => {
                      setAreaPickerOpen(open);
                      if (!open) setSearchAreaQuery("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium cursor-pointer"
                      >
                        <span className="truncate">
                          {formData.area || "-- Chọn khu vực --"}
                        </span>
                        <Map className="w-5 h-5 text-gray-500 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="z-[10001] w-[--radix-popover-trigger-width] rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
                      align="start"
                      side="bottom"
                      sideOffset={8}
                    >
                      <Input
                        placeholder="Tìm phường/xã..."
                        value={searchAreaQuery}
                        onChange={(e) => setSearchAreaQuery(e.target.value)}
                        className="mb-2 h-9 text-sm rounded-md"
                      />
                      <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                        {areas
                          .filter((a) =>
                            removeAccents(a.name).includes(
                              removeAccents(searchAreaQuery)
                            )
                          )
                          .map((a) => {
                            const selected = formData.area === a.name;
                            return (
                              <div
                                key={a.area_id}
                                className={`flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-100 transition-colors ${selected ? "bg-gray-100 font-medium" : ""}`}
                                onClick={() => {
                                  setFormData({ ...formData, area: a.name });
                                  setAreaPickerOpen(false);
                                  setSearchAreaQuery("");
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${selected ? "opacity-100" : "opacity-0"}`}
                                />
                                {a.name}
                              </div>
                            );
                          })}
                      </div>
                    </PopoverContent>
                  </Popover>
                  </div>

                  <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
                      Trạng thái
                    </label>
                    <div className="relative">
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                      >
                        <option value="active">Hoạt động</option>
                        <option value="locked">Bị Khóa</option>
                        <option value="banned">Bị Cấm</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 pt-1">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
                      setFormData(emptyForm);
                    }}
                    className="flex-1 py-2 sm:py-2.5 px-4 border-2 border-[#0b5cd6] rounded-full text-[#0b5cd6] font-semibold hover:bg-blue-50 transition-colors text-sm sm:text-base"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-2 sm:py-2.5 px-4 bg-[#0b5cd6] text-white rounded-full font-semibold hover:bg-[#094bb0] transition-colors shadow-lg shadow-blue-500/30 text-sm sm:text-base"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Bảng */}
      <div className="w-full overflow-x-auto rounded-xl lg:rounded-2xl border shadow-sm bg-white border-gray-100 flex-1">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f9fafb] text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium text-left whitespace-nowrap">
                ID
              </th>
              <th className="px-4 py-3 font-medium text-left whitespace-nowrap">
                Tên
              </th>
              <th className="px-4 py-3 font-medium text-left whitespace-nowrap">
                SĐT
              </th>
              <th className="px-4 py-3 font-medium text-left whitespace-nowrap">
                Vai trò
              </th>
              <th className="px-4 py-3 font-medium text-left whitespace-nowrap">
                Khu vực
              </th>
              <th className="px-4 py-3 font-medium text-left whitespace-nowrap">
                Trạng thái
              </th>
              <th className="px-4 py-3 font-medium text-center whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-gray-400 text-sm"
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            )}

            {!loading && pageUsers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-gray-400 text-sm"
                >
                  {errorMessage || "Không tìm thấy người dùng phù hợp."}
                </td>
              </tr>
            )}

            {!loading &&
              pageUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                    {u.id}
                  </td>

                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{u.phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {roleLabels[u.role] || u.role}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{u.area}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        statusStyle[u.status]
                      }`}
                    >
                      {statusLabel[u.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleLock(u)}
                        className={`${
                          u.status === "active"
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-emerald-500 hover:text-emerald-600"
                        }`}
                        title={
                          u.status === "active"
                            ? "Khóa tài khoản"
                            : "Mở khóa tài khoản"
                        }
                      >
                        {u.status === "active" ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClick(u)}
                        className="text-blue-500 hover:text-blue-600"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(u)}
                        className="text-red-500 hover:text-red-600"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Footer phân trang */}
        <div className="flex items-center justify-center gap-4 px-4 py-3 text-xs text-gray-500">
          <button
            type="button"
            onClick={handlePrev}
            disabled={safePage === 1}
            className="px-2 py-1 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {"<"}
          </button>
          <span>
            {safePage} / {totalPagesSafe}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={safePage === totalPagesSafe}
            className="px-2 py-1 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {">"}
          </button>
        </div>
      </div>

      {/* Success Info Modal */}
      {successInfo &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] flex flex-col overflow-hidden">
              <div className="bg-emerald-500 p-5 text-white flex items-center gap-4 shrink-0">
                <div className="bg-white/20 p-3 rounded-full">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Thêm Thành Công</h3>
                  <p className="text-emerald-50 text-sm">Hãy lưu lại thông tin đăng nhập.</p>
                </div>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase mb-1">Tài khoản (SĐT)</span>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 text-lg">{successInfo.phone}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(successInfo.phone);
                          setCopyToast("Đã sao chép tài khoản");
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Sao chép tài khoản"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-[1px] bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase mb-1">Mật khẩu</span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 text-xl tracking-wider">{successInfo.password}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(successInfo.password);
                          setCopyToast("Đã sao chép mật khẩu");
                        }}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Sao chép mật khẩu"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-[1px] bg-gray-200"></div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-500 uppercase mb-1">Vai trò</span>
                    <span className="font-semibold text-[#0b5cd6]">
                      {successInfo.role === "QTV" ? "Quản lý khu vực (QLKV)" : "Đội xử lý (ĐXL)"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSuccessInfo(null)}
                  className="w-full py-3 px-4 bg-emerald-500 text-white rounded-full font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                >
                  Xác nhận & Đóng
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      {userToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-[400px] flex flex-col overflow-hidden">
              <div className="p-6 sm:p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Xác Nhận Xóa</h3>
                <p className="text-gray-500 text-sm">
                  Bạn có chắc chắn muốn xóa người dùng <span className="font-bold text-gray-800">"{userToDelete.name}"</span> không? Hành động này không thể hoàn tác.
                </p>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 py-2.5 px-4 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Error Info Toast */}
      {errorInfo &&
        createPortal(
          <div className="fixed top-6 right-6 z-[9999] w-[320px] bg-white border border-red-100 border-l-4 border-l-red-500 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-start p-4">
            <div className="flex-shrink-0 bg-red-50 rounded-full p-2 mr-3 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-sm font-bold text-gray-900 mb-0.5">Lỗi Xảy Ra</h3>
              <p className="text-sm text-gray-600 leading-snug break-words">{errorInfo}</p>
            </div>
            <button
              onClick={() => setErrorInfo(null)}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>,
          document.body
        )}

      {/* Copy Toast */}
      {copyToast &&
        createPortal(
          <div className="fixed top-6 right-6 z-[9999] w-[320px] bg-white border border-emerald-100 border-l-4 border-l-emerald-500 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center p-4">
            <div className="flex-shrink-0 bg-emerald-50 rounded-full p-2 mr-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-sm font-bold text-gray-900">{copyToast}</h3>
            </div>
            <button
              onClick={() => setCopyToast(null)}
              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
