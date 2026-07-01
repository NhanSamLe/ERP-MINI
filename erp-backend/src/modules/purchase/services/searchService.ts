import { PurchaseOrder } from "../models/purchaseOrder.model";
import { PurchaseOrderLine } from "../models/purchaseOrderLine.model";
import { User, Partner } from "../../../models";
import { Op } from "sequelize";

export interface SearchQuery {
  po_no?: string;
  supplier_id?: number;
  status?: string[];
  date_from?: string;
  date_to?: string;
  total_from?: number;
  total_to?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
}

export interface SearchResult {
  items: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const searchService = {
  /**
   * Xây dựng where clause từ các filter
   */
  buildWhereClause(filters: SearchQuery, branchId: number): any {
    const where: any = { branch_id: branchId };

    // Lọc theo po_no (partial match, case-insensitive)
    if (filters.po_no) {
      where.po_no = {
        [Op.like]: `%${filters.po_no}%`,
      };
    }

    // Lọc theo supplier_id
    if (filters.supplier_id) {
      where.supplier_id = filters.supplier_id;
    }

    // Lọc theo status
    if (filters.status && filters.status.length > 0) {
      where.status = {
        [Op.in]: filters.status,
      };
    }

    // Lọc theo khoảng ngày
    if (filters.date_from || filters.date_to) {
      where.order_date = {};

      if (filters.date_from) {
        where.order_date[Op.gte] = new Date(filters.date_from);
      }

      if (filters.date_to) {
        const dateTo = new Date(filters.date_to);
        dateTo.setHours(23, 59, 59, 999);
        where.order_date[Op.lte] = dateTo;
      }
    }

    // Lọc theo khoảng tổng tiền
    if (filters.total_from !== undefined || filters.total_to !== undefined) {
      where.total_after_tax = {};

      if (filters.total_from !== undefined) {
        where.total_after_tax[Op.gte] = filters.total_from;
      }

      if (filters.total_to !== undefined) {
        where.total_after_tax[Op.lte] = filters.total_to;
      }
    }

    return where;
  },

  /**
   * Xây dựng order clause từ sort params
   */
  buildOrderClause(
    sort_by: string = "created_at",
    sort_order: "ASC" | "DESC" = "DESC",
  ): any[] {
    const validSortFields = [
      "po_no",
      "order_date",
      "total_after_tax",
      "status",
      "created_at",
    ];

    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "created_at";
    const sortDirection = sort_order === "ASC" ? "ASC" : "DESC";

    return [[sortField, sortDirection]];
  },

  /**
   * Tìm kiếm PO với các filter
   */
  async search(filters: SearchQuery, branchId: number): Promise<SearchResult> {
    // Validate pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    // Build where clause
    const where = this.buildWhereClause(filters, branchId);

    // Build order clause
    const order = this.buildOrderClause(filters.sort_by, filters.sort_order);

    // Execute query
    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name", "email"],
        },
        {
          model: User,
          as: "approver",
          attributes: ["id", "full_name", "email"],
        },
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "email", "phone"],
        },
      ],
      order,
      limit,
      offset,
      subQuery: false,
    });

    // Calculate pagination
    const totalPages = Math.ceil(count / limit);

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages,
      },
    };
  },

  /**
   * Tìm kiếm PO theo status
   */
  async searchByStatus(
    statuses: string[],
    branchId: number,
    limit: number = 100,
  ): Promise<PurchaseOrder[]> {
    return PurchaseOrder.findAll({
      where: {
        branch_id: branchId,
        status: {
          [Op.in]: statuses,
        },
      },
      include: [
        {
          model: PurchaseOrderLine,
          as: "lines",
        },
      ],
      limit,
      order: [["created_at", "DESC"]],
    });
  },

  /**
   * Tìm kiếm PO theo supplier
   */
  async searchBySupplier(
    supplierId: number,
    branchId: number,
    limit: number = 100,
  ): Promise<PurchaseOrder[]> {
    return PurchaseOrder.findAll({
      where: {
        branch_id: branchId,
        supplier_id: supplierId,
      },
      include: [
        {
          model: Partner,
          as: "supplier",
          attributes: ["id", "name", "email"],
        },
      ],
      limit,
      order: [["created_at", "DESC"]],
    });
  },
};
