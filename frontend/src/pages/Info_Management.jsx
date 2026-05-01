import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import userApi from "../services/api/userApi";
import Toast from "../components/Toast";
import {
  User,
  Lock,
  Mail,
  Phone,
  Edit2,
  X,
  ChevronDown,
  ShieldAlert,
  KeyRound,
} from "lucide-react";

const Info_Management = ({ onClose }) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "", show: false });

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    gender: "Nam",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "Nam",
      });
    }
  }, [user]);

  const getRoleLabel = (role) => {
    const roleMap = {
      citizen: "Công Dân",
      admin: "Admin",
      manager: "QTV",
      maintenance: "KTV",
    };
    return roleMap[role] || "Công Dân";
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type, show: true });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      
      // Get all form inputs
      const modal = e.currentTarget.closest(".modal-content");
      if (!modal) return;
      
      const inputs = Array.from(modal.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input[type='password']"));
      const currentIndex = inputs.indexOf(e.currentTarget);
      
      // Focus next input or submit
      if (currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus();
      } else {
        // Submit on last input
        setTimeout(() => {
          if (passwordData.oldPassword || passwordData.newPassword) {
            handleChangePassword();
          } else {
            handleUpdateProfile();
          }
        }, 0);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.full_name.trim()) {
      showToast("Vui lòng nhập tên!", "error");
      return;
    }
    setLoading(true);
    try {
      // Only send fields that have values
      const dataToSend = {
        full_name: formData.full_name,
        phone: formData.phone,
        gender: formData.gender,
      };
      // Only include email if it's not empty
      if (formData.email && formData.email.trim()) {
        dataToSend.email = formData.email.trim();
      }
      
      await userApi.updateProfile(dataToSend);
      const updatedUser = { ...user, ...dataToSend };
      login(localStorage.getItem("token"), updatedUser);
      showToast("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error) {
      showToast(error.response?.data?.message || "Cập nhật thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      showToast("Vui lòng điền đầy đủ thông tin!", "error");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("Mật khẩu mới không trùng khớp!", "error");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast("Mật khẩu phải có ít nhất 6 ký tự!", "error");
      return;
    }
    setLoading(true);
    try {
      await userApi.changePassword(passwordData.oldPassword, passwordData.newPassword);
      showToast("Đổi mật khẩu thành công!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
    } catch (error) {
      showToast(error.response?.data?.message || "Đổi mật khẩu thất bại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "Nam",
      });
    }
    setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  const initials = formData.full_name
    ?.split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with Avatar */}
        <div className="bg-white pt-6 pb-4 px-6 text-center border-b border-gray-100">
          {/* Avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-300 to-orange-400 flex items-center justify-center shadow-lg text-4xl">
              🦆
            </div>
          </div>

          {/* Name and Badge */}
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {formData.full_name || "Bạc Xỉu"}
          </h2>
          <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            {getRoleLabel(user?.role)}
          </a>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 modal-content">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-blue-600">
                THÔNG TIN CÁ NHÂN
              </h3>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Full Name Card */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Họ Và Tên
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <p className="text-gray-800 font-semibold text-sm">{formData.full_name}</p>
                  )}
                </div>

                {/* Phone Card */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Số Điện Thoại
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <p className="text-gray-800 font-semibold text-sm">{formData.phone}</p>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Email Card */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Email
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  ) : (
                    <p className="text-gray-800 font-semibold text-sm">{formData.email}</p>
                  )}
                </div>

                {/* Gender Card */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Giới Tính
                  </label>
                  {isEditing ? (
                    <div className="relative w-full">
                      <button
                        type="button"
                        onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                        onKeyDown={handleKeyDown}
                        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-sm">{formData.gender}</span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 transition-transform ${
                            showGenderDropdown ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {showGenderDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                          {["Nam", "Nữ", "Khác"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  gender: option,
                                }));
                                setShowGenderDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-800 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-gray-800 font-semibold text-sm">{formData.gender}</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <ShieldAlert size={16} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-blue-600">
                BẢO MẬT
              </h3>
            </div>

            {showPasswordForm ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <input
                    type="password"
                    name="oldPassword"
                    value={passwordData.oldPassword}
                    onChange={handlePasswordChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập mật khẩu hiện tại"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Xác nhận mật khẩu mới"
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <KeyRound size={20} className="text-blue-500" />
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">Mật khẩu</h4>
                    <p className="text-xs text-gray-500">
                      Cập nhật mật khẩu để bảo mật Tài khoản
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0">
                  <Edit2 size={16} />
                  <span className="text-xs font-bold whitespace-nowrap">
                    Đổi mật khẩu
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between p-6 bg-white border-t border-gray-100">
          <button
            onClick={() => {
              if (showPasswordForm) {
                setShowPasswordForm(false);
                setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
              } else if (isEditing) {
                setIsEditing(false);
                setFormData({
                  full_name: user?.full_name || "",
                  email: user?.email || "",
                  phone: user?.phone || "",
                  gender: user?.gender || "Nam",
                });
              } else {
                handleCloseModal();
              }
            }}
            className="py-2 px-4 text-gray-600 font-semibold hover:text-gray-800 transition-colors"
          >
            Hủy
          </button>
          {!isEditing && !showPasswordForm ? (
            <button
              onClick={() => setIsEditing(true)}
              className="py-2 px-8 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all"
            >
              Chỉnh sửa
            </button>
          ) : (
            <button
              onClick={() => {
                if (showPasswordForm) {
                  handleChangePassword();
                } else {
                  handleUpdateProfile();
                }
              }}
              disabled={loading}
              className="py-2 px-8 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          )}
        </div>
      </div>

      {toast.show && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
};

export default Info_Management;
