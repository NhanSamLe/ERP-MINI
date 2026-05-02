import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { unwrapResult } from "@reduxjs/toolkit";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createQuotation } from "../store/quotation.slice";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { fetchProductsThunk } from "@/features/products/store/product.thunks";
import { CreateQuotationDto } from "../dto/quotation.dto";
import QuotationForm from "../components/QuotationForm";

export default function QuotationCreatePage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { items: customers } = useAppSelector((s) => s.partners);
  const { items: products }  = useAppSelector((s) => s.product);
  const { loading, error }   = useAppSelector((s) => s.quotation);

  const opportunityId = params.get("opportunity_id")
    ? Number(params.get("opportunity_id"))
    : undefined;

  useEffect(() => {
    dispatch(loadPartners({ type: "customer" }));
    dispatch(fetchProductsThunk());
  }, [dispatch]);

  const handleSubmit = async (data: CreateQuotationDto) => {
    try {
      const result  = await dispatch(createQuotation({ ...data, opportunity_id: opportunityId ?? null }));
      const created = unwrapResult(result);
      navigate(`/sales/quotations/${created.id}`);
    } catch (err: any) {
      // error đã được lưu vào Redux state (s.quotation.error) bởi slice
      // QuotationForm sẽ hiển thị thông qua prop submitError
      console.error("[CreateQuotation]", err);
    }
  };

  return (
    <QuotationForm
      mode="create"
      customers={customers}
      products={products}
      loading={loading}
      submitError={error ?? undefined}
      onSubmit={handleSubmit as any}
      onCancel={() => navigate("/sales/quotations")}
    />
  );
}
