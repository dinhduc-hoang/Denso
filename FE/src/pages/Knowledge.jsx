import {
  ActButton,
  Divider,
  Locked,
  Note,
  PageHead,
  Panel,
  Pill,
  Scope,
  SourceButton,
} from "@/components/shared";
import { useDemo } from "@/hooks/demo-context";

export default function Knowledge() {
  const { state, serverData } = useDemo();
  const knowledge = serverData?.knowledge;
  const version = knowledge?.version || (state.noteApproved ? 2 : 1);
  const publishedNote = knowledge?.document.fieldNote?.action || state.note;
  return (
    <>
      <PageHead
        tag="03 / Quản lý tri thức"
        title="Kho tri thức có kiểm soát phiên bản"
        description="Mỗi hướng dẫn giữ phạm vi áp dụng, nguồn quyết định và lịch sử. Bản nháp không xuất hiện trong kết quả của công nhân."
      >
        <Pill tone="green">Approved-only retrieval</Pill>
      </PageHead>
      {!state.approved ? (
        <Locked
          title="Kho tri thức chưa có hướng dẫn đã duyệt"
          description="Bản nháp AI chưa được phép đưa xuống sàn máy. Hoàn tất phê duyệt trước."
          page={2}
          label="Duyệt báo cáo"
        />
      ) : (
        <>
          <div className="knowledge-card">
            <div>
              <div className="panel-head">
                <div className="eyebrow">
                  {knowledge?.id || "KB-VIS-024"} / CAMERA / ĐANG HIỆU LỰC
                </div>
                <Pill tone="green">Đã duyệt · v{version}</Pill>
              </div>
              <h2 className="text-lg">
                {knowledge?.title || "E-VIS-07 · Ảnh kiểm tra bị mờ"}
              </h2>
              <p>{knowledge?.document.decision || state.decision}</p>
              {(knowledge?.document.fieldNote || state.noteApproved) && (
                <Note tone="green">
                  <b>Bổ sung đã duyệt từ hiện trường:</b> {publishedNote}
                </Note>
              )}
              <Scope />
              <p className="tiny muted">
                Người duyệt{" "}
                <b>{serverData?.knowledge?.approvedBy.name || "Nam (demo)"}</b>
              </p>
              <div className="row-actions">
                {knowledge?.document.mode !== "field" && (
                  <SourceButton source="decision">
                    {serverData?.meeting?.id || "DR-024"} · 08:42
                  </SourceButton>
                )}
                {(knowledge?.document.fieldNote || state.noteApproved) && (
                  <SourceButton source="field">
                    {knowledge?.document.fieldNote?.incidentId || "INC-DEMO-01"}{" "}
                    · Ghi chú
                  </SourceButton>
                )}
              </div>
            </div>
            <div>
              <ActButton action="copilot">Thử tại sàn máy →</ActButton>
            </div>
          </div>
          <div className="grid2 grid-equal">
            <Panel>
              <h2>Lịch sử phát hành</h2>
              {serverData?.history ? (
                <div className="timeline">
                  {serverData.history.map((entry) => (
                    <div className="event" key={entry.version}>
                      <b>
                        v{entry.version} ·{" "}
                        {entry.sourceNoteId
                          ? "Bổ sung ghi chú kỹ sư"
                          : "Quyết định từ cuộc họp"}
                      </b>
                      <small>
                        {entry.approvedBy.name} · {entry.approvedAt} UTC ·{" "}
                        {entry.status === "active"
                          ? "Đang hiệu lực"
                          : "Đã thay thế; giữ để truy ngược"}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timeline">
                  <div className="event">
                    <b>v1 · Quyết định từ cuộc họp</b>
                    <small>
                      Chuyên gia Nam duyệt · nguồn DR-024 ·{" "}
                      {state.noteApproved
                        ? "Đã thay thế; giữ để truy ngược"
                        : "Đang hiệu lực"}
                    </small>
                  </div>
                  {state.noteApproved && (
                    <div className="event">
                      <b>v2 · Bổ sung ghi chú kỹ sư</b>
                      <small>
                        Đã duyệt · nguồn INC-DEMO-01 · đang hiệu lực
                      </small>
                    </div>
                  )}
                </div>
              )}
              <Note>
                {knowledge
                  ? "Các phiên bản chỉ phát hành sau kiểm duyệt; bản đã thay thế được giữ trong lịch sử."
                  : "Bản v2 được phát hành sau kiểm duyệt. Bản v1 giữ trong lịch sử, không bị xóa."}
              </Note>
              <ActButton action="export" secondary>
                Xuất JSON tri thức
              </ActButton>
            </Panel>
            <Panel>
              <h2>Hàng đợi tri thức mới</h2>
              {state.noteDraft && !state.noteApproved ? (
                <>
                  <Note tone="amber">
                    <b>
                      v{knowledge ? version + 1 : 2} · Ghi chú hiện trường đang
                      chờ duyệt
                    </b>
                    <br />
                    {state.note}
                  </Note>
                  <ActButton action="engineer">
                    Mở ghi chú & kiểm duyệt →
                  </ActButton>
                </>
              ) : (
                <p className="muted tiny">
                  Chưa có bản nháp chờ duyệt. Tạo một sự cố chưa xử lý được để
                  đi tiếp vòng phản hồi.
                </p>
              )}
              <Divider />
              <h3>Bộ lọc trước khi truy xuất</h3>
              <p className="tiny muted">
                approved = true · active = true · machine = CAM-02 · product =
                S-01 · SOP còn hiệu lực.
              </p>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
