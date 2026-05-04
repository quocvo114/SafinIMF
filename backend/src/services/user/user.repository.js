const User = require("./user.model");  

class UserRepository {
  async findByPhone(phone) {
    return User.findOne({ phone }).lean();
  }

  async findByEmail(email) {
    return User.findOne({ email }).lean();
  }

  async findById(user_id) {
    return User.findOne({ user_id }).lean();
  }

  async getNextUserId() {
    const last = await User.findOne().sort({ user_id: -1 }).lean();
    return (last?.user_id || 0) + 1;
  }

  async create(data) {
    const doc = await User.create(data);
    return doc.toObject();
  }

  async updateProfile(user_id, data) {
    const updateFields = {};
    
    if (data.full_name) updateFields.full_name = data.full_name;
    if (data.phone) updateFields.phone = data.phone;
    if (data.gender) updateFields.gender = data.gender;
    if (data.area) updateFields.area = data.area;
    // Only update email if provided and not empty
    if (data.email && data.email.trim()) {
      updateFields.email = data.email.trim();
    }
    
    return User.findOneAndUpdate(
      { user_id },
      updateFields,
      { new: true }
    ).lean();
  }

  async updatePassword(user_id, hashedPassword) {
    return User.findOneAndUpdate(
      { user_id },
      { password: hashedPassword },
      { new: true }
    ).lean();
  }

  async deleteUser(user_id) {
    return User.findOneAndDelete({ user_id });
  }

  async getAllUsers() {
    return User.find({}, { password: 0 }).lean();
  }

  async getManagementList({ search, role, area, status, page = 1, limit = 10 }) {
    const query = {};

    if (role && role !== "all") {
      query.role = role;
    }

    if (area && area !== "all") {
      query.area = area;
    }

    if (status && status !== "all") {
      query.account_status = status;
    }

    if (search) {
      const keyword = search.trim();
      query.$or = [
        { full_name: { $regex: keyword, $options: "i" } },
        { phone: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ];
    }

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      User.find(query, { password: 0 })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(Math.ceil(total / safeLimit), 1),
      },
    };
  }

  async createByAdmin(data) {
    const doc = await User.create(data);
    return doc.toObject();
  }

  async updateUserByAdmin(user_id, data) {
    const updateFields = {
      full_name: data.full_name,
      phone: data.phone,
      role: data.role,
      area: data.area,
      account_status: data.account_status,
    };
    
    const updateQuery = { $set: updateFields };
    
    if (data.email && data.email.trim() !== "") {
      updateFields.email = data.email.trim();
    } else if (data.email === "") {
      updateQuery.$unset = { email: 1 };
    }

    return User.findOneAndUpdate(
      { user_id },
      updateQuery,
      { new: true, projection: { password: 0 } }
    ).lean();
  }

  async updateUserStatus(user_id, account_status) {
    return User.findOneAndUpdate(
      { user_id },
      { account_status },
      { new: true, projection: { password: 0 } }
    ).lean();
  }

  async deleteUserById(user_id) {
    return User.findOneAndDelete({ user_id }).lean();
  }
}

module.exports = new UserRepository();
