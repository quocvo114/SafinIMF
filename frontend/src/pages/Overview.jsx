import React from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Overview = () => {
  const mapCenter = [16.0471, 108.2068];

  // Dữ liệu mẫu cho khu vực
  const areaData = [
    {
      area: "Sơn Trà",
      received: 573,
      processing: 17,
      resolved: 556,
      position: [16.0614, 108.2468],
    },
    {
      area: "Hải Châu",
      received: 725,
      processing: 34,
      resolved: 691,
      position: [16.0544, 108.2022],
    },
    {
      area: "Liên Chiểu",
      received: 278,
      processing: 6,
      resolved: 272,
      position: [16.1039, 108.1246],
    },
    {
      area: "Ngũ Hành Sơn",
      received: 647,
      processing: 21,
      resolved: 626,
      position: [15.9955, 108.2581],
    },
  ];

  // Dữ liệu cho biểu đồ tròn - Loại Trạng Thái
  const statusData = [
    { name: "Đang Chờ", value: 78, color: "#ef4444" },
    { name: "Đang Xử Lý", value: 156, color: "#3b82f6" },
    { name: "Đã Giải Quyết", value: 3210, color: "#84cc16" },
  ];

  // Dữ liệu cho biểu đồ cột - Loại Sự Cố
  const incidentData = [
    { name: "Giao Thông Vận Tải", value: 950, fill: "#f97316" },
    { name: "Điện", value: 780, fill: "#eab308" },
    { name: "Cây Xanh", value: 620, fill: "#22c55e" },
    { name: "Công Trình Công Cộng", value: 680, fill: "#a855f7" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-md sm:mb-8 sm:p-8 lg:p-10">
        <h2 className="mb-5 text-xl font-bold text-gray-800 sm:mb-6 sm:text-2xl lg:text-3xl">
          Bản Đồ Giám Sát Khu Vực
        </h2>

        <div className="h-[360px] overflow-hidden rounded-2xl border border-gray-200 sm:h-[420px]">
          <MapContainer
            center={mapCenter}
            zoom={12}
            className="h-full w-full"
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {areaData.map((area) => (
              <Marker key={area.area} position={area.position}>
                <Popup>
                  <div className="min-w-[190px] space-y-1">
                    <p className="font-semibold text-gray-900">{area.area}</p>
                    <p className="text-sm text-gray-700">Đã tiếp nhận: {area.received}</p>
                    <p className="text-sm text-blue-700">Đang xử lý: {area.processing}</p>
                    <p className="text-sm text-emerald-700">Đã giải quyết: {area.resolved}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>

      {/* Khu Vực Quản Lý */}
      <section className="bg-white rounded-3xl shadow-md p-6 sm:p-8 lg:p-10 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 text-gray-800">
          Khu Vực Quản Lý
        </h2>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 sm:px-6 text-sm sm:text-base font-bold text-gray-700">
                      Khu Vực
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 text-sm sm:text-base font-bold text-gray-700">
                      Đã Tiếp Nhận
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 text-sm sm:text-base font-bold text-gray-700">
                      Đang Xử Lý
                    </th>
                    <th className="text-center py-4 px-4 sm:px-6 text-sm sm:text-base font-bold text-gray-700">
                      Đã Giải Quyết
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {areaData.map((area, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-200 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-4 px-4 sm:px-6 text-sm sm:text-base font-semibold text-gray-800">
                        {area.area}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center text-sm sm:text-base text-gray-700 font-medium">
                        {area.received}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center text-sm sm:text-base text-gray-700 font-medium">
                        {area.processing}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-center text-sm sm:text-base text-gray-700 font-medium">
                        {area.resolved}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Biểu đồ tròn - Loại Trạng Thái */}
            <section className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 lg:mb-8 text-gray-800">
                Loại Trạng Thái
              </h2>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 lg:gap-6">
                <div className="w-full sm:w-[55%]">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex sm:flex-col gap-4 sm:gap-3 lg:gap-4 w-full sm:w-auto justify-center sm:justify-start">
                  {statusData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 rounded shrink-0"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-xs sm:text-sm lg:text-base text-gray-700 whitespace-nowrap">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Biểu đồ cột - Loại Sự Cố */}
            <section className="bg-white rounded-3xl shadow-md p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 lg:mb-8 text-gray-800">
                Loại Sự Cố
              </h2>

              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={incidentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={false} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: "12px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                    }}
                    cursor={{ fill: "rgba(0, 0, 0, 0.03)" }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45} />
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-3 sm:mt-4 lg:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 lg:gap-3">
                {incidentData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 rounded shrink-0"
                      style={{ backgroundColor: item.fill }}
                    ></div>
                    <span className="text-[10px] sm:text-xs lg:text-sm text-gray-600 truncate">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
  );
};

export default Overview;
