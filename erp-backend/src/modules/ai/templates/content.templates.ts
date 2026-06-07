/**
 * SQL query thực tế để build content_text cho từng module
 * Đã điều chỉnh chính xác theo schema database ERP Mini thực tế
 *
 * Lưu ý: Mỗi query PHẢI SELECT branch_id để lưu vào Qdrant payload,
 * cho phép filter theo branch khi search (multi-tenant isolation).
 */
export const contentTemplates = {
  crm: {
    // Partners không có branch_id — dùng branch_id = 0 (global/shared)
    customer: `
      SELECT
        p.id,
        0 AS branch_id,
        CONCAT_WS(' | ',
          CONCAT('Khách hàng: ', p.name),
          CONCAT('Phân loại: ',  p.type),
          CONCAT('Ngành: ',      IFNULL(p.industry,      'N/A')),
          CONCAT('Thành phố: ',  IFNULL(p.province,      'N/A')),
          CONCAT('Điện thoại: ', IFNULL(p.phone,         'N/A')),
          CONCAT('Email: ',      IFNULL(p.email,         'N/A')),
          CONCAT('Hạn mức: ',    FORMAT(IFNULL(p.credit_limit, 0), 0), ' VND'),
          CONCAT('Địa chỉ: ',    IFNULL(p.address,       'N/A')),
          CONCAT('Website: ',    IFNULL(p.website,       'N/A'))
        ) AS content_text
      FROM partners p
      WHERE p.status = 'active' AND p.is_customer = 1
    `,

    lead: `
      SELECT
        l.id,
        IFNULL(l.branch_id, 0) AS branch_id,
        CONCAT_WS(' | ',
          CONCAT('Lead: ',          l.title),
          CONCAT('Khách hàng: ',    IFNULL(c.name, 'Chưa có')),
          CONCAT('Giai đoạn: ',     l.stage),
          CONCAT('Giá trị dự kiến: ', FORMAT(IFNULL(l.expected_value, 0), 0), ' VND'),
          CONCAT('Xác suất: ',      IFNULL(l.probability, 0), '%'),
          CONCAT('Mô tả: ',         IFNULL(l.description, ''))
        ) AS content_text
      FROM leads l
      LEFT JOIN partners c ON l.customer_id = c.id
    `,
  },

  purchase: {
    purchase_order: `
      SELECT
        po.id,
        po.branch_id,
        CONCAT(
          'Purchase Order: ', po.po_no, '\n',
          'Chi nhánh: ',      IFNULL(b.name, po.branch_id), '\n',
          'Nhà cung cấp: ',   v.name,       '\n',
          'Ngày đặt: ',       DATE_FORMAT(po.order_date, '%d/%m/%Y'), '\n',
          'Ngày giao dự kiến: ', IFNULL(DATE_FORMAT(po.expected_delivery_date, '%d/%m/%Y'), 'N/A'), '\n',
          'Trạng thái: ',     po.status,    '\n',
          'Tổng tiền: ',      FORMAT(po.total_after_tax, 0), ' VND\n',
          'Hàng hóa: ',
          GROUP_CONCAT(
            CONCAT(pol.quantity, ' ', IF(u.name IS NULL OR u.name = '', '', CONCAT(u.name, ' ')), p.name, ' x ', FORMAT(pol.unit_price, 0))
            ORDER BY pol.id
            SEPARATOR ', '
          )
        ) AS content_text
      FROM purchase_orders po
      JOIN partners v               ON po.supplier_id = v.id
      JOIN purchase_order_lines pol ON pol.po_id      = po.id
      JOIN products p               ON pol.product_id = p.id
      LEFT JOIN uoms u              ON pol.uom_id     = u.id
      LEFT JOIN branches b          ON po.branch_id   = b.id
      GROUP BY po.id, po.branch_id, po.po_no, v.name, po.order_date,
               po.expected_delivery_date, po.status, po.total_after_tax, b.name
    `,

    // Vendor là global (không có branch_id) — dùng branch_id = 0
    vendor: `
      SELECT
        p.id,
        0 AS branch_id,
        CONCAT_WS(' | ',
          CONCAT('Nhà cung cấp: ', p.name),
          CONCAT('Phân loại: ',    p.type),
          CONCAT('Điện thoại: ',   IFNULL(p.phone,   'N/A')),
          CONCAT('Email: ',        IFNULL(p.email,   'N/A')),
          CONCAT('Địa chỉ: ',      IFNULL(p.address, 'N/A')),
          CONCAT('Website: ',      IFNULL(p.website, 'N/A'))
        ) AS content_text
      FROM partners p
      WHERE p.status = 'active' AND p.is_supplier = 1
    `,
  },

  sale: {
    sale_order: `
      SELECT
        so.id,
        so.branch_id,
        CONCAT(
          'Sale Order: ',   so.order_no,   '\n',
          'Chi nhánh: ',    IFNULL(b.name, so.branch_id), '\n',
          'Khách hàng: ',   c.name,        '\n',
          'Ngày đặt: ',     DATE_FORMAT(so.order_date, '%d/%m/%Y'), '\n',
          'Trạng thái: ',   so.status,     '\n',
          'Tổng tiền: ',    FORMAT(so.total_after_tax, 0), ' VND\n',
          'Hàng hóa: ',
          GROUP_CONCAT(
            CONCAT(sol.quantity, ' ', IF(u.name IS NULL OR u.name = '', '', CONCAT(u.name, ' ')), p.name, ' x ', FORMAT(sol.unit_price, 0))
            ORDER BY sol.id
            SEPARATOR ', '
          )
        ) AS content_text
      FROM sale_orders so
      JOIN partners c          ON so.customer_id = c.id
      JOIN sale_order_lines sol ON sol.order_id   = so.id
      JOIN products p           ON sol.product_id = p.id
      LEFT JOIN uoms u          ON p.uom_id       = u.id
      LEFT JOIN branches b      ON so.branch_id   = b.id
      GROUP BY so.id, so.branch_id, so.order_no, c.name, so.order_date,
               so.status, so.total_after_tax, b.name
    `,
  },

  inventory: {
    // Product là global — stock_balances có branch_id nhưng sản phẩm thì không
    // Dùng branch_id = 0 cho product master data
    product: `
      SELECT
        p.id,
        0 AS branch_id,
        CONCAT_WS(' | ',
          CONCAT('Sản phẩm: ',    p.name),
          CONCAT('SKU: ',          p.sku),
          CONCAT('Phân loại: ',    IFNULL(p.product_type, 'storable')),
          CONCAT('Tồn kho: ',      IFNULL(SUM(sb.quantity), 0)),
          CONCAT('Giá bán: ',      FORMAT(IFNULL(p.sale_price, 0), 0), ' VND'),
          CONCAT('Giá nhập: ',     FORMAT(IFNULL(p.cost_price, 0), 0), ' VND'),
          CONCAT('Mô tả: ',        IFNULL(p.description, ''))
        ) AS content_text
      FROM products p
      LEFT JOIN stock_balances sb ON sb.product_id = p.id
      WHERE p.status = 'active'
      GROUP BY p.id, p.name, p.sku, p.product_type, p.sale_price, p.cost_price, p.description
    `,
  },
};
