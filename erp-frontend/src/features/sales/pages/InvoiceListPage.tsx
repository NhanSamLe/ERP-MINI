import { useState, useMemo } from "react";
import { ArInvoiceDto } from "../dto/invoice.dto";
import InvoiceListHeader from "../components/ar.components.ts/InvoiceListHeader";
import FilterPanel from "../components/ar.components.ts/FilterPanel";
import InvoiceTable from "../components/ar.components.ts/InvoiceTable";
import PaginationFooter from "../components/ar.components.ts/PaginationFooter";
import CreateInvoiceModal from "../components/ar.components.ts/InvoiceCreateModal";
import { fetchAvailableOrders, createInvoice, fetchInvoices } from "../store/invoice.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";


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

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <InvoiceListHeader onCreateNew={handleOpenModal} />


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
