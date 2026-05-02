import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Breadcrumb, Button, Card, Spin, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { RootState } from "@/store";
import { fetchAuditLogsThunk } from "../store/auditLog/auditLog.thunks";
import { AuditLogViewer } from "../components/AuditLogViewer";

export const AuditLogPage: React.FC = () => {
  const { po_id } = useParams<{ po_id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { logs, loading, pagination } = useSelector(
    (state: RootState) => state.auditLog,
  );

  const po_id_num = parseInt(po_id || "0", 10);

  useEffect(() => {
    if (po_id_num > 0) {
      handleFetch({});
    }
  }, [po_id_num]);

  const handleFetch = async (filters: any) => {
    try {
      await dispatch(
        fetchAuditLogsThunk({
          po_id: po_id_num,
          filters,
        }) as any,
      );
    } catch (error: any) {
      message.error(error.message || "Error loading history");
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          {
            title: <a onClick={() => navigate("/purchase")}>Purchase Orders</a>,
          },
          {
            title: `Change History (PO #${po_id})`,
          },
        ]}
        style={{ marginBottom: 24 }}
      />

      {/* Header */}
      <Card
        style={{ marginBottom: 24 }}
        title={`Change History - Purchase Order #${po_id}`}
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/purchase")}
          >
            Back
          </Button>
        }
      >
        <p>
          View all changes made to this purchase order, including creation,
          updates, approvals, and cancellations.
        </p>
      </Card>

      {/* Audit Log Viewer */}
      <Spin spinning={loading}>
        <AuditLogViewer
          po_id={po_id_num}
          logs={logs}
          loading={loading}
          pagination={pagination}
          onFetch={handleFetch}
        />
      </Spin>
    </div>
  );
};

export default AuditLogPage;
