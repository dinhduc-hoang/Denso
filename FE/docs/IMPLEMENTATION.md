# Phạm vi và thứ tự code khi rất ít thời gian

## Luồng chính

1. Điều phối tạo cuộc họp, cung cấp transcript và ảnh minh họa.
2. AI dựng báo cáo: tóm tắt, vấn đề/nguyên nhân, quan điểm, quyết định/phạm vi, action items, cảnh báo; từng ý có nguồn.
3. Chuyên gia kiểm tra. Thiếu nguồn hoặc chưa rõ thì trả lại bản nháp. Phê duyệt chỉ phát hành quyết định đã chốt.
4. Hướng dẫn có phiên bản, trạng thái, phạm vi và người duyệt được đưa vào kho tri thức.
5. Công nhân nhập lỗi + máy + sản phẩm. Lọc bản đã duyệt, đang hiệu lực, đúng phạm vi rồi mới truy xuất.
6. Có hướng dẫn: hiển thị Action Card kèm nguồn; không có hoặc chưa hiệu quả: chuyển kỹ sư.
7. Kỹ sư xử lý, ghi nguyên nhân, phương án, điều kiện và bằng chứng. Tạo bản nháp mới, chuyên gia duyệt rồi mới phát hành.

## Ưu tiên thực hiện

| Ưu tiên | Phần việc | Tiêu chí xong |
| --- | --- | --- |
| P0 | UI có luồng chính và ngoại lệ | Demo một vòng hoàn chỉnh; bản nháp không lọt vào hướng dẫn công nhân |
| P1 | Transcript mẫu → AI JSON → báo cáo | Đầu ra qua schema; có nguồn; không tự điền người/hạn/setpoint còn thiếu |
| P2 | Lưu report / quyết định / phiên bản bằng backend đơn giản | Duyệt có danh tính người thật; truy xuất loại bản nháp và bản cũ |
| P3 | STT và từ điển kỹ thuật | Đo lỗi nhận mã máy/linh kiện trên audio được phép dùng |
| P4 | Truy xuất tài liệu, phân quyền, dữ liệu nhà máy | Truy xuất đúng phạm vi; bảo vệ dữ liệu nội bộ |
| Dài hạn | Tích hợp HMI, PLC, tối ưu học máy | Dự án riêng, kiểm định và có giới hạn độc lập với AI |

Nếu chỉ có một buổi để làm tiếp, tập trung P1. Dùng dữ liệu giả lập rõ nhãn cho phần còn lại và không giả vờ AI/PLC đang chạy thật.

## Contract AI đề xuất

Ví dụ minh họa, chưa phải API đã triển khai:

```json
{
  "meeting_id": "DR-024",
  "summary": "Camera báo ảnh mờ; cần kiểm tra theo SOP.",
  "issues": [{
    "symptom": "E-VIS-07 / ảnh mờ",
    "root_cause_hypothesis": "Bụi bề mặt ống kính",
    "confirmed": false,
    "source": {"segment_id": "seg-02", "start_seconds": 134}
  }],
  "decisions": [{
    "action": "Kiểm tra theo SOP-VIS-02",
    "scope": {"machine": "CAM-02", "station": "Demo A", "product": "S-01"},
    "setpoint": null,
    "stop_condition": "Ảnh chưa đạt hoặc ngoài phạm vi; chuyển kỹ sư",
    "source": {"segment_id": "seg-08", "start_seconds": 522},
    "approval_status": "draft"
  }],
  "action_items": [{
    "task": "Kiểm tra điều kiện ánh sáng",
    "assignee": null,
    "deadline": null,
    "needs_clarification": true
  }],
  "risks": [{
    "text": "Không tiếp tục nếu ảnh chưa đạt",
    "source": {"segment_id": "seg-05", "start_seconds": 338}
  }]
}
```

AI tạo nội dung; backend giữ người duyệt, thời điểm, hiệu lực và phiên bản. Không chấp nhận trường `approved` từ đầu ra mô hình như quyết định phê duyệt của người thật. Liên kết nguồn phải trỏ tới segment có thật; thông tin thiếu giữ `null`.

## Các thay đổi nên đưa vào báo cáo ý tưởng

- “Giải quyết triệt để nghe nhầm” → “Giảm nhầm thuật ngữ bằng từ điển và kiểm duyệt”.
- “Lưu 100% quan điểm” → “Trích xuất quan điểm và kiểm tra độ đầy đủ bằng nguồn”.
- “Hình ảnh bổ sung 50% dữ liệu” → mô tả giá trị của hình ảnh; chỉ dùng tỷ lệ nếu đã đo.
- “Nạp thay thế hoàn toàn cái cũ” → phát hành phiên bản mới, giữ lịch sử; chỉ tái dùng trong phạm vi và hiệu lực được duyệt.
- “Ghi chú kỹ sư tự áp dụng lần sau” → ghi chú tạo bản nháp, phải duyệt trước khi tái sử dụng.
- “RLHF qua nút phản hồi” → thu thập phản hồi gắn case và phiên bản; dùng để đánh giá/cải tiến sau, chưa mặc định huấn luyện tăng cường.
- “AI trực tiếp chỉnh PLC” → tách thành lộ trình dài hạn; chưa phải phạm vi MVP.

## Đo pilot bằng dữ liệu thật

Đo thời gian viết và duyệt báo cáo; độ đúng mã kỹ thuật; tỷ lệ ý có nguồn hợp lệ; tỷ lệ truy xuất đúng máy/sản phẩm; tỷ lệ tình huống phải gọi kỹ sư; thời gian xử lý case so với baseline. Hiển thị mẫu số và điều kiện đo, không lấy thời gian tải UI làm thời gian giảm downtime.
