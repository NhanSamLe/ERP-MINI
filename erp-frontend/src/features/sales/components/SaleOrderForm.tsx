import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import SaleOrderGeneralForm from "./SaleOrderGeneralForm";
import SaleOrderLinesTable from "./SaleOrderLinesTable";
import SaleOrderTotals from "./SaleOrderTotals";

import { fetchProductsThunk } from "@/features/products/store/product.thunks";
import { loadPartners } from "@/features/partner/store/partner.thunks";

import {
  CreateSaleOrderDto,
  CreateSaleOrderLineDto,
  SaleOrderDto,
  SaleOrderLineDto,
} from "../dto/saleOrder.dto";

interface Props {
  mode: "create" | "edit";
  defaultValue?: SaleOrderDto;
  onSubmit: (data: CreateSaleOrderDto) => void;
}

export default function SaleOrderForm({ mode, defaultValue, onSubmit }: Props) {
  const dispatch = useAppDispatch();
  const products = useAppSelector((s) => s.product.items);
  const customers = useAppSelector((s) => s.partners.items);

  // =============================
  // STATE
  // =============================

  const [customerId, setCustomerId] = useState<number | "">(
    defaultValue?.customer_id ?? ""
  );

  const [orderDate, setOrderDate] = useState<string>(() => {
    if (defaultValue?.order_date) {
      // nếu dạng ISO → cắt T
      return defaultValue.order_date.split("T")[0];
    }
    // create mode → tự set ngày hôm nay
    return new Date().toISOString().substring(0, 10);
  });

  const [lines, setLines] = useState<SaleOrderLineDto[]>(
    defaultValue?.lines ?? []
  );

  // =============================
  // LOAD DATA
  // =============================

  useEffect(() => {
    dispatch(fetchProductsThunk());
    dispatch(loadPartners({ type: "customer" }));
  }, [dispatch]);

  // =============================
  // LINE OPERATIONS
  // =============================

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        product_id: 0,
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (
    index: number,
    field: keyof SaleOrderLineDto,
    value: string | number
  ) => {
    setLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[index], [field]: value };

      // auto fill product info
      if (field === "product_id") {
        const p = products.find((x) => x.id === Number(value));
        if (p) {
          line.unit_price = p.sale_price ?? 0;
          line.tax_rate_id = p.tax_rate_id ?? undefined;
        }
      }

      updated[index] = line;
      return updated;
    });
  };

  // =============================
  // CALCULATE LINES
  // =============================

  const calcLine = (line: SaleOrderLineDto) => {
    const qty = Number(line.quantity ?? 0);
    const price = Number(line.unit_price ?? 0);

    const product = products.find((p) => p.id === line.product_id);
    const taxRate = product?.taxRate?.rate ?? 0;

    const lineTotal = qty * price;
    const taxAmount = (lineTotal * taxRate) / 100;
    const final = lineTotal + taxAmount;

    return { lineTotal, taxAmount, final };
  };

  const totals = lines.reduce(
    (acc, line) => {
      const c = calcLine(line);
      acc.subtotal += c.lineTotal;
      acc.tax += c.taxAmount;
      acc.total += c.final;
      return acc;
    },
    { subtotal: 0, tax: 0, total: 0 }
  );

  // =============================
  // SUBMIT HANDLER
  // =============================

  const handleSubmit = () => {
    if (!customerId || lines.length === 0) return;

    const mappedLines: CreateSaleOrderLineDto[] = lines
      .filter(
        (l) =>
          l.product_id !== undefined &&
          l.quantity !== undefined &&
          l.unit_price !== undefined
      )
      .map((l) => {
        const item: CreateSaleOrderLineDto = {
          product_id: l.product_id as number,
          quantity: Number(l.quantity),
          unit_price: Number(l.unit_price),
          description: products.find(p => p.id === l.product_id)?.name ?? "", 
        };

        if (typeof l.tax_rate_id === "number") {
          item.tax_rate_id = l.tax_rate_id;
        }

        return item;
      });

    const payload: CreateSaleOrderDto = {
      customer_id: Number(customerId),
      order_date: orderDate,
      lines: mappedLines,
    };
    console.log("🔥 Payload gửi lên:", payload);
    onSubmit(payload);
  };

  // =============================
  // RENDER
  // =============================

  return (
    <>
      <SaleOrderGeneralForm
        customers={customers}
        customerId={customerId}
        orderDate={orderDate}
        onCustomerChange={setCustomerId}
        onDateChange={setOrderDate}
      />

      <SaleOrderLinesTable
        lines={lines}
        products={products}
        onAddLine={addLine}
        onRemoveLine={removeLine}
        onUpdateLine={updateLine}
        calcLine={calcLine}
      />

      <SaleOrderTotals
        subtotal={totals.subtotal}
        tax={totals.tax}
        total={totals.total}
      />

      <div className="flex justify-end gap-3 mt-4">
        <button className="px-4 py-2 border rounded-lg">Cancel</button>

        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          {mode === "edit" ? "Save Changes" : "Save Draft"}
        </button>
      </div>
    </>
  );
}
