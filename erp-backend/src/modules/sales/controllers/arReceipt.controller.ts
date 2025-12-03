// arReceipt.controller.ts
import { Request, Response } from "express";
import { arReceiptService } from "../services/arReceipt.service";
import { ArReceiptAllocation } from "../models/arReceiptAllocation.model";
import { ArInvoice } from "../models/arInvoice.model";
import { SaleOrder } from "../models/saleOrder.model";
import { Partner } from "../../../models";

export const ArReceiptController = {
  /** LIST */
  async getAll(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const filters = req.query;

    const data = await arReceiptService.getAll(user, filters);

    return res.json(data);
  } catch (e: any) {
    return res.status(400).json({ message: e.message });
  }
}, 

  /** DETAIL */
  async getOne(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const result = await arReceiptService.getById(id, user);
      return res.json({ data: result });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** CREATE */
  async create(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const receipt = await arReceiptService.create(req.body, user);
      return res.status(201).json({ message: "Created", data: receipt });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** UPDATE */
  async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = (req as any).user;

      const receipt = await arReceiptService.update(id, req.body, user);
      return res.json({ message: "Updated", data: receipt });
    } catch (err: any) {
      return res.status(400).json({ message: err.message });
    }
  },

  /** SUBMIT */
  /** SUBMIT */
async submit(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;

    const result = await arReceiptService.submit(id, user);
    return res.json({ message: "Submitted", data: result });

  } catch (err: any) {
    console.error("🔥 SUBMIT RECEIPT ERROR:", {
      message: err.message,
      name: err.name,
      errors: err.errors,
      parent: err.parent,
      stack: err.stack,
      sql: err.sql,
    });

    return res.status(400).json({
      message: err.message,
      name: err.name,
      errors: err.errors,
    });
  }
},

/** APPROVE */
async approve(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;

    const result = await arReceiptService.approve(id, user);
    return res.json({ message: "Approved", data: result });

  } catch (err: any) {
    console.error("🔥 APPROVE RECEIPT ERROR:", {
      message: err.message,
      name: err.name,
      errors: err.errors,
      parent: err.parent,
      stack: err.stack,
      sql: err.sql,
    });

    return res.status(403).json({
      message: err.message,
      name: err.name,
      errors: err.errors,
    });
  }
},

/** REJECT */
async reject(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;

    const result = await arReceiptService.reject(id, user, req.body.reason);
    return res.json({ message: "Rejected", data: result });

  } catch (err: any) {
    console.error("🔥 REJECT RECEIPT ERROR:", {
      message: err.message,
      name: err.name,
      errors: err.errors,
      parent: err.parent,
      stack: err.stack,
      sql: err.sql,
    });

    return res.status(403).json({
      message: err.message,
      name: err.name,
      errors: err.errors,
    });
  }
},
/** ALLOCATE */
async allocate(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const user = (req as any).user;

    const result = await arReceiptService.allocate(id, req.body.allocations, user);
    return res.json({ message: "Allocated", data: result });

  } catch (err: any) {
    console.error("🔥 ALLOCATE RECEIPT ERROR:", {
      message: err.message,
      name: err.name,
      errors: err.errors,
      parent: err.parent,
      stack: err.stack,
      sql: err.sql,
    });

    return res.status(403).json({
      message: err.message,
      name: err.name,
      errors: err.errors,
    });
  }
},
async getUnpaidInvoices(req: Request, res: Response) {
  try {
    const customerId = Number(req.params.customer_id);
    if (!customerId)
      return res.status(400).json({ message: "customer_id is required" });

    // 1) Lấy all invoices của khách này qua SaleOrder
    const invoices = await ArInvoice.findAll({
      where: {
        status: "posted",  // chỉ invoice đã posted, chưa paid
      },
      include: [
        // ✔ Lấy SaleOrder để filter theo customer
        {
          model: SaleOrder,
          as: "order",
          where: { customer_id: customerId },
          attributes: ["id", "order_no", "order_date"],
        },

        // ✔ Lấy allocation từ bảng ar_receipt_allocations
        {
          model: ArReceiptAllocation,
          as: "allocations",
          attributes: ["applied_amount"],
        }
      ],
      order: [["id", "DESC"]],
    });

    const result = invoices.map((inv: any) => {
      const allocations = inv.allocations || [];

      const allocated = allocations.reduce(
        (sum: number, a: any) => sum + Number(a.applied_amount || 0),
        0
      );

      const total = Number(inv.total_after_tax || 0);
      const unpaid = total - allocated;

      return {
        invoice_id: inv.id,
        invoice_no: inv.invoice_no,
        invoice_date: inv.invoice_date,
        total_after_tax: total,
        allocated,
        unpaid,
        order: inv.order,
      };
    });

    return res.json({ data: result });

  } catch (err: any) {
    return res.status(400).json({ message: err.message });
  }
},
async getCustomersWithDebt(req: Request, res: Response) {
  try {
    const invoicesRaw = await ArInvoice.findAll({
      where: { status: ["posted", "approved"] },
      include: [
        {
          model: SaleOrder,
          as: "order",
          include: [
            {
              model: Partner,
              as: "customer",
              attributes: ["id", "name"],
            },
          ],
        },
        {
          model: ArReceiptAllocation,
          as: "allocations",
          attributes: ["applied_amount"],
        },
      ],
    });

    // Convert to plain objects
    const invoices = invoicesRaw.map(inv =>
      inv.get({ plain: true }) as {
        id: number;
        total_after_tax: number;

        allocations?: { applied_amount?: number }[];
        order?: {
          customer?: { id: number; name: string };
        };
      }
    );

    const map = new Map<number, { id: number; name: string; total: number }>();

    for (const inv of invoices) {
      const allocated = (inv.allocations ?? []).reduce(
        (sum, a) => sum + Number(a.applied_amount || 0),
        0
      );

      const unpaid = inv.total_after_tax - allocated;
      if (unpaid <= 0) continue;

      const cust = inv.order?.customer;
      if (!cust) continue;

      if (!map.has(cust.id)) {
        map.set(cust.id, { id: cust.id, name: cust.name, total: unpaid });
      } else {
        map.get(cust.id)!.total += unpaid;
      }
    }

    return res.json({ data: Array.from(map.values()) });
  } catch (err) {
    return res.status(500).json({ message: (err as Error).message });
  }
}

};
