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
  RefreshCw,
  Map,
} from "lucide-react";
import userApi from "../services/api/userApi";

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

const AREA_OPTIONS = [
  { value: "all", label: "Tất cả khu vực" },
  { value: "Sơn Trà", label: "Sơn Trà" },
  { value: "Liên Chiểu", label: "Liên Chiểu" },
  { value: "Hải Châu", label: "Hải Châu" },
  { value: "Hòa Xuân", label: "Hòa Xuân" },
  { value: "Khuê Trung", label: "Khuê Trung" },
];

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
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const pageSize = 6;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const generateRandomPassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: pass }));
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
      setShowAddModal(false);
      setFormData(emptyForm);
      setShowPassword(false);
      await fetchUsers();
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể thêm người dùng");
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
        alert("Không xác định được ID người dùng");
        return;
      }

      await userApi.updateManagementUser(userId, formData);
      setShowEditModal(false);
      setEditingUser(null);
      setFormData(emptyForm);
      await fetchUsers();
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể cập nhật người dùng");
    }
  };

  // Handle Delete User
  const handleDelete = async (user) => {
    try {
      if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
        return;
      }

      const userId = resolveUserId(user);
      if (!userId) {
        alert("Không xác định được ID người dùng");
        return;
      }

      await userApi.deleteManagementUser(userId);
      await fetchUsers();
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể xóa người dùng");
    }
  };

  // Handle Lock/Unlock User
  const handleToggleLock = async (user) => {
    try {
      const userId = resolveUserId(user);
      if (!userId) {
        alert("Không xác định được ID người dùng");
        return;
      }

      const nextStatus = user.status === "active" ? "locked" : "active";
      await userApi.updateManagementUserStatus(userId, nextStatus);
      await fetchUsers();
    } catch (error) {
      alert(
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
          <div className="relative flex-1 lg:flex-none min-w-[140px]">
            <select
              value={areaFilter}
              onChange={(e) => {
                setAreaFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none pl-4 pr-10 py-2.5 lg:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer shadow-sm"
            >
              {AREA_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

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
            onClick={() => setShowAddModal(true)}
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
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                      placeholder="xxx-xxxx"
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
                  <div className="relative">
                    <select
                      value={formData.area}
                      onChange={(e) =>
                        setFormData({ ...formData, area: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                    >
                      <option value="Sơn Trà">Sơn Trà</option>
                      <option value="Liên Chiểu">Liên Chiểu</option>
                      <option value="Hải Châu">Hải Châu</option>
                      <option value="Hòa Xuân">Hòa Xuân</option>
                      <option value="Khuê Trung">Khuê Trung</option>
                    </select>
                    <Map className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                  </div>
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
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="flex items-center gap-2 mt-2.5 text-sm font-semibold text-[#0b5cd6] hover:text-blue-800 focus:outline-none"
                  >
                    <RefreshCw size={16} /> Tạo mật khẩu ngẫu nhiên
                  </button>
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
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium"
                      placeholder="(xxx) xxx-xxxx"
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
                    <div className="relative">
                      <select
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({ ...formData, area: e.target.value })
                        }
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                      >
                        <option value="Sơn Trà">Sơn Trà</option>
                        <option value="Liên Chiểu">Liên Chiểu</option>
                        <option value="Hải Châu">Hải Châu</option>
                        <option value="Hòa Xuân">Hòa Xuân</option>
                        <option value="Khuê Trung">Khuê Trung</option>
                      </select>
                      <Map className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
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
                        onClick={() => handleDelete(u)}
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
    </div>
  );
}
