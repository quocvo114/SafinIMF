const bcrypt = require("bcrypt");
const userRepository = require("./user.repository");

const ROLE_DB_TO_UI = {
  citizen: "User",
  admin: "Admin",
  manager: "QTV",
  maintenance: "KTV",
};

const ROLE_UI_TO_DB = {
  User: "citizen",
  Admin: "admin",
  QTV: "manager",
  KTV: "maintenance",
};

function toManagementUser(user) {
  return {
    user_id: user.user_id,
    id: `user${String(user.user_id).padStart(3, "0")}`,
    name: user.full_name || "",
    phone: user.phone || "",
    email: user.email || "",
    role: ROLE_DB_TO_UI[user.role] || "User",
    area: user.area || "",
    status: user.account_status || "active",
    created_at: user.created_at,
  };
}

class UserService {
  async getUserProfile(user_id) {
    const user = await userRepository.findById(user_id);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(user_id, updateData) {
    const user = await userRepository.findById(user_id);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Kiểm tra nếu phone khác và đã tồn tại
    if (updateData.phone && updateData.phone !== user.phone) {
      const existing = await userRepository.findByPhone(updateData.phone);
      if (existing) {
        throw new Error("Số điện thoại đã được sử dụng");
      }
    }

    // Kiểm tra nếu email khác và đã tồn tại (chỉ nếu email được cung cấp)
    if (updateData.email && updateData.email.trim() && updateData.email !== user.email) {
      const existing = await userRepository.findByEmail(updateData.email);
      if (existing) {
        throw new Error("Email đã được sử dụng");
      }
    }

    const updated = await userRepository.updateProfile(user_id, updateData);
    
    if (!updated) {
      throw new Error("Cập nhật hồ sơ thất bại");
    }

    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  async changePassword(user_id, oldPassword, newPassword) {
    const user = await userRepository.findById(user_id);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new Error("Mật khẩu cũ không đúng");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(user_id, hashedPassword);

    return { success: true };
  }

  async deleteAccount(user_id) {
    const deleted = await userRepository.deleteUser(user_id);
    if (!deleted) {
      throw new Error("Người dùng không tồn tại");
    }
    return { success: true };
  }

  async getAllUsers() {
    return await userRepository.getAllUsers();
  }

  mapRoleForDb(uiRole = "User") {
    return ROLE_UI_TO_DB[uiRole] || "citizen";
  }

  async getManagementUsers({ search, role, area, status, page, limit }) {
    const roleForDb = role && role !== "all" ? this.mapRoleForDb(role) : "all";

    const result = await userRepository.getManagementList({
      search,
      role: roleForDb,
      area,
      status,
      page,
      limit,
    });

    return {
      items: result.items.map(toManagementUser),
      pagination: result.pagination,
    };
  }

  async createUserByAdmin({ name, phone, email, role, area, status }) {
    if (!name || !phone) {
      throw new Error("Tên và số điện thoại là bắt buộc");
    }

    const existingPhone = await userRepository.findByPhone(phone);
    if (existingPhone) {
      throw new Error("Số điện thoại đã được sử dụng");
    }

    if (email) {
      const existingEmail = await userRepository.findByEmail(email);
      if (existingEmail) {
        throw new Error("Email đã được sử dụng");
      }
    }

    const user_id = await userRepository.getNextUserId();
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "123456";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const created = await userRepository.createByAdmin({
      user_id,
      full_name: name,
      phone,
      email: email || "",
      password: hashedPassword,
      phone_verified: true,
      email_verified: Boolean(email),
      role: this.mapRoleForDb(role),
      area: area || "",
      account_status: status || "active",
    });

    return {
      user: toManagementUser(created),
      defaultPassword,
    };
  }

  async updateUserByAdmin(user_id, { name, phone, email, role, area, status }) {
    const target = await userRepository.findById(user_id);
    if (!target) {
      throw new Error("Người dùng không tồn tại");
    }

    if (phone && phone !== target.phone) {
      const existingPhone = await userRepository.findByPhone(phone);
      if (existingPhone && existingPhone.user_id !== user_id) {
        throw new Error("Số điện thoại đã được sử dụng");
      }
    }

    if (email && email !== target.email) {
      const existingEmail = await userRepository.findByEmail(email);
      if (existingEmail && existingEmail.user_id !== user_id) {
        throw new Error("Email đã được sử dụng");
      }
    }

    const updated = await userRepository.updateUserByAdmin(user_id, {
      full_name: name || target.full_name,
      phone: phone || target.phone,
      email: email !== undefined ? email : target.email,
      role: role ? this.mapRoleForDb(role) : target.role,
      area: area !== undefined ? area : target.area,
      account_status: status || target.account_status || "active",
    });

    return toManagementUser(updated);
  }

  async updateUserStatusByAdmin(user_id, status) {
    const allowedStatus = ["active", "locked", "banned"];
    if (!allowedStatus.includes(status)) {
      throw new Error("Trạng thái không hợp lệ");
    }

    const updated = await userRepository.updateUserStatus(user_id, status);
    if (!updated) {
      throw new Error("Người dùng không tồn tại");
    }

    return toManagementUser(updated);
  }

  async deleteUserByAdmin(user_id) {
    const deleted = await userRepository.deleteUserById(user_id);
    if (!deleted) {
      throw new Error("Người dùng không tồn tại");
    }

    return toManagementUser(deleted);
  }
}

module.exports = new UserService();
