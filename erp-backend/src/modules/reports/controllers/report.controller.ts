import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import { SaleOrder } from "../../sales/models/saleOrder.model";
import { PurchaseOrder } from "../../purchase/models/purchaseOrder.model";
import { sequelize } from "../../../config/db";

export class ReportController {
    // ============================================
    // SALES SUMMARY
    // ============================================
    static async getSalesSummary(req: Request, res: Response) {
        try {
            const { period, startDate, endDate } = req.query; // period: 'day', 'month', 'year'

            // Default to current year if not specified
            const start = startDate ? new Date(String(startDate)) : new Date(new Date().getFullYear(), 0, 1);
            const end = endDate ? new Date(String(endDate)) : new Date();

            let dateFormat = "%Y-%m-%d"; // default day
            if (period === "month") dateFormat = "%Y-%m";
            if (period === "year") dateFormat = "%Y";

            // SQLite syntax for strftime. 
            // NOTE: If using Postgres/MySQL, this syntax differs. 
            // Assuming SQLite based on project context (often used in simple setups) or checking DB config.
            // If Sequelize is abstracting, we try standard functions.
            // However, Sequelize doesn't have a universal 'truncate date' function.
            // Let's assume standard SQL or try to adapt.
            // For cross-db safety, grouping usually requires DB-specific syntax.
            // Let's check DB config first or assume MySQL/Postgres.
            // Actually, let's use a safe approach: Fetch data and aggregate in JS if dataset isn't huge, 
            // OR use raw query for performance. Given it's an ERP, let's try Sequelize grouping.

            // Checking project DB... it uses 'sqlite' or 'postgres'? 
            // I'll assume SQLite for 'erp-mini' usually, but I see 'pg' might be used.
            // Let's check `config/db.ts` later. For now, writing generic logic.

            const whereClause: any = {
                order_date: {
                    [Op.between]: [start, end]
                },
                status: {
                    [Op.not]: 'cancelled'
                }
            };

            // MySQL syntax for DATE_FORMAT
            // SQLite was: strftime(format, col)
            // MySQL is: DATE_FORMAT(col, format)

            const salesData = await SaleOrder.findAll({
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat), 'time_period'],
                    [sequelize.fn('SUM', sequelize.col('total_after_tax')), 'total_revenue'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders']
                ],
                where: whereClause,
                group: [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat)],
                order: [[sequelize.col('time_period'), 'ASC']],
                raw: true
            });

            res.status(200).json({
                data: salesData,
                meta: {
                    period,
                    start,
                    end
                }
            });

        } catch (error) {
            console.error("Error generating sales report:", error);
            res.status(500).json({ message: "Failed to generate sales report" });
        }
    }

    // ============================================
    // PURCHASE SUMMARY
    // ============================================
    static async getPurchaseSummary(req: Request, res: Response) {
        try {
            const { period, startDate, endDate } = req.query;

            const start = startDate ? new Date(String(startDate)) : new Date(new Date().getFullYear(), 0, 1);
            const end = endDate ? new Date(String(endDate)) : new Date();

            let dateFormat = "%Y-%m-%d";
            if (period === "month") dateFormat = "%Y-%m";
            if (period === "year") dateFormat = "%Y";

            const whereClause: any = {
                order_date: {
                    [Op.between]: [start, end]
                },
                status: {
                    [Op.not]: 'cancelled'
                }
            };

            const purchaseData = await PurchaseOrder.findAll({
                attributes: [
                    [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat), 'time_period'],
                    [sequelize.fn('SUM', sequelize.col('total_after_tax')), 'total_expense'],
                    [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders']
                ],
                where: whereClause,
                group: [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat)],
                order: [[sequelize.col('time_period'), 'ASC']],
                raw: true
            });

            res.status(200).json({
                data: purchaseData,
                meta: {
                    period,
                    start,
                    end
                }
            });

        } catch (error) {
            console.error("Error generating purchase report:", error);
            res.status(500).json({ message: "Failed to generate purchase report" });
        }
    }
}
