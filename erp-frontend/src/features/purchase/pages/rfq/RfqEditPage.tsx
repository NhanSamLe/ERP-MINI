import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  Plus,
  Search,
  Trash2,
  FileText,
  Package,
  ArrowLeft,
} from "lucide-react";
import { AppDispatch, RootState } from "../../../../store/store";
import {
  fetchRfqByIdThunk,
  updateRfqThunk,
  clearSelected,
} from "../../store/rfq";
import { loadPartners } from "@/features/partner/store/partner.thunks";
import { searchProductsThunk } from "../../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllUomsThunk } from "../../../master-data/store/master-data/uom/uom.thunks";
import { fetchAllConversionsThunk } from "../../../master-data/store/master-data/conversion/conversion.thunks";
import { StandardFormLayout } from "../../../../components/layout/StandardFormLayout";
import { FormSection } from "../../../../components/layout/FormSection";
import { Product } from "../../../products/store/product.types";
import { Uom } from "@/features/master-data/dto/uom.dto";
import {
  getValidUomsForProduct,
  previewQtyInStockUom,
} from "../../utils/uomHelper";

interface LineItem {
  tempId: number;
  product_id: number;
  product_name: string;
  stock_uom_id: number | null;
  uom_id: number | null;
  quantity: number;
  unit_price: number;
  tax_rate_id?: number | null;
  tax_rate: number;
  line_tax: number;
  line_total: number;
  line_total_after_tax: number;
  lead_time_days?: number | null;
  description?: string;
}

function calcLine(
  qty: number,
  price: number,
  taxRate: number,
): Pick<LineItem, "line_tax" | "line_total" | "line_total_after_tax"> {
  const line_total = qty * price;
  const line_tax = (line_total * taxRate) / 100;
  return { line_total, line_tax, line_total_after_tax: line_total + line_tax };
}

