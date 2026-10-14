export const sampleMeeting = {
  title: "Review lỗi ảnh mờ tại trạm kiểm tra chất lượng",
  scope: { machine: "CAM-02", station: "Demo A", product: "S-01" },
  segments: [
    {
      id: "seg-02",
      startSeconds: 134,
      speaker: "Anh Minh · Bảo dưỡng",
      kind: "root",
      text: "Ảnh bị mờ có thể do bụi trên bề mặt ống kính. Cần kiểm tra trước, chưa đủ cơ sở kết luận lỗi cảm biến.",
    },
    {
      id: "seg-05",
      startSeconds: 338,
      speaker: "Chị Lan · Chất lượng",
      kind: "dissent",
      text: "Nếu vệ sinh mà ảnh vẫn mờ thì chưa được tiếp tục. Phải giữ lô và gọi kỹ sư kiểm tra theo quy trình chất lượng.",
    },
    {
      id: "seg-08",
      startSeconds: 522,
      speaker: "Anh Nam · Chủ trì",
      kind: "decision",
      text: "Chốt cho camera CAM-02 trên trạm demo A: kiểm tra, vệ sinh theo SOP-VIS-02. Chỉ tiếp tục sau khi chất lượng ảnh đạt tiêu chí của SOP và người có thẩm quyền xác nhận. Không thay đổi tham số PLC.",
    },
    {
      id: "seg-10",
      startSeconds: 605,
      speaker: "Anh Nam · Chủ trì",
      kind: "action",
      text: "Lan đối chiếu lại SOP hiện hành trước 16 giờ ngày 11 tháng 10 năm 2026. Phần kiểm tra ánh sáng cần phân công người phụ trách sau.",
    },
  ],
};
export const sampleDecision =
  "Kiểm tra và vệ sinh bề mặt ống kính theo SOP đã duyệt; kiểm tra lại chất lượng ảnh trước khi tiếp tục.";
