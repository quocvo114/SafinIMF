const userService = require("./user.service");

class UserController {
  async getProfile(req, res) {
    try {
      const user_id = req.user?.user_id;
      
      if (!user_id) {
        console.error("❌ getProfile: user_id not found in req.user", req.user);
        return res.status(401).json({ message: "Không được phép" });
      }

      console.log(`📖 getProfile: user_id=${user_id}`);

      const user = await userService.getUserProfile(user_id);
      
      if (!user) {
        console.warn(`⚠️ getProfile: user not found for user_id=${user_id}`);
        return res.status(404).json({ message: "Người dùng không tồn tại" });
      }

      console.log("✅ getProfile: success");
      return res.json(user);
    } catch (error) {
      console.error("❌ getProfile error:", error.message);
      return res.status(500).json({ message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const user_id = req.user?.user_id;
      
      if (!user_id) {
        console.error("❌ updateProfile: user_id not found in req.user", req.user);
        return res.status(401).json({ message: "Không được phép" });
      }

      const { full_name, phone, gender, email } = req.body;

      if (!full_name || !full_name.trim()) {
        console.warn("⚠️ updateProfile: full_name is empty");
        return res.status(400).json({ message: "Tên không được để trống" });
      }

      console.log(`📝 updateProfile: user_id=${user_id}, data=`, { full_name, phone, gender, email });

      const updated = await userService.updateProfile(user_id, {
        full_name,
        phone,
        gender,
        email,
      });

      console.log("✅ updateProfile: success");
      return res.json({
        message: "Cập nhật hồ sơ thành công",
        user: updated,
      });
    } catch (error) {
      console.error("❌ updateProfile error:", error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async changePassword(req, res) {
    try {
      const user_id = req.user?.user_id;
      
      if (!user_id) {
        console.error("❌ changePassword: user_id not found in req.user", req.user);
        return res.status(401).json({ message: "Không được phép" });
      }

      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        console.warn("⚠️ changePassword: missing oldPassword or newPassword");
        return res
          .status(400)
          .json({ message: "Mật khẩu cũ và mới là bắt buộc" });
      }

      if (newPassword.length < 6) {
        console.warn("⚠️ changePassword: newPassword length < 6");
        return res
          .status(400)
          .json({ message: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      }

      console.log(`🔑 changePassword: user_id=${user_id}`);

      await userService.changePassword(user_id, oldPassword, newPassword);

      console.log("✅ changePassword: success");
      return res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
      console.error("❌ changePassword error:", error.message);
      return res.status(400).json({ message: error.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const user_id = req.user?.user_id;
      
      if (!user_id) {
        return res.status(401).json({ message: "Không được phép" });
      }

      await userService.deleteAccount(user_id);

      return res.json({ message: "Xóa tài khoản thành công" });
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await userService.getAllUsers();
      return res.json(users);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getManagementUsers(req, res) {
    try {
      const {
        search = "",
        role = "all",
        area = "all",
        status = "all",
        page = 1,
        limit = 10,
      } = req.query;

      const result = await userService.getManagementUsers({
        search,
        role,
        area,
        status,
        page,
        limit,
      });

      return res.json({
        success: true,
        data: result.items,
        pagination: result.pagination,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async createManagementUser(req, res) {
    try {
      const { name, phone, email, role, area, status } = req.body;
      const created = await userService.createUserByAdmin({
        name,
        phone,
        email,
        role,
        area,
        status,
      });

      return res.status(201).json({
        success: true,
        message: "Tạo người dùng thành công",
        data: created.user,
        defaultPassword: created.defaultPassword,
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateManagementUser(req, res) {
    try {
      const user_id = Number(req.params.userId);
      const { name, phone, email, role, area, status } = req.body;

      if (!Number.isFinite(user_id)) {
        return res.status(400).json({ success: false, message: "userId không hợp lệ" });
      }

      const updated = await userService.updateUserByAdmin(user_id, {
        name,
        phone,
        email,
        role,
        area,
        status,
      });

      return res.json({ success: true, message: "Cập nhật thành công", data: updated });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateManagementUserStatus(req, res) {
    try {
      const user_id = Number(req.params.userId);
      const { status } = req.body;

      if (!Number.isFinite(user_id)) {
        return res.status(400).json({ success: false, message: "userId không hợp lệ" });
      }

      const updated = await userService.updateUserStatusByAdmin(user_id, status);
      return res.json({ success: true, message: "Đã cập nhật trạng thái", data: updated });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteManagementUser(req, res) {
    try {
      const user_id = Number(req.params.userId);
      if (!Number.isFinite(user_id)) {
        return res.status(400).json({ success: false, message: "userId không hợp lệ" });
      }

      const deleted = await userService.deleteUserByAdmin(user_id);
      return res.json({ success: true, message: "Xóa người dùng thành công", data: deleted });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UserController();
