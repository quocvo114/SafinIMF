import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  { value: "all", label: "Tất cả khu vực" },
  { value: "Sơn Trà", label: "Sơn Trà" },
  { value: "Liên Chiểu", label: "Liên Chiểu" },
  { value: "Hải Châu", label: "Hải Châu" },
  { value: "Hòa Xuân", label: "Hòa Xuân" },
  { value: "Khuê Trung", label: "Khuê Trung" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt Động" },
  { value: "inactive", label: "Bị Khóa" },
];

const statusStyle = {
  active: "bg-blue-100 text-blue-800",
  inactive: "bg-amber-100 text-amber-800",
};

const emptyForm = {
  id: "",
  name: "",
  leader: "",
  memberCount: 1,
  area: "Hải Châu",
  status: "active",
};

const normalizeTeam = (team) => ({
  id: team.team_id || team.id,
  name: team.name || "",
  leader: team.leader || "",
  memberCount: team.memberCount ?? team.member_count ?? 1,
  area: team.area || "",
  status: team.status || "active",
});

const MaintenanceTeam_Table = () => {
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamToDelete, setTeamToDelete] = useState(null);
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
    const timer = setTimeout(() => {
      fetchTeams();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTeams]);

  const handleAddTeam = async () => {
    try {
      if (!formData.name || !formData.leader || !formData.id) {
        return;
      }

      await maintenanceTeamApi.createTeam({
        id: formData.id,
        name: formData.name,
        leader: formData.leader,
        memberCount: parseInt(formData.memberCount, 10) || 1,
        area: formData.area,
        status: formData.status,
      });

      setShowAddModal(false);
      setFormData(emptyForm);
      await fetchTeams();
    } catch (error) {
      alert(error?.response?.data?.message || "Không thể thêm đội xử lý");
    }
  };

  const handleEditClick = (team) => {
    setEditingTeam(team);
    setFormData(team);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingTeam) {
        return;
      }

      await maintenanceTeamApi.updateTeam(editingTeam.id, {
        name: formData.name,
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
      alert(error?.response?.data?.message || "Không thể cập nhật đội xử lý");
    }
  };

  const confirmDelete = async () => {
    try {
      if (!teamToDelete) return;
      await maintenanceTeamApi.deleteTeam(teamToDelete.id);
      toast.success("Đã xóa đội xử lý thành công!");
      await fetchTeams();
      setTeamToDelete(null);
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
      alert(
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
    <div className="space-y-4">
      {/* Hàng filter trên cùng */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search */}
        <div className="flex-1">
          <div className="flex items-center gap-2 px-4 h-11 rounded-full border text-sm bg-[#f8fafc] border-gray-200 text-gray-700">
            <Search className="w-4 h-4 opacity-70" />
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

        {/* Filters + Add button */}
        <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:gap-3">
          {/* Khu vực */}
          <Select
            value={areaFilter}
            onValueChange={(value) => {
              setAreaFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="flex !h-11 min-w-[160px] shrink-0 items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-0 text-sm font-normal text-gray-700 hover:bg-gray-50 focus:border-gray-300 focus:ring-0 focus:ring-offset-0 focus-visible:border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none transition-colors data-[state=open]:bg-white [&>span]:truncate [&>span]:text-left [&>span]:flex-1 [&>svg]:opacity-50">
              <SelectValue placeholder="Tất cả khu vực" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden"
            >
              {AREA_OPTIONS.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus-visible:outline-none focus-visible:ring-0 outline-none data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
                >
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Trạng thái */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="flex !h-11 min-w-[160px] shrink-0 items-center justify-between rounded-full border border-gray-200 bg-white px-4 py-0 text-sm font-normal text-gray-700 hover:bg-gray-50 focus:border-gray-300 focus:ring-0 focus:ring-offset-0 focus-visible:border-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none outline-none transition-colors data-[state=open]:bg-white [&>span]:truncate [&>span]:text-left [&>span]:flex-1 [&>svg]:opacity-50">
              <SelectValue placeholder="Tất cả trạng thái" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden"
            >
              {STATUS_OPTIONS.map((o) => (
                <SelectItem
                  key={o.value}
                  value={o.value}
                  className="cursor-pointer rounded-sm py-1.5 pl-8 pr-2 text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus-visible:outline-none focus-visible:ring-0 outline-none data-[state=checked]:bg-gray-100 data-[state=checked]:font-medium [&>span:first-child]:left-2 [&>span:first-child]:right-auto"
                >
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Nút Thêm Đội */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="ml-auto inline-flex items-center justify-center gap-2 px-5 h-11 rounded-full text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Thêm Đội
          </button>
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddModal &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Thêm Đội Xử Lý Mới
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData(emptyForm);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nhập Team ID"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nhập tên đội"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nhập số lượng"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khu Vực
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="Sơn Trà">Sơn Trà</option>
                    <option value="Liên Chiểu">Liên Chiểu</option>
                    <option value="Hải Châu">Hải Châu</option>
                    <option value="Hòa Xuân">Hòa Xuân</option>
                    <option value="Khuê Trung">Khuê Trung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng Thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="active">Hoạt Động</option>
                    <option value="inactive">Bị Khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 sm:justify-end">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData(emptyForm);
                  }}
                  className="flex-1 sm:flex-none sm:w-24 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddTeam}
                  className="flex-1 sm:flex-none sm:w-24 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Edit Team Modal */}
      {/* Edit Team Modal */}
      {showEditModal &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Chỉnh Sửa Đội
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeam(null);
                    setFormData(emptyForm);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nhập tên đội"
                  />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Nhập số lượng"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khu Vực
                  </label>
                  <select
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="Sơn Trà">Sơn Trà</option>
                    <option value="Liên Chiểu">Liên Chiểu</option>
                    <option value="Hải Châu">Hải Châu</option>
                    <option value="Hòa Xuân">Hòa Xuân</option>
                    <option value="Khuê Trung">Khuê Trung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng Thái
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="active">Hoạt Động</option>
                    <option value="inactive">Bị Khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6 sm:justify-end">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTeam(null);
                    setFormData(emptyForm);
                  }}
                  className="flex-1 sm:flex-none sm:w-24 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 sm:flex-none sm:w-24 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Delete Confirmation Modal */}
      {teamToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Xóa đội xử lý?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa đội <b>{teamToDelete.name}</b> không?
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTeamToDelete(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-sm shadow-red-200"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Bảng */}
      <div className="overflow-x-auto rounded-2xl border shadow-sm bg-white border-gray-100">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f9fafb] text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium text-left">Team ID</th>
              <th className="px-4 py-3 font-medium text-left">Tên Đội</th>
              <th className="px-4 py-3 font-medium text-left">Trưởng Đội</th>
              <th className="px-4 py-3 font-medium text-left">Số Lượng</th>
              <th className="px-4 py-3 font-medium text-left">Khu Vực</th>
              <th className="px-4 py-3 font-medium text-left">Trạng Thái</th>
              <th className="px-4 py-3 font-medium text-center">Actions</th>
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

            {!loading && pageTeams.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-6 text-center text-gray-400 text-sm"
                >
                  {errorMessage || "Không tìm thấy đội phù hợp."}
                </td>
              </tr>
            )}

            {!loading &&
              pageTeams.map((team) => (
                <tr
                  key={team.id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {team.id}
                  </td>
                  <td className="px-4 py-3 font-medium">{team.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{team.leader}</td>
                  <td className="px-4 py-3">{team.memberCount}</td>
                  <td className="px-4 py-3">{team.area}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        statusStyle[team.status]
                      }`}
                    >
                      {team.status === "active" ? "Hoạt Động" : "Bị Khóa"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEditClick(team)}
                        className="text-blue-500 hover:text-blue-600"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleLock(team.id, team.status)}
                        className="text-amber-500 hover:text-amber-600"
                        title="Khóa / mở khóa"
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTeamToDelete(team)}
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
            {safePage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={safePage === totalPages}
            className="px-2 py-1 rounded-md border disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {">"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceTeam_Table;
