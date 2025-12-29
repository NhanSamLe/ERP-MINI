import { useState } from "react";
import { Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/Button";

interface ReportConfigModalProps {
    open: boolean;
    onClose: () => void;
    onExport: (config: ReportConfig) => void;
    title?: string;
}

export interface ReportConfig {
    reportType: "detailed" | "summary";
    period: "day" | "month" | "year";
    startDate?: string;
    endDate?: string;
}

export default function ReportConfigModal({
    open,
    onClose,
    onExport,
    title = "Export Excel Data",
}: ReportConfigModalProps) {
    const [config, setConfig] = useState<ReportConfig>({
        reportType: "detailed",
        period: "month",
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0], // Jan 1st of current year
        endDate: new Date().toISOString().split("T")[0], // Today
    });

    const handleExport = () => {
        onExport(config);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Report Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">Report Type</label>
                        <div className="flex gap-4">
                            <div
                                className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${config.reportType === 'detailed' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                                onClick={() => setConfig({ ...config, reportType: 'detailed' })}
                            >
                                <div className="font-medium text-sm">Detailed List</div>
                                <div className="text-xs text-gray-500 mt-1">Export full list of records with all details.</div>
                            </div>
                            <div
                                className={`flex-1 border rounded-lg p-3 cursor-pointer transition-all ${config.reportType === 'summary' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                                onClick={() => setConfig({ ...config, reportType: 'summary' })}
                            >
                                <div className="font-medium text-sm">Summary Statistics</div>
                                <div className="text-xs text-gray-500 mt-1">Aggregated totals grouped by period.</div>
                            </div>
                        </div>
                    </div>

                    {/* Group By (Only for Summary) */}
                    {config.reportType === "summary" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">Group By</label>
                            <select
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                value={config.period}
                                onChange={(e) =>
                                    setConfig({ ...config, period: e.target.value as any })
                                }
                            >
                                <option value="day">Day</option>
                                <option value="month">Month</option>
                                <option value="year">Year</option>
                            </select>
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">From Date</label>
                            <input
                                type="date"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                value={config.startDate}
                                onChange={(e) =>
                                    setConfig({ ...config, startDate: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">To Date</label>
                            <input
                                type="date"
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                                value={config.endDate}
                                onChange={(e) =>
                                    setConfig({ ...config, endDate: e.target.value })
                                }
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} className="flex gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
