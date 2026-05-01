import React, { useState } from "react";
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

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "Bạc Xỉu",
    email: user?.email || "bacxiu12@gmail.com",
    phone: user?.phone || "(+84) 8362946293",
    gender: user?.gender || "Nam",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    // Logic to save changes
    console.log("Saved:", formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 pt-8 pb-6 px-6 text-center">
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-lg">
              <User size={48} className="text-white" />
            </div>
          </div>

          {/* Username and Badge */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {formData.fullName}
          </h2>
          <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-sm font-medium text-blue-700">Công Dân</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-blue-500" />
              <h3 className="text-sm font-bold text-gray-700 tracking-wider">
                THÔNG TIN CÁ NHÂN
              </h3>
            </div>

            <div className="space-y-3">
              {/* Full Name Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  Họ và Tên
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{formData.fullName}</p>
                )}
              </div>

              {/* Email Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{formData.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Phone Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-start gap-3">
                  <Phone size={16} className="text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-500 mb-2">
                      Số Điện Thoại
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <p className="text-gray-800 font-medium">{formData.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Gender Card */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <label className="block text-xs font-semibold text-gray-500 mb-2">
                  Giới Tính
                </label>
                {isEditing ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                      className="w-full flex items-center justify-between bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium">{formData.gender}</span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${
                          showGenderDropdown ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {showGenderDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        {["Nam", "Nữ", "Khác"].map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                gender: option,
                              }));
                              setShowGenderDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-gray-800 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-gray-800 font-medium">{formData.gender}</p>
                    <ChevronDown size={16} className="text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={20} className="text-red-500" />
              <h3 className="text-sm font-bold text-gray-700 tracking-wider">
                BẢO MẬT
              </h3>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 border border-red-100 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <KeyRound size={20} className="text-red-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Mật khẩu</h4>
                  <p className="text-xs text-gray-600">
                    Cập nhật mật khẩu để bảo mật Tài khoản
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-2 text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
                <Edit2 size={18} />
                <span className="text-sm font-semibold whitespace-nowrap">
                  Đổi mật khẩu
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-3 p-6 bg-gray-50 border-t border-gray-100">
          <button
            onClick={handleCancel}
            className="flex-1 py-3 text-gray-700 font-semibold hover:text-gray-900 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-full hover:shadow-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105"
          >
            {isEditing ? "Lưu thay đổi" : "Chỉnh sửa"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
