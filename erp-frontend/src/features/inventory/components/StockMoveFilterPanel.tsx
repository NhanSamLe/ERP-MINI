import React from "react";
import {
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Row,
  Col,
  Select,
} from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { Warehouse } from "../store";

interface StockMoveFilterPanelProps {
  onSearch: (filters: any) => void;
  onReset: () => void;
  warehouses: Warehouse[];
  loading?: boolean;
}

const TYPE_OPTIONS = [
  { label: "Nhập kho", value: "receipt" },
  { label: "Xuất kho", value: "issue" },
  { label: "Điều chuyển", value: "transfer" },
  { label: "Kiểm kê", value: "adjustment" },
];

const STATUS_OPTIONS = [
  { label: "Nháp", value: "draft" },
  { label: "Chờ phê duyệt", value: "waiting_approval" },
  { label: "Đang vận chuyển", value: "in_transit" },
  { label: "Đã duyệt", value: "posted" },
  { label: "Đã hủy", value: "cancelled" },
];

export const StockMoveFilterPanel: React.FC<StockMoveFilterPanelProps> = ({
  onSearch,
  onReset,
  warehouses,
  loading = false,
}) => {
  const [form] = Form.useForm();

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      const filters = {
        move_no: values.move_no || undefined,
        warehouse_id: values.warehouse_id || undefined,
        type: values.type || undefined,
        status: values.status || undefined,
        date_from: values.date_from
          ? values.date_from.format("YYYY-MM-DD")
          : undefined,
        date_to: values.date_to
          ? values.date_to.format("YYYY-MM-DD")
          : undefined,
      };
      onSearch(filters);
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      className="bg-transparent"
    >
      <Row gutter={[16, 16]}>
        {/* Mã phiếu */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="move_no" label="Mã phiếu">
            <Input placeholder="Nhập mã phiếu..." allowClear className="h-10" />
          </Form.Item>
        </Col>

        {/* Kho hàng */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="warehouse_id" label="Kho hàng">
            <Select
              placeholder="Chọn kho hàng..."
              allowClear
              className="w-full"
              style={{ height: 40 }}
              options={warehouses.map((w) => ({
                label: w.name,
                value: w.id,
              }))}
            />
          </Form.Item>
        </Col>

        {/* Loại dịch chuyển */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="type" label="Loại dịch chuyển">
            <Select
              placeholder="Chọn loại..."
              allowClear
              className="w-full"
              style={{ height: 40 }}
              options={TYPE_OPTIONS}
            />
          </Form.Item>
        </Col>

        {/* Trạng thái */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="status" label="Trạng thái">
            <Select
              placeholder="Chọn trạng thái..."
              allowClear
              className="w-full"
              style={{ height: 40 }}
              options={STATUS_OPTIONS}
            />
          </Form.Item>
        </Col>

        {/* Từ ngày */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="date_from" label="Từ ngày">
            <DatePicker
              placeholder="Chọn ngày bắt đầu"
              className="w-full h-10"
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>

        {/* Đến ngày */}
        <Col xs={24} sm={12} md={6}>
          <Form.Item name="date_to" label="Đến ngày">
            <DatePicker
              placeholder="Chọn ngày kết thúc"
              className="w-full h-10"
              format="DD/MM/YYYY"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider className="my-4 border-slate-100" />

      <div className="flex justify-end gap-3">
        <Button
          onClick={handleReset}
          icon={<ClearOutlined />}
          className="h-10 rounded-lg flex items-center border-slate-200 text-slate-500 hover:text-slate-600 hover:border-slate-350"
        >
          Xóa bộ lọc
        </Button>
        <Button
          type="primary"
          onClick={handleSearch}
          loading={loading}
          icon={<SearchOutlined />}
          className="h-10 bg-orange-500 hover:bg-orange-600 border-none rounded-lg flex items-center shadow-md shadow-orange-500/10"
        >
          Tìm kiếm
        </Button>
      </div>
    </Form>
  );
};

export default StockMoveFilterPanel;
