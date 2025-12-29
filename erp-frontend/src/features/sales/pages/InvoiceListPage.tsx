import { useState, useMemo } from "react";
import { ArInvoiceDto } from "../dto/invoice.dto";
import InvoiceListHeader from "../components/ar.components.ts/InvoiceListHeader";
import FilterPanel from "../components/ar.components.ts/FilterPanel";
import InvoiceTable from "../components/ar.components.ts/InvoiceTable";
import PaginationFooter from "../components/ar.components.ts/PaginationFooter";
import CreateInvoiceModal from "../components/ar.components.ts/InvoiceCreateModal";
import { fetchAvailableOrders, createInvoice, fetchInvoices } from "../store/invoice.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { exportExcelReport } from "@/utils/excel/exportExcelReport";


interface Props {
  invoices: ArInvoiceDto[];
  loading: boolean;
  onView: (id: number) => void;
}

export default function InvoiceListPage({
  invoices,
  onView,
}: Props) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const { availableOrders } = useAppSelector((s) => s.invoice);
  const { user } = useAppSelector((s) => s.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const handleOpenModal = () => {
    dispatch(fetchAvailableOrders());
    setModalOpen(true);
  };

  const handleSelectOrder = (orderId: number) => {
    dispatch(createInvoice({ order_id: orderId })).then(() => {
      setModalOpen(false);
      // reload
      dispatch(fetchInvoices());
    });
  };

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.invoice_no.toLowerCase().includes(search.toLowerCase()) ||
        inv.order?.customer?.name?.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        status === "all" || inv.status === status;

      return matchSearch && matchStatus;
    });
  }, [invoices, search, status]);

  const handleExport = async () => {
    try {
      await exportExcelReport({
        title: "DANH SÁCH HÓA ĐƠN BÁN HÀNG (AR INVOICES)",
        columns: [
          { header: "Số hóa đơn", key: "invoice_no", width: 15 },
          { header: "Ngày hóa đơn", key: "invoice_date", width: 15, formatter: (val) => val ? new Date(String(val)).toLocaleDateString('vi-VN') : "" },
          { header: "Khách hàng", key: "order", width: 30, formatter: (val: any) => val?.customer?.name || "-" },
          { header: "Tổng tiền", key: "total_after_tax", width: 20, format: "currency", align: "right" },
          { header: "Trạng thái", key: "status", width: 15, formatter: (val) => String(val).toUpperCase() },
          { header: "Duyệt", key: "approval_status", width: 15, formatter: (val) => String(val).toUpperCase() },
          { header: "Người tạo", key: "creator", width: 20, formatter: (val: any) => val?.full_name || "-" },
        ],
        data: filtered,
        fileName: `Bao_Cao_Hoa_Don_${new Date().getTime()}.xlsx`,
        footer: {
          creator: user?.full_name || "Admin"
        }
      });
    } catch (err) {
      console.error(err);
      alert("Lỗi xuất file excel");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <InvoiceListHeader onCreateNew={handleOpenModal} onExport={handleExport} />


      <FilterPanel
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <InvoiceTable
        invoices={filtered}
        onView={onView}
      />

      <PaginationFooter
        totalItems={invoices.length}
        filteredItems={filtered.length}
      />
      <CreateInvoiceModal
        open={modalOpen}
        orders={availableOrders}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectOrder}
      />
    </div>
  );
}
