import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchInvoices } from "../store/invoice.slice";
import InvoiceListPage from "./InvoiceListPage";
import { useNavigate } from "react-router-dom";

export default function InvoiceListContainer() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { items, loading } = useAppSelector((state) => state.invoice);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const handleView = (id: number) => {
    navigate(`/invoices/${id}`);
  };


  return (
    <InvoiceListPage
      invoices={items}
      loading={loading}
      onView={handleView}
    />
  );
}
