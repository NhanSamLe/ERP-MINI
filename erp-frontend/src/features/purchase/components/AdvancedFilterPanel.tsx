import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Select,
} from "antd";
import { SearchOutlined, ClearOutlined } from "@ant-design/icons";
import { SearchQuery } from "../store/purchaseOrder.types";
import { fetchPartners } from "../../partner/partner.service";
import { Partner } from "../../partner/store/partner.types";

interface AdvancedFilterPanelProps {
  onSearch: (filters: SearchQuery) => void;
  onReset: () => void;
  loading?: boolean;
}

const PO_STATUS_OPTIONS = [
  { label: "Nháp", value: "draft" },
  { label: "Chờ phê duyệt", value: "waiting_approval" },
  { label: "Đã xác nhận", value: "confirmed" },
  { label: "Nhập hàng một phần", value: "partially_received" },
  { label: "Hoàn thành", value: "completed" },
  { label: "Đã hủy", value: "cancelled" },
];

const SORT_BY_OPTIONS = [
  { label: "Mã PO", value: "po_no" },
  { label: "Ngày đặt hàng", value: "order_date" },
  { label: "Tổng tiền", value: "total_after_tax" },
  { label: "Trạng thái", value: "status" },
];

const SORT_ORDER_OPTIONS = [
  { label: "Tăng dần", value: "ASC" },
  { label: "Giảm dần", value: "DESC" },
];

export const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
  onSearch,
  onReset,
  loading = false,
}) => {
  const [form] = Form.useForm();
  const [isExpanded, setIsExpanded] = useState(false);
  const [suppliers, setSuppliers] = useState<Partner[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  useEffect(() => {
    const loadSuppliers = async () => {
      setSuppliersLoading(true);
      try {
        const data = await fetchPartners({ type: "supplier", status: "active" });
        setSuppliers(data);
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      } finally {
        setSuppliersLoading(false);
      }
    };
    loadSuppliers();
  }, []);

  const handleSearch = async () => {
    try {
      const values = await form.validateFields();
      const filters: SearchQuery = {
        po_no: values.po_no || undefined,
        supplier_id: values.supplier_id || undefined,
        status: values.status || undefined,
        date_from: values.date_from
          ? values.date_from.format("YYYY-MM-DD")
          : undefined,
        date_to: values.date_to
          ? values.date_to.format("YYYY-MM-DD")
          : undefined,
        total_from: values.total_from || undefined,
        total_to: values.total_to || undefined,
        page: 1,
        limit: 20,
        sort_by: values.sort_by || "created_at",
        sort_order: values.sort_order || "DESC",
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
    <Card
      className="advanced-filter-panel"
      style={{ marginBottom: 16 }}
      size="small"
    >
      <Form form={form} layout="vertical" autoComplete="off">
        {/* Row 1: Po_no, Supplier_id, Status */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Mã đơn đặt hàng"
              name="po_no"
              tooltip="Tìm kiếm theo mã PO (hỗ trợ tìm kiếm từng phần)"
            >
              <Input placeholder="VD: PO-2026" allowClear />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Nhà cung cấp"
              name="supplier_id"
              tooltip="Chọn nhà cung cấp"
            >
              <Select
                showSearch
                placeholder="Chọn nhà cung cấp"
                loading={suppliersLoading}
                optionFilterProp="label"
                options={suppliers.map((s) => ({
                  label: s.name,
                  value: s.id,
                }))}
                allowClear
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Trạng thái"
              name="status"
              tooltip="Chọn một hoặc nhiều trạng thái"
            >
              <Select
                mode="multiple"
                placeholder="Chọn trạng thái"
                options={PO_STATUS_OPTIONS}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Row 2: Date Range */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Từ ngày"
              name="date_from"
              tooltip="Ngày đặt hàng từ"
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Chọn ngày bắt đầu"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Đến ngày"
              name="date_to"
              tooltip="Ngày đặt hàng đến"
            >
              <DatePicker
                style={{ width: "100%" }}
                placeholder="Chọn ngày kết thúc"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            {/* Spacer */}
          </Col>
        </Row>

        {/* Row 3: Total Range */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Tổng tiền từ"
              name="total_from"
              tooltip="Tổng tiền sau thuế từ"
            >
              <InputNumber
                placeholder="0"
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              label="Tổng tiền đến"
              name="total_to"
              tooltip="Tổng tiền sau thuế đến"
            >
              <InputNumber
                placeholder="0"
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                }
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            {/* Spacer */}
          </Col>
        </Row>

        {/* Row 4: Sort Options */}
        {isExpanded && (
          <>
            <Divider style={{ margin: "12px 0" }} />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="Sắp xếp theo"
                  name="sort_by"
                  initialValue="created_at"
                >
                  <Select
                    placeholder="Chọn trường sắp xếp"
                    options={SORT_BY_OPTIONS}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item label="Thứ tự" name="sort_order" initialValue="DESC">
                  <Select
                    placeholder="Chọn thứ tự"
                    options={SORT_ORDER_OPTIONS}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                {/* Spacer */}
              </Col>
            </Row>
          </>
        )}

        {/* Action Buttons */}
        <Row gutter={[8, 8]} style={{ marginTop: 16 }}>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              Tìm kiếm
            </Button>
          </Col>

          <Col>
            <Button icon={<ClearOutlined />} onClick={handleReset}>
              Xóa bộ lọc
            </Button>
          </Col>

          <Col>
            <Button type="text" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Ẩn" : "Hiển thị"} tùy chọn nâng cao
            </Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default AdvancedFilterPanel;
