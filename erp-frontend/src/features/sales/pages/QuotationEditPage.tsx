import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { unwrapResult } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchQuotationById, updateQuotation } from "../store/quotation.slice";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { fetchProductsThunk } from "@/features/products/store/product.thunks";
import { UpdateQuotationDto } from "../dto/quotation.dto";
import QuotationForm from "../components/QuotationForm";
import { Loader2 } from "lucide-react";

export default function QuotationEditPage() {
  const { id }    = useParams();
  const dispatch  = useAppDispatch();
  const navigate  = useNavigate();

  const { selected: quotation, loading } = useAppSelector((s) => s.quotation);
  const { items: customers } = useAppSelector((s) => s.partners);
  const { items: products }  = useAppSelector((s) => s.product);

  useEffect(() => {
    if (id) dispatch(fetchQuotationById(Number(id)));
    dispatch(loadPartners({ type: "customer" }));
    dispatch(fetchProductsThunk());
  }, [dispatch, id]);

  if (loading || !quotation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Đang tải báo giá...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (data: UpdateQuotationDto) => {
    try {
      const result = await dispatch(updateQuotation({ id: quotation.id, data }));
      unwrapResult(result);
      navigate(`/sales/quotations/${quotation.id}`);
    } catch (err) {
      console.error("Failed to update quotation:", err);
    }
  };

  return (
    <QuotationForm
      mode="edit"
      defaultValue={quotation}
      customers={customers}
      products={products}
      loading={loading}
      onSubmit={handleSubmit as any}
      onCancel={() => navigate(`/sales/quotations/${quotation.id}`)}
    />
  );
}
