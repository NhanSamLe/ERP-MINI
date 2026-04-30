import React, { useState } from "react";
import {
  Modal,
  Button,
  Checkbox,
  Table,
  Form,
  Input,
  Space,
  Alert,
  Spin,
  message,
} from "antd";
import {
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { PurchaseOrder } from "../store/purchaseOrder.types";

interface BulkActionModalProps {
  visible: boolean;
  onClose: () => void;
  selectedPOs: PurchaseOrder[];
  onApprove: (po_ids: number[]) => Promise<void>;
  onCancel: (po_ids: number[], reason: string) => Promise<void>;
  loading?: boolean;
}

type ActionType = "approve" | "cancel" | null;

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  visible,
  onClose,
  selectedPOs,
  onApprove,
  onCancel,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>(
    selectedPOs.map((po) => po.id),
  );
  const [actionType, setActionType] = useState<ActionType>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedRowKeys(selectedPOs.map((po) => po.id));
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleApprove = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một đơn đặt hàng");
      return;
    }

    Modal.confirm({
      title: "Xác nhận phê duyệt",
      content: `Bạn có chắc chắn muốn phê duyệt ${selectedRowKeys.length} đơn đặt hàng?`,
      okText: "Phê duyệt",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setIsProcessing(true);
          await onApprove(selectedRowKeys as number[]);
          message.success(
            `Đã phê duyệt ${selectedRowKeys.length} đơn đặt hàng`,
          );
          setSelectedRowKeys([]);
          setActionType(null);
          onClose();
        } catch (error: any) {
          message.error(error.message || "Lỗi khi phê duyệt");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleCancel = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng chọn ít nhất một đơn đặt hàng");
      return;
    }

    try {
      const values = await form.validateFields();
      const { reason } = values;

      Modal.confirm({
        title: "Xác nhận hủy",
        content: `Bạn có chắc chắn muốn hủy ${selectedRowKeys.length} đơn đặt hàng?\n\nLý do: ${reason}`,
        okText: "Hủy",
        cancelText: "Không",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            setIsProcessing(true);
            await onCancel(selectedRowKeys as number[], reason);
            message.success(`Đã hủy ${selectedRowKeys.length} đơn đặt hàng`);
            setSelectedRowKeys([]);
            setActionType(null);
            form.resetFields();
            onClose();
          } catch (error: any) {
            message.error(error.message || "Lỗi khi hủy");
          } finally {
            setIsProcessing(false);
          }
        },
      });
    } catch (error) {
      message.error("Vui lòng nhập lý do hủy");
    }
  };

  const columns: ColumnsType<PurchaseOrder> = [
    {
      title: "Mã PO",
      dataIndex: "po_no",
      key: "po_no",
      width: 120,
    },
    {
      title: "Nhà cung cấp",
      dataIndex: ["supplier", "name"],
      key: "supplier_name",
      width: 150,
    },
    {
      title: "Ngày đặt",
      dataIndex: "order_date",
      key: "order_date",
      width: 120,
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const statusMap: Record<string, string> = {
          draft: "Nháp",
          waiting_approval: "Chờ phê duyệt",
          confirmed: "Đã xác nhận",
          partially_received: "Nhập hàng một phần",
          completed: "Hoàn thành",
          cancelled: "Đã hủy",
        };
        return statusMap[status] || status;
      },
    },
    {
      title: "Tổng tiền",
      dataIndex: "total_after_tax",
      key: "total_after_tax",
      width: 120,
      align: "right",
      render: (amount) =>
        new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(amount),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <Modal
      title="Hành động hàng loạt"
      open={visible}
      onCancel={onClose}
      width={900}
      footer={null}
      bodyStyle={{ maxHeight: "600px", overflowY: "auto" }}
    >
      <Spin spinning={isProcessing || loading}>
        {/* Selection Info */}
        <Alert
          message={`Đã chọn ${selectedRowKeys.length} đơn đặt hàng`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              type="text"
              onClick={() => setSelectedRowKeys([])}
            >
              Bỏ chọn tất cả
            </Button>
          }
        />

        {/* Select All Checkbox */}
        <div style={{ marginBottom: 16 }}>
          <Checkbox
            indeterminate={
              selectedRowKeys.length > 0 &&
              selectedRowKeys.length < selectedPOs.length
            }
            onChange={handleSelectAll}
            checked={selectedRowKeys.length === selectedPOs.length}
          >
            Chọn tất cả ({selectedPOs.length})
          </Checkbox>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={selectedPOs}
          rowKey="id"
          rowSelection={rowSelection}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
        />

        {/* Action Section */}
        {actionType === "cancel" && (
          <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
            <Form.Item
              label="Lý do hủy"
              name="reason"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập lý do hủy",
                },
                {
                  min: 10,
                  message: "Lý do hủy phải có ít nhất 10 ký tự",
                },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Nhập lý do hủy đơn đặt hàng..."
              />
            </Form.Item>
          </Form>
        )}

        {/* Buttons */}
        <Space
          style={{ marginTop: 24, width: "100%", justifyContent: "flex-end" }}
        >
          <Button onClick={onClose}>Đóng</Button>

          {actionType === null && (
            <>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => setActionType("approve")}
                disabled={selectedRowKeys.length === 0}
              >
                Phê duyệt ({selectedRowKeys.length})
              </Button>

              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => setActionType("cancel")}
                disabled={selectedRowKeys.length === 0}
              >
                Hủy ({selectedRowKeys.length})
              </Button>
            </>
          )}

          {actionType === "approve" && (
            <>
              <Button onClick={() => setActionType(null)}>Quay lại</Button>
              <Button
                type="primary"
                loading={isProcessing}
                onClick={handleApprove}
              >
                Xác nhận phê duyệt
              </Button>
            </>
          )}

          {actionType === "cancel" && (
            <>
              <Button onClick={() => setActionType(null)}>Quay lại</Button>
              <Button danger loading={isProcessing} onClick={handleCancel}>
                Xác nhận hủy
              </Button>
            </>
          )}
        </Space>
      </Spin>
    </Modal>
  );
};

export default BulkActionModal;
