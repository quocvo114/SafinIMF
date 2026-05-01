import React, { useEffect, useMemo, useState } from "react";
import { Search, Plus, Building2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IncidentTypePopup, {
  INCIDENT_ICON_MAP,
} from "@/components/IncidentTypePopup";
import incidentApi from "@/services/api/incidentApi";

const PAGE_SIZE = 6;

const hexToRgb = (hexColor) => {
  const hex = (hexColor || "").replace("#", "");
  if (hex.length !== 6) return { r: 59, g: 130, b: 246 };

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
};

const getCardShadow = (hexColor) => {
  const { r, g, b } = hexToRgb(hexColor);
  return `0 14px 32px rgba(${r}, ${g}, ${b}, 0.16), 0 2px 10px rgba(15, 23, 42, 0.06)`;
};

const IncidentManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingIncident, setDeletingIncident] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingIncident, setEditingIncident] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIconKey, setEditIconKey] = useState("car");
  const [editColor, setEditColor] = useState("#f97316");
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIconKey, setNewIconKey] = useState("public");
  const [newColor, setNewColor] = useState("#f97316");
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const filteredIncidents = useMemo(
    () =>
      incidentTypes.filter((type) =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [incidentTypes, searchQuery],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredIncidents.length / PAGE_SIZE),
  );

  const pageIncidents = useMemo(() => {
    const page = Math.min(currentPage, totalPages);
    const start = (page - 1) * PAGE_SIZE;
    return filteredIncidents.slice(start, start + PAGE_SIZE);
  }, [filteredIncidents, currentPage, totalPages]);

  const fetchIncidentTypes = async () => {
    try {
      setLoading(true);
      const response = await incidentApi.getIncidentTypes({ includeUsage: true });

      if (response?.success) {
        setIncidentTypes(response.data || []);
      } else {
        setIncidentTypes([]);
        toast.error("Không thể tải danh sách loại sự cố");
      }
    } catch (error) {
      setIncidentTypes([]);
      toast.error(
        error?.response?.data?.message || "Không thể tải danh sách loại sự cố",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentTypes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleEditClick = (incident) => {
    setEditingIncident(incident);
    setEditName(incident.name);
    setEditDescription(incident.description || "");
    setEditIconKey(incident.iconKey || "public");
    setEditColor(incident.color || "#f97316");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingIncident || !editName.trim()) return;

    try {
      setActionLoading(true);
      const response = await incidentApi.updateIncidentType(editingIncident._id, {
        name: editName.trim(),
        description: editDescription.trim(),
        iconKey: editIconKey,
        color: editColor,
      });

      if (response?.success) {
        toast.success("Cập nhật loại sự cố thành công");
        setShowEditModal(false);
        setEditingIncident(null);
        await fetchIncidentTypes();
      } else {
        toast.error("Cập nhật loại sự cố thất bại");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Không thể cập nhật loại sự cố",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddIncident = async () => {
    if (!newName.trim()) return;

    try {
      setActionLoading(true);
      const response = await incidentApi.createIncidentType({
        name: newName.trim(),
        description: newDescription.trim(),
        iconKey: newIconKey,
        color: newColor,
      });

      if (response?.success) {
        toast.success("Thêm loại sự cố thành công");
        setShowAddModal(false);
        setNewName("");
        setNewDescription("");
        setNewIconKey("public");
        setNewColor("#f97316");
        await fetchIncidentTypes();
      } else {
        toast.error("Thêm loại sự cố thất bại");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Không thể thêm loại sự cố");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteIncident = (incident) => {
    setDeletingIncident(incident);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteIncident = async () => {
    if (!deletingIncident?._id) return;

    try {
      setActionLoading(true);
      const response = await incidentApi.deleteIncidentType(deletingIncident._id);

      if (response?.success) {
        toast.success("Xóa loại sự cố thành công");
        setShowDeleteConfirm(false);
        setDeletingIncident(null);
        await fetchIncidentTypes();
      }
    } catch (error) {
      const apiMessage = error?.response?.data?.message;
      if (error?.response?.status === 409) {
        toast.error(apiMessage || "Không thể xóa vì có báo cáo đang xử lý");
      } else {
        toast.error(apiMessage || "Không thể xóa loại sự cố");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const cancelDeleteIncident = () => {
    setShowDeleteConfirm(false);
    setDeletingIncident(null);
  };

  return (
    <div className="h-full bg-transparent px-1 py-2 sm:px-3 sm:py-3">
      <div className="mx-auto flex h-full w-full max-w-[1322px] flex-col">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative rounded-xl bg-white w-full lg:w-[410px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              size={20}
            />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên loại sự cố để tìm kiếm"
              className="h-[50px] rounded-[10px] border-gray-200 bg-[#fcfcff] pl-10 pr-4"
            />
          </div>

          <Button
            onClick={() => setShowAddModal(true)}
            className="h-[45px] w-full rounded-[10px] bg-blue-600 px-5 text-white hover:bg-blue-700 sm:w-auto"
          >
            <Plus size={18} />
            Thêm Loại Sự Cố
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 text-gray-500">
            Đang tải danh sách loại sự cố...
          </div>
        ) : filteredIncidents.length > 0 ? (
          <>
            <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:grid-rows-2">
              {pageIncidents.map((type) => {
                const IconComponent = INCIDENT_ICON_MAP[type.iconKey] || Building2;

                return (
                  <Card
                    key={type._id || type.id}
                    className="h-full min-h-[240px] gap-0 overflow-hidden rounded-[34px] border border-[#eceef3] bg-white py-0 shadow-none ring-0"
                    style={{ boxShadow: getCardShadow(type.color || "#f97316") }}
                  >
                    <CardContent className="flex h-full flex-col items-center gap-3 px-4 py-5 text-center sm:px-5">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full"
                        style={{ backgroundColor: type.color || "#f97316" }}
                      >
                        <IconComponent size={24} className="text-white" />
                      </div>

                      <h3 className="text-2xl font-semibold leading-tight text-gray-800 sm:text-[26px] lg:text-[24px] xl:text-[28px]">
                        {type.name}
                      </h3>
                      <p className="line-clamp-2 min-h-[42px] max-w-[330px] text-[13px] text-gray-500 sm:text-[12px] xl:text-[13px]">
                        {type.description}
                      </p>

                      <div className="mt-auto flex w-full max-w-[343px] flex-col items-stretch justify-center gap-2 sm:h-[44px] sm:flex-row sm:items-center">
                        <Button
                          variant="outline"
                          onClick={() => handleEditClick(type)}
                          className="h-10 flex-1 rounded-[10px] border-gray-200 bg-white text-[14px] font-medium text-gray-800 hover:bg-gray-50 sm:h-full"
                        >
                          <Pencil size={14} />
                          chỉnh sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-lg"
                          className="h-10 w-full rounded-[10px] border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 sm:h-full sm:w-[50px]"
                          onClick={() => handleDeleteIncident(type)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-4 overflow-x-auto">
              <Pagination className="min-w-max">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text="Trước"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((prev) => Math.max(prev - 1, 1));
                      }}
                      className={
                        currentPage === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, idx) => {
                    const page = idx + 1;
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === page}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text="Sau"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-gray-500">
            Không tìm thấy loại sự cố nào
          </div>
        )}
      </div>

      <IncidentTypePopup
        open={showAddModal}
        title="Thêm/sửa loại sự cố"
        subtitle="Cập nhật thông tin chi tiết cho danh mục hạ tầng"
        submitLabel="Lưu thay đổi"
        name={newName}
        description={newDescription}
        selectedIcon={newIconKey}
        selectedColor={newColor}
        onNameChange={setNewName}
        onDescriptionChange={setNewDescription}
        onIconChange={setNewIconKey}
        onColorChange={setNewColor}
        onClose={() => {
          setShowAddModal(false);
          setNewName("");
          setNewDescription("");
          setNewIconKey("public");
          setNewColor("#f97316");
        }}
        onSubmit={handleAddIncident}
        isSaving={actionLoading}
      />

      <IncidentTypePopup
        open={showEditModal && Boolean(editingIncident)}
        title="Thêm/sửa loại sự cố"
        subtitle="Cập nhật thông tin chi tiết cho danh mục hạ tầng"
        submitLabel="Lưu thay đổi"
        name={editName}
        description={editDescription}
        selectedIcon={editIconKey}
        selectedColor={editColor}
        onNameChange={setEditName}
        onDescriptionChange={setEditDescription}
        onIconChange={setEditIconKey}
        onColorChange={setEditColor}
        onClose={() => {
          setShowEditModal(false);
          setEditingIncident(null);
        }}
        onSubmit={handleSaveEdit}
        isSaving={actionLoading}
      />

      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) setDeletingIncident(null);
        }}
      >
        <DialogContent className="max-w-md rounded-2xl border-0 bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Xác nhận xóa
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Bạn có chắc chắn muốn xóa loại sự cố
              <span className="font-semibold text-gray-800">
                {` ${deletingIncident?.name || "này"}`}
              </span>
              ? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={cancelDeleteIncident}
              disabled={actionLoading}
              className="h-10 w-full rounded-lg border-gray-200 px-4 sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={confirmDeleteIncident}
              disabled={actionLoading}
              className="h-10 w-full rounded-lg bg-red-600 px-4 text-white hover:bg-red-700 sm:w-auto"
            >
              {actionLoading ? "Đang xử lý..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncidentManagement;