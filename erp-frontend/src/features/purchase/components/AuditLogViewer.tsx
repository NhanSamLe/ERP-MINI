import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Drawer,
  Form,
  Select,
  DatePicker,
  Space,
  Empty,
  Spin,
  message,
} from "antd";
import { EyeOutlined, ClearOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { AuditLog } from "../store/auditLog/auditLog.slice";

interface AuditLogViewerProps {
  po_id: number;
  logs: AuditLog[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onFetch: (filters: any) => Promise<void>;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "green",
  UPDATE: "blue",
  APPROVE: "cyan",
  CANCEL: "red",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Tạo mới",
  UPDATE: "Cập nhật",
  APPROVE: "Phê duyệt",
  CANCEL: "Hủy",
};

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  po_id,
  logs,
  loading = false,
  pagination,
  onFetch,
}) => {
  const [form] = Form.useForm();
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    // Fetch logs on component mount
    handleFetch();
  }, [po_id]);

  const handleFetch = async () => {
    try {
      const values = await form.getFieldsValue();
      const filters = {
        action: values.action || undefined,
        date_from: values.date_from
          ? values.date_from.format("YYYY-MM-DD")
          : undefined,
        date_to: values.date_to
          ? values.date_to.format("YYYY-MM-DD")
          : undefined,
        page: 1,
        limit: 20,
      };
      await onFetch(filters);
    } catch (error) {
      message.error("Lỗi khi tải lịch sử");
    }
  };

  const handleReset = () => {
    form.resetFields();
    handleFetch();
  };

  const showDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDrawerVisible(true);
  };

  const columns: ColumnsType<AuditLog> = [
    {
      title: "Hành động",
      dataIndex: "action",
      key: "action",
      width: 100,
      render: (action) => (
        <Tag color={ACTION_COLORS[action]}>
          {ACTION_LABELS[action] || action}
        </Tag>
      ),
    },
    {
      title: "Người thực hiện",
      dataIndex: "changed_by_name",
      key: "changed_by_name",
      width: 150,
    },
    {
      title: "Thời gian",
      dataIndex: "changed_at",
      key: "changed_at",
      width: 180,
      render: (date) => {
        const d = new Date(date);
        return d.toLocaleString("vi-VN");
      },
    },
    {
      title: "Chi tiết",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDetails(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <>
      {/* Filter Section */}
      <Card size="small" style={{ marginBottom: 16 }} title="Bộ lọc">
        <Space>
          <Button type="primary" onClick={() => setFilterDrawerVisible(true)}>
            Lọc
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleReset}>
            Xóa bộ lọc
          </Button>
        </Space>
      </Card>

      {/* Logs Table */}
      <Card
        loading={loading}
        title={`Lịch sử thay đổi (${pagination?.total || 0} bản ghi)`}
      >
        {logs.length === 0 ? (
          <Empty description="Không có lịch sử thay đổi" />
        ) : (
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            pagination={{
              current: pagination?.page || 1,
              pageSize: pagination?.limit || 20,
              total: pagination?.total || 0,
              showSizeChanger: true,
              showTotal: (total) => `Tổng ${total} bản ghi`,
            }}
            size="small"
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* Filter Drawer */}
      <Drawer
        title="Bộ lọc lịch sử"
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Hành động" name="action">
            <Select
              placeholder="Chọn hành động"
              allowClear
              options={[
                { label: "Tạo mới", value: "CREATE" },
                { label: "Cập nhật", value: "UPDATE" },
                { label: "Phê duyệt", value: "APPROVE" },
                { label: "Hủy", value: "CANCEL" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Từ ngày" name="date_from">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Đến ngày" name="date_to">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Space style={{ width: "100%" }}>
            <Button type="primary" onClick={handleFetch} style={{ flex: 1 }}>
              Áp dụng
            </Button>
            <Button onClick={handleReset} style={{ flex: 1 }}>
              Xóa bộ lọc
            </Button>
          </Space>
        </Form>
      </Drawer>

      {/* Details Drawer */}
      <Drawer
        title="Chi tiết thay đổi"
        placement="right"
        onClose={() => setDetailsDrawerVisible(false)}
        open={detailsDrawerVisible}
        width={600}
      >
        {selectedLog && (
          <div>
            {/* Header Info */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 8 }}>
                <strong>Hành động:</strong>{" "}
                <Tag color={ACTION_COLORS[selectedLog.action]}>
                  {ACTION_LABELS[selectedLog.action]}
                </Tag>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>Người thực hiện:</strong> {selectedLog.changed_by_name}
              </div>
              <div>
                <strong>Thời gian:</strong>{" "}
                {new Date(selectedLog.changed_at).toLocaleString("vi-VN")}
              </div>
            </div>

            {/* Old Values */}
            {selectedLog.old_values && (
              <div style={{ marginBottom: 24 }}>
                <h4>Giá trị cũ</h4>
                <pre
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: 12,
                    borderRadius: 4,
                    overflow: "auto",
                    maxHeight: 300,
                  }}
                >
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {/* New Values */}
            {selectedLog.new_values && (
              <div>
                <h4>Giá trị mới</h4>
                <pre
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: 12,
                    borderRadius: 4,
                    overflow: "auto",
                    maxHeight: 300,
                  }}
                >
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
};

export default AuditLogViewer;
