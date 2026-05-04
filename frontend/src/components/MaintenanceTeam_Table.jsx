import React, { useCallback, useEffect, useState } from "react";
import { Search, Plus, X, Lock, Pencil, Trash2 } from "lucide-react";
import { maintenanceTeamApi } from "../services/api/maintenanceTeamApi";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AREA_OPTIONS = [
  { value: "Sơn Trà", label: "Sơn Trà" },
  { value: "Liên Chiểu", label: "Liên Chiểu" },
  { value: "Hải Châu", label: "Hải Châu" },
  { value: "Hòa Xuân", label: "Hòa Xuân" },
  { value: "Khuê Trung", label: "Khuê Trung" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Hoạt Động" },
  { value: "inactive", label: "Bị Khóa" },
];

const SPECIALTY_OPTIONS = [
  { value: "Cầu đường", label: "Cầu đường" },
  { value: "Biển báo & vạch kẻ", label: "Biển báo & vạch kẻ" },
  { value: "Đèn chiếu sáng", label: "Đèn chiếu sáng" },
  { value: "Đèn tín hiệu giao thông", label: "Đèn tín hiệu giao thông" },
  { value: "Cây bóng mát", label: "Cây bóng mát" },
  { value: "Thoát nước", label: "Thoát nước" },
  { value: "Cầu cống", label: "Cầu cống" },
  { value: "Vỉa hè", label: "Vỉa hè" },
  { value: "Khác", label: "Khác" },
];

const statusStyle = {
  active: "bg-blue-100 text-blue-800 border-blue-200",
  inactive: "bg-amber-100 text-amber-800 border-amber-200",
};

const getSpecialtyStyle = (specialty) => {
  const s = specialty?.toLowerCase() || "";
  if (s.includes("cầu đường"))
    return "bg-orange-100 text-orange-700 border-orange-200";
  if (s.includes("cầu cống"))
    return "bg-purple-100 text-purple-700 border-purple-200";
  if (s.includes("vỉa hè")) return "bg-zinc-200 text-zinc-700 border-zinc-300";
  if (s.includes("đèn chiếu sáng"))
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (s.includes("đèn tín hiệu"))
    return "bg-red-100 text-red-700 border-red-200";
  if (s.includes("cây"))
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (s.includes("thoát nước")) return "bg-sky-100 text-sky-700 border-sky-200";
  if (s.includes("biển báo"))
    return "bg-teal-100 text-teal-800 border-teal-200";
  return "bg-gray-100 text-gray-600 border-gray-200";
};

const emptyForm = {
  id: "",
  name: "",
  leader: "",
  specialty: "",
  memberCount: 1,
  area: "Hải Châu",
  status: "active",
};

const normalizeTeam = (team) => ({
  id: team.team_id || team.id,
  name: team.name || "",
  leader: team.leader || "",
  specialty: team.specialty || "",
  memberCount: team.memberCount ?? team.member_count ?? 1,
  area: team.area || "",
  status: team.status || "active",
});

const inputClass =
  "w-full h-10 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-gray-400";

const MaintenanceTeam_Table = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const itemsPerPage = 10;

  const [formData, setFormData] = useState(emptyForm);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await maintenanceTeamApi.getTeams({
        search,
        area: areaFilter || "all",
        status: statusFilter || "all",
        page: currentPage,
        limit: itemsPerPage,
      });
      setTeams((response?.data || []).map(normalizeTeam));
      setTotalPages(response?.pagination?.totalPages || 1);
    } catch (error) {
      setTeams([]);
      setTotalPages(1);
      setErrorMessage(
        error?.response?.data?.message || "Không tải được danh sách đội xử lý",
      );
    } finally {
      setLoading(false);
    }
  }, [search, areaFilter, statusFilter, currentPage]);

  useEffect(() => {
    const timer = setTimeout(fetchTeams, 250);
    return () => clearTimeout(timer);
  }, [fetchTeams]);

  const handleAddTeam = async () => {
    try {
      if (!formData.name || !formData.leader || !formData.id) return;
      await maintenanceTeamApi.createTeam({
        id: formData.id,
        name: formData.name,
        specialty: formData.specialty,
        leader: formData.leader,
        memberCount: parseInt(formData.memberCount, 10) || 1,
        area: formData.area,
        status: formData.status,
      });
      setShowAddModal(false);
      setFormData(emptyForm);
      await fetchTeams();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể thêm đội xử lý");
    }
  };

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setFormData(team);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingTeam) return;
      await maintenanceTeamApi.updateTeam(editingTeam.id, {
        name: formData.name,
        specialty: formData.specialty,
        leader: formData.leader,
        memberCount: parseInt(formData.memberCount, 10) || 1,
        area: formData.area,
        status: formData.status,
      });
      setShowEditModal(false);
      setEditingTeam(null);
      setFormData(emptyForm);
      await fetchTeams();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật đội xử lý",
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Bạn có chắc muốn xóa đội xử lý này?")) return;
      await maintenanceTeamApi.deleteTeam(id);
      await fetchTeams();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể xóa đội xử lý");
    }
  };

  const handleToggleLock = async (id, currentStatus) => {
    try {
      const nextStatus = currentStatus === "inactive" ? "active" : "inactive";
      await maintenanceTeamApi.updateTeamStatus(id, nextStatus);
      await fetchTeams();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể đổi trạng thái đội xử lý",
      );
    }
  };

  const safePage = Math.min(currentPage, totalPages || 1);
  const pageTeams = teams;

  const handleNext = () => {
    if (safePage < totalPages) setCurrentPage(safePage + 1);
  };
  const handlePrev = () => {
    if (safePage > 1) setCurrentPage(safePage - 1);
  };

  return (
    <div className="space-y-4 p-0">
      {/* Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm bg-white border-gray-300 text-gray-700">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm đội..."
              className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 h-full py-0"
            />
          </div>
        </div>
        <div className="flex flex-wrap lg:flex-nowrap gap-2">
          <select
            value={areaFilter}
            onChange={(e) => {
              setAreaFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="min-w-[140px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:border-gray-400 outline-none"
          >
            <option value="all">Tất cả khu vực</option>
            {AREA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="min-w-[140px] px-3 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:border-gray-400 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="ml-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm Đội
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[420px] p-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Thêm Đội Xử Lý Mới
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(emptyForm);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team ID
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({ ...formData, id: e.target.value })
                  }
                  className={inputClass}
                  placeholder="VD: DT-01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Đội
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Nhập tên đội"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chuyên môn
                </label>
                <Select
                  value={formData.specialty}
                  onValueChange={(val) =>
                    setFormData({ ...formData, specialty: val })
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Chọn chuyên môn" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-[150]">
                    {SPECIALTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trưởng Đội
                </label>
                <input
                  type="text"
                  value={formData.leader}
                  onChange={(e) =>
                    setFormData({ ...formData, leader: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Nhập tên trưởng đội"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số Lượng Thành Viên
                </label>
                <input
                  type="number"
                  value={formData.memberCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memberCount: parseInt(e.target.value) || 1,
                    })
                  }
                  className={inputClass}
                  placeholder="Nhập số lượng"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khu Vực
                </label>
                <Select
                  value={formData.area}
                  onValueChange={(val) =>
                    setFormData({ ...formData, area: val })
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-[150]">
                    {AREA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng Thái
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-[150]">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(emptyForm);
                }}
                className="flex-1 h-10 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleAddTeam}
                className="flex-1 h-10 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
              >
                Thêm Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[420px] p-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Chỉnh Sửa Đội</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTeam(null);
                  setFormData(emptyForm);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {/* Ẩn Team ID khi sửa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên Đội
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Nhập tên đội"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chuyên môn
                </label>
                <Select
                  value={formData.specialty}
                  onValueChange={(val) =>
                    setFormData({ ...formData, specialty: val })
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Chọn chuyên môn" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-[150]">
                    {SPECIALTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trưởng Đội
                </label>
                <input
                  type="text"
                  value={formData.leader}
                  onChange={(e) =>
                    setFormData({ ...formData, leader: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Nhập tên trưởng đội"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số Lượng Thành Viên
                </label>
                <input
                  type="number"
                  value={formData.memberCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      memberCount: parseInt(e.target.value) || 1,
                    })
                  }
                  className={inputClass}
                  placeholder="Nhập số lượng"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khu Vực
                </label>
                <Select
                  value={formData.area}
                  onValueChange={(val) =>
                    setFormData({ ...formData, area: val })
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-[150]">
                    {AREA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng Thái
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData({ ...formData, status: val })
                  }
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-lg z-[150]">
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTeam(null);
                  setFormData(emptyForm);
                }}
                className="flex-1 h-10 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 h-10 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border shadow-sm bg-white border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-semibold text-left text-xs uppercase tracking-wider">
                Team ID
              </th>
              <th className="px-4 py-3 font-semibold text-left text-xs uppercase tracking-wider">
                Tên Đội
              </th>
              <th className="px-4 py-3 font-semibold text-left text-xs uppercase tracking-wider">
                Chuyên Môn
              </th>
              <th className="px-4 py-3 font-semibold text-left text-xs uppercase tracking-wider">
                Trưởng Đội
              </th>
              <th className="px-4 py-3 font-semibold text-center text-xs uppercase tracking-wider">
                SL
              </th>
              <th className="px-4 py-3 font-semibold text-left text-xs uppercase tracking-wider">
                Khu Vực
              </th>
              <th className="px-4 py-3 font-semibold text-left text-xs uppercase tracking-wider">
                Trạng Thái
              </th>
              <th className="px-4 py-3 font-semibold text-center text-xs uppercase tracking-wider">
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            )}
            {!loading && pageTeams.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  {errorMessage || "Không tìm thấy đội phù hợp."}
                </td>
              </tr>
            )}
            {!loading &&
              pageTeams.map((team) => (
                <tr
                  key={team.id}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {team.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {team.name}
                  </td>
                  <td className="px-4 py-3">
                    {team.specialty ? (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getSpecialtyStyle(team.specialty)}`}
                      >
                        {team.specialty}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        Chưa cập nhật
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                    {team.leader}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-center">
                    {team.memberCount}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{team.area}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusStyle[team.status]}`}
                    >
                      {team.status === "active" ? "Hoạt Động" : "Bị Khóa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(team)}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleLock(team.id, team.status)}
                        className={`p-1.5 rounded-md ${team.status === "active" ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(team.id)}
                        className="p-1.5 rounded-md text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="flex items-center justify-center gap-4 px-4 py-3 text-sm text-gray-500 border-t border-gray-200 ">
          <button
            onClick={handlePrev}
            disabled={safePage === 1}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Trước
          </button>
          <span className="font-medium text-gray-700">
            Trang {safePage} / {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTeam_Table;
