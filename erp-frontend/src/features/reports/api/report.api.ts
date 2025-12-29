import axiosClient from "@/api/axiosClient";
import { ReportConfig } from "@/components/reports/ReportConfigModal";

export interface SalesReportSummary {
    time_period: string;
    total_revenue: number;
    total_orders: number;
}

export interface PurchaseReportSummary {
    time_period: string;
    total_expense: number;
    total_orders: number;
}

export const reportApi = {
    getSalesSummary: async (config: ReportConfig) => {
        const response = await axiosClient.get<{ data: SalesReportSummary[] }>(
            "/reports/sales",
            {
                params: {
                    period: config.period,
                    startDate: config.startDate,
                    endDate: config.endDate,
                },
            }
        );
        return response.data;
    },

    getPurchaseSummary: async (config: ReportConfig) => {
        const response = await axiosClient.get<{ data: PurchaseReportSummary[] }>(
            "/reports/purchase",
            {
                params: {
                    period: config.period,
                    startDate: config.startDate,
                    endDate: config.endDate,
                },
            }
        );
        return response.data;
    },
};