export default function RfqEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const partners = useSelector((s: RootState) => s.partners);
  const user = useSelector((s: RootState) => s.auth.user);
  const { selected: rfq, loading } = useSelector((s: RootState) => s.rfq);
  const uoms = useSelector((s: RootState) => (s as any).uom?.Uoms ?? []);
  const conversions = useSelector(
    (s: RootState) => (s as any).conversion?.UomConversions ?? [],
  );

  // Header fields
  const [supplierId, setSupplierId] = useState<number | "">("");
  const [rfqDate, setRfqDate] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [supplierNotes, setSupplierNotes] = useState("");

  // Line items
  const [lines, setLines] = useState<LineItem[]>([]);

  // Product search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Load RFQ data
  useEffect(() => {
    const numId = Number(id);
    if (id && !isNaN(numId)) {
      dispatch(fetchRfqByIdThunk(numId))
        .unwrap()
        .then((data) => {
          if (!data) {
            setPageLoading(false);
            return;
          }
          setSupplierId(data.supplier_id ?? "");
          setRfqDate(data.rfq_date?.split("T")[0] ?? "");
          setValidUntil(data.valid_until?.split("T")[0] ?? "");
          setInternalNotes(data.internal_notes ?? "");
          setSupplierNotes(data.supplier_notes ?? "");

          // Load lines
          const loadedLines = (data.lines ?? []).map(
            (line: any, idx: number) => {
              const taxRate = Number(line.tax_rate_id ?? 0);
              return {
                tempId: idx,
                product_id: line.product_id,
                product_name:
                  line.product?.name ?? `Product ${line.product_id}`,
                stock_uom_id: line.product?.uom_id ?? null,
                uom_id: line.uom_id,
                quantity: Number(line.quantity),
                unit_price: Number(line.unit_price),
                tax_rate_id: line.tax_rate_id,
                tax_rate: taxRate,
                line_tax: Number(line.line_tax),
                line_total: Number(line.line_total),
                line_total_after_tax: Number(line.line_total_after_tax),
                lead_time_days: line.lead_time_days ?? null,
                description: line.description ?? "",
              };
            },
          );
          setLines(loadedLines);
          setPageLoading(false);
        })
        .catch(() => {
          setPageLoading(false);
        });
    } else {
      setPageLoading(false);
    }
    return () => {
      dispatch(clearSelected());
    };
  }, [id, dispatch]);

  useEffect(() => {
    dispatch(loadPartners({ type: "supplier" }));
    dispatch(fetchAllUomsThunk());
    dispatch(fetchAllConversionsThunk());
  }, [dispatch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced product search
  useEffect(() => {
    const timer = setTimeout(() => {
      const kw = searchTerm.trim();
      if (kw.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        return;
      }
      setSearchLoading(true);
      dispatch(searchProductsThunk(kw))
        .unwrap()
        .then((data) => {
          setSearchResults(data ?? []);
          setShowDropdown(true);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  const handleAddProduct = async (product: Product) => {
    if (lines.some((l) => l.product_id === product.id)) {
      toast.warning("Product already added");
      return;
    }
    const tax = await dispatch(
      fetchTaxRatesByIdThunk(product.tax_rate_id || 0),
    ).unwrap();
    const taxRate = Number(tax?.rate ?? 0);
    const price = Number(product.cost_price ?? 0);
    const calc = calcLine(1, price, taxRate);
    const stockUomId = product.uom_id ?? null;
    const purchaseUomId = (product as any).purchase_uom_id ?? stockUomId;
    setLines((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        product_id: product.id,
        product_name: product.name,
        stock_uom_id: stockUomId,
        uom_id: purchaseUomId,
        quantity: 1,
        unit_price: price,
        tax_rate_id: product.tax_rate_id ?? null,
        tax_rate: taxRate,
        ...calc,
        lead_time_days: null,
        description: "",
      },
    ]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const updateLine = (
    tempId: number,
    field: string,
    value: number | string | null,
  ) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.tempId !== tempId) return l;
        const updated = { ...l, [field]: value };
        const calc = calcLine(
          Number(updated.quantity),
          Number(updated.unit_price),
          updated.tax_rate,
        );
        return { ...updated, ...calc };
      }),
    );
  };

  const removeLine = (tempId: number) =>
    setLines((prev) => prev.filter((l) => l.tempId !== tempId));

  // Totals
  const totalBeforeTax = lines.reduce((s, l) => s + l.line_total, 0);
  const totalTax = lines.reduce((s, l) => s + l.line_tax, 0);
  const totalAfterTax = totalBeforeTax + totalTax;

  const handleSubmit = async () => {
    if (!rfq) {
      toast.error("RFQ data not loaded");
      return;
    }
    if (!rfqDate) {
      toast.error("RFQ Date is required");
      return;
    }
    if (lines.length === 0) {
      toast.error("Add at least one product");
      return;
    }
    for (const l of lines) {
      if (l.quantity <= 0) {
        toast.error(`Quantity must be > 0 for ${l.product_name}`);
        return;
      }
      if (l.unit_price <= 0) {
        toast.error(`Unit price must be > 0 for ${l.product_name}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await dispatch(
        updateRfqThunk({
          id: rfq.id,
          payload: {
            supplier_id: supplierId || null,
            rfq_date: rfqDate,
            valid_until: validUntil || null,
            internal_notes: internalNotes || null,
            supplier_notes: supplierNotes || null,
            lines: lines.map((l) => ({
              product_id: l.product_id,
              description: l.description || null,
              quantity: l.quantity,
              uom_id: l.uom_id ?? null,
              unit_price: l.unit_price,
              tax_rate_id: l.tax_rate_id ?? null,
              line_total: l.line_total,
              line_tax: l.line_tax,
              line_total_after_tax: l.line_total_after_tax,
              lead_time_days: l.lead_time_days ?? null,
            })),
          },
        } as any),
      ).unwrap();
      toast.success("RFQ updated");
      navigate(`/purchase/rfqs/${rfq.id}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update RFQ");
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <FileText className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">RFQ not found</p>
        <button
          onClick={() => navigate("/purchase/rfqs")}
          className="text-sm text-orange-600 hover:underline"
        >
          Back to RFQ list
        </button>
      </div>
    );
  }

  // Check if RFQ can be edited
  if (!["draft", "received"].includes(rfq.status)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-500">
        <ArrowLeft className="w-10 h-10 text-gray-300" />
        <p className="text-sm font-medium">
          Only draft or received RFQs can be edited
        </p>
        <button
          onClick={() => navigate(`/purchase/rfqs/${rfq.id}`)}
          className="text-sm text-orange-600 hover:underline"
        >
          Back to RFQ
        </button>
      </div>
    );
  }

  // Safe to render form now that rfq is loaded and valid
  return (
    <StandardFormLayout
      title={`Edit RFQ: ${rfq.rfq_no}`}
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: () => navigate(`/purchase/rfqs/${rfq.id}`),
        },
        {
          label: "Save Changes",
          variant: "primary",
          onClick: handleSubmit,
          isLoading: submitting,
        },
      ]}
    >
      {/* ── Header Info ── */}
      <FormSection
        title="RFQ Information"
        icon={<FileText className="w-4 h-4" />}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supplier */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Supplier
            </label>
            <select
              value={supplierId}
              onChange={(e) =>
                setSupplierId(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">— Select Supplier —</option>
              {partners.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* RFQ Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              RFQ Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={rfqDate}
              onChange={(e) => setRfqDate(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Valid Until */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Valid Until
            </label>
            <input
              type="date"
              value={validUntil}
              min={rfqDate}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Branch (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Branch
            </label>
            <div className="h-9 px-3 flex items-center text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600">
              {user?.branch?.name ?? "—"}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Internal Notes
            </label>
            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Notes visible only internally..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Supplier Notes
            </label>
            <textarea
              rows={3}
              value={supplierNotes}
              onChange={(e) => setSupplierNotes(e.target.value)}
              placeholder="Notes to send to supplier..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </FormSection>

      {/* ── Products ── */}
      <FormSection
        title="Products"
        icon={<Package className="w-4 h-4" />}
        noPadding
        action={
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 px-5 py-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() =>
                    searchResults.length > 0 && setShowDropdown(true)
                  }
                  className="w-full h-8 pl-8 pr-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 h-8 px-3 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-5 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                    No products found
                  </div>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-500">SKU: {p.sku}</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/80">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                Product
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                UOM
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Unit Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Tax %
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Line Tax
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Total
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                Lead (days)
              </th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lines.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  Search and add products above
                </td>
              </tr>
            ) : (
              lines.map((line, i) => (
                <tr key={line.tempId} className="hover:bg-gray-50/60">
                  <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {line.product_name}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "quantity",
                          Math.max(1, Number(e.target.value)),
                        )
                      }
                      className="w-20 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ml-auto block"
                    />
                  </td>
                  {/* UOM selector */}
                  <td className="px-4 py-2">
                    {(() => {
                      const validUoms = getValidUomsForProduct(
                        uoms,
                        conversions,
                        line.stock_uom_id,
                        line.product_id,
                      );
                      const qtyPreview = previewQtyInStockUom(
                        line.quantity,
                        line.uom_id,
                        line.stock_uom_id,
                        conversions,
                        line.product_id,
                      );
                      const stockUomName =
                        uoms.find((u: Uom) => u.id === line.stock_uom_id)
                          ?.name ?? "";
                      return (
                        <div className="flex flex-col gap-0.5">
                          <select
                            value={line.uom_id ?? ""}
                            onChange={(e) =>
                              updateLine(
                                line.tempId,
                                "uom_id",
                                e.target.value ? Number(e.target.value) : null,
                              )
                            }
                            className="h-7 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 w-28"
                          >
                            <option value="">— UOM —</option>
                            {validUoms.map((u: Uom) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                          {line.uom_id &&
                            line.stock_uom_id &&
                            line.uom_id !== line.stock_uom_id && (
                              <span className="text-xs text-gray-400">
                                ≈ {qtyPreview.toFixed(2)} {stockUomName}
                              </span>
                            )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={line.unit_price}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "unit_price",
                          Number(e.target.value),
                        )
                      }
                      className="w-28 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ml-auto block"
                    />
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {line.tax_rate}%
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {line.line_tax.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-gray-900">
                    {line.line_total_after_tax.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={line.lead_time_days ?? ""}
                      onChange={(e) =>
                        updateLine(
                          line.tempId,
                          "lead_time_days",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      className="w-16 h-7 px-2 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 ml-auto block"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => removeLine(line.tempId)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {lines.length > 0 && (
            <tfoot className="border-t border-gray-200 bg-gray-50/50">
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500"
                >
                  Subtotal
                </td>
                <td className="px-4 py-2 text-right text-sm font-semibold text-gray-800">
                  {totalBeforeTax.toLocaleString("vi-VN")}
                </td>
                <td colSpan={2} />
              </tr>
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-2 text-right text-xs font-medium text-gray-500"
                >
                  Tax
                </td>
                <td className="px-4 py-2 text-right text-sm text-gray-700">
                  {totalTax.toLocaleString("vi-VN")}
                </td>
                <td colSpan={2} />
              </tr>
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-2 text-right text-sm font-bold text-gray-800"
                >
                  Total
                </td>
                <td className="px-4 py-2 text-right text-base font-bold text-orange-600">
                  {totalAfterTax.toLocaleString("vi-VN")}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </FormSection>
    </StandardFormLayout>
  );
}
