import { useState } from "react"
import { EVENTS } from "../data/mock"
import { Bot, BarChart3, X, Sparkles } from "lucide-react"

interface Props {
  role?: "admin" | "student_affairs"
}

export function BiAssistantDrawer({ role = "student_affairs" }: Props) {
  const [showAiChat, setShowAiChat] = useState(false)
  const [aiQuery, setAiQuery] = useState("")
  const [aiBusy, setAiBusy] = useState(false)
  const [aiMessages, setAiMessages] = useState<Array<{
    sender: "user" | "ai"
    text: string
    table?: Array<Record<string, unknown>>
  }>>([
    {
      sender: "ai",
      text:
        role === "student_affairs"
          ? "Xin chào Cán bộ Phòng Công tác Sinh viên (P.CTSV)! Tôi là Trợ lý AI Phân tích Dữ liệu. Tôi có thể hỗ trợ thầy/cô phân tích số liệu vĩ mô toàn trường, thống kê vi phạm No-show, tỷ lệ tham gia ĐRL và hiệu suất phòng ốc."
          : "Xin chào Quản trị viên! Tôi là Trợ lý AI Phân tích Dữ liệu. Bạn có thể hỏi tôi bất kỳ câu hỏi nào về tỷ lệ No-show, xu hướng chuyên đề, hay phân bổ sự kiện toàn trường.",
    },
  ])

  function handleAiAsk(promptText?: string) {
    const q = (promptText || aiQuery).trim()
    if (!q) return
    setAiMessages((prev) => [...prev, { sender: "user", text: q }])
    setAiQuery("")
    setAiBusy(true)

    setTimeout(() => {
      let reply = ""
      let table: Array<Record<string, unknown>> | undefined = undefined
      const lower = q.toLowerCase()

      if (lower.includes("tái phạm") || lower.includes("chế tài")) {
        reply =
          "Báo cáo sinh viên tái phạm No-show (≥ 2 lần vi phạm không check-in và không hủy vé trước T-4h): Phát hiện 3 trường hợp cần P.CTSV xem xét chế tài theo Điều 4 Quy chế ĐRL."
        table = [
          {
            mssv: "22520112",
            ho_ten: "Trần Văn ***",
            so_lan: "2 lần",
            khoa: "HTTT",
            de_xuat: "Tạm khóa quyền đặt vé 30 ngày",
          },
          {
            mssv: "22520543",
            ho_ten: "Lê Thị ***",
            so_lan: "3 lần",
            khoa: "KHMT",
            de_xuat: "Trừ 5 Điểm rèn luyện học kỳ",
          },
          {
            mssv: "22520988",
            ho_ten: "Nguyễn Hoàng ***",
            so_lan: "2 lần",
            khoa: "KTPM",
            de_xuat: "Cảnh cáo in-app & Email nhắc nhở",
          },
        ]
      } else if (lower.includes("no-show") || lower.includes("vi phạm")) {
        reply =
          "Phân tích 30 ngày qua cho P.CTSV: Toàn trường ghi nhận 7 trường hợp vi phạm No-show. Tỷ lệ No-show chung toàn trường chỉ ở mức 2.1% (thấp hơn ngưỡng báo động 5.0%)."
        table = [
          {
            don_vi: "Khoa Hệ thống Thông tin",
            vi_pham: "3 ca (42.8%)",
            bien_phap: "Đã gửi cảnh báo P.CTSV",
          },
          {
            don_vi: "Khoa Khoa học Máy tính",
            vi_pham: "2 ca (28.6%)",
            bien_phap: "Đang chờ đối soát",
          },
          {
            don_vi: "Khoa Kỹ thuật Phần mềm",
            vi_pham: "2 ca (28.6%)",
            bien_phap: "Nhắc nhở qua email trường",
          },
        ]
      } else if (
        lower.includes("chuyên đề") ||
        lower.includes("topic") ||
        lower.includes("xu hướng")
      ) {
        reply =
          "Xu hướng chuyên đề học kỳ này: Chuyên đề 'Trí tuệ Nhân tạo & Khoa học Dữ liệu' dẫn đầu mức độ quan tâm với 64% tổng lượt đăng ký, tiếp theo là 'Kỹ năng Lãnh đạo & Khởi nghiệp' (22%) và 'Lễ hội Âm nhạc & Văn hóa' (14%)."
      } else if (
        lower.includes("phòng") ||
        lower.includes("hội trường") ||
        lower.includes("lấp đầy")
      ) {
        reply =
          "Hiệu suất hội trường: Hội trường A (Cơ sở 1) có tỷ lệ lấp đầy cao nhất đạt 92.5%, Hội trường E đạt 84.0%, Hội trường B đạt 78.5%. Toàn bộ các sự kiện đều tuân thủ khoảng đệm an toàn 15 phút giữa các ca."
      } else if (
        lower.includes("drl") ||
        lower.includes("rèn luyện") ||
        lower.includes("điểm")
      ) {
        reply =
          "Tổng hợp Điểm rèn luyện: 94.2% sinh viên tham dự đạt chuẩn thời lượng tối thiểu Δt ≥ 70% và hoàn thành khảo sát 48h để nhận trọn vẹn điểm ĐRL theo Điều 3 & Điều 4."
      } else {
        reply = `Hệ thống ghi nhận ${EVENTS.length} sự kiện đang vận hành trong tháng. Tỷ lệ check-in thành công qua Kiosk Dynamic TOTP 30s đạt 97.8%. Đơn vị chủ trì tích cực nhất là Khoa Hệ thống Thông tin.`
      }

      setAiMessages((prev) => [...prev, { sender: "ai", text: reply, table }])
      setAiBusy(false)
    }, 600)
  }

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowAiChat((prev) => !prev)}
          className="flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-xl hover:shadow-2xl transition-all cursor-pointer border border-slate-700"
        >
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Trợ lý Phân tích BI (Text-to-Insight)</span>
          {showAiChat ? (
            <span className="text-xs bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700">
              Đóng
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
        </button>
      </div>

      {/* UC-AI-02: Text-to-Insight Drawer / Modal */}
      {showAiChat && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[92vw] sm:w-[480px] max-h-[600px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm">
                  Trợ lý Phân tích BI Toàn trường
                </h3>
                <p className="text-[11px] text-slate-400">
                  Truy vấn dữ liệu vĩ mô & Báo cáo quản trị
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAiChat(false)}
              className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-400 font-semibold whitespace-nowrap pl-1">
              Gợi ý:
            </span>
            <button
              onClick={() =>
                handleAiAsk("Phân tích vi phạm No-show 30 ngày qua")
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 whitespace-nowrap text-slate-600 transition-colors cursor-pointer shadow-xs"
            >
              Vi phạm No-show
            </button>
            <button
              onClick={() =>
                handleAiAsk("Danh sách sinh viên tái phạm No-show cần chế tài")
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 whitespace-nowrap text-slate-600 transition-colors cursor-pointer shadow-xs"
            >
              Tái phạm No-show
            </button>
            <button
              onClick={() =>
                handleAiAsk("Tỷ lệ đạt ĐRL và thời lượng tham gia")
              }
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 whitespace-nowrap text-slate-600 transition-colors cursor-pointer shadow-xs"
            >
              Thống kê ĐRL
            </button>
            <button
              onClick={() => handleAiAsk("Xu hướng chuyên đề hot nhất")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 whitespace-nowrap text-slate-600 transition-colors cursor-pointer shadow-xs"
            >
              Xu hướng chuyên đề
            </button>
            <button
              onClick={() => handleAiAsk("Tỷ lệ lấp đầy phòng hội trường")}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 whitespace-nowrap text-slate-600 transition-colors cursor-pointer shadow-xs"
            >
              Lấp đầy phòng
            </button>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[350px] bg-slate-50/50">
            {aiMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"
                  }`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${m.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-xs"
                      : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                    }`}
                >
                  <p>{m.text}</p>

                  {/* Render Insight Table */}
                  {m.table && (
                    <div className="mt-2.5 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <table className="w-full text-[11px] text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                            {Object.keys(m.table[0] || {}).map((col) => (
                              <th key={col} className="pb-1.5 pr-2 capitalize">
                                {col.replace(/_/g, " ")}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {m.table.map((row: Record<string, unknown>, rIdx: number) => (
                            <tr key={rIdx}>
                              {Object.values(row).map(
                                (val: unknown, vIdx: number) => (
                                  <td
                                    key={vIdx}
                                    className="py-1.5 pr-2 text-slate-700"
                                  >
                                    {String(val ?? "")}
                                  </td>
                                ),
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {aiBusy && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-500 w-fit">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span>
                  AI đang phân tích View v_event_analytics (Read-Only)...
                </span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
              placeholder="Đặt câu hỏi vĩ mô (VD: tỷ lệ no-show, thống kê ĐRL...)"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-600"
            />
            <button
              onClick={() => handleAiAsk()}
              disabled={aiBusy || !aiQuery.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
