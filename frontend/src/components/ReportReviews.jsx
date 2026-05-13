import { X } from "lucide-react";
import { useState } from "react";

export default function ReportReviews({ close, submit }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] md:w-[450px] rounded-2xl shadow-xl p-5">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Đánh Giá Sự Cố</h2>
          <button onClick={close}><X /></button>
        </div>

        <p className="font-medium mb-2">
          Bạn Đánh Giá Chất Lượng Xử Lý Thế Nào? <span className="text-red-500">*</span>
        </p>

        {/* ⭐ Rating */}
        <div className="flex gap-2 mb-3">
          {[1,2,3,4,5].map((i) => (
            <span
              key={i}
              onClick={() => setRating(i)}
              className={`text-3xl cursor-pointer ${
                i <= rating ? "text-yellow-400" : "text-gray-300"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 border rounded-lg h-24 text-sm"
          placeholder="Nhập cảm nhận của bạn..."
        />

        {/* BUTTONS */}
        <div className="flex justify-between mt-4">
          <button
            onClick={close}
            className="w-1/3 py-2 rounded-xl bg-gray-200"
          >
            Hủy
          </button>

          <button
            disabled={rating === 0}
            onClick={() => submit(rating, text)}
            className={`w-1/2 py-2 rounded-xl text-white ${
              rating === 0 ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
