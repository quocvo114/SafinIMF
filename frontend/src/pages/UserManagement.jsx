import React from "react";
import UserTable from "../components/UserTable";

const UserManagement = () => {
  return (
    <div className="w-full min-h-full bg-gray-50 p-2 lg:p-0 flex flex-col flex-1 min-w-0 overflow-hidden">
      <div className="bg-white rounded-xl lg:rounded-[24px] shadow-md border border-gray-100 p-4 lg:p-6 w-full max-w-full flex-1 flex flex-col min-w-0 overflow-hidden">
        <UserTable />
      </div>
    </div>
  );
};

export default UserManagement;
