import React from "react";
import MaintenanceTeam_Table from "../components/MaintenanceTeam_Table";

const MaintenanceTeam_Management = () => {
  return (
    <div className="w-full h-full ">
      <div className="h-full bg-white rounded-[24px] shadow-md border border-gray-100 p-6">
        {/* Gọi component MaintenanceTeam_Table */}
        <MaintenanceTeam_Table />
      </div>
    </div>
  );
};

export default MaintenanceTeam_Management;
