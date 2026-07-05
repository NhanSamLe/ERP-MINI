import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../../../../components/ui/Select";
import { Button } from "../../../../../components/ui/Button";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { useState, useEffect } from "react";
import {
  fetchPurchaseOrderByStatus,
  PurchaseOrder,
} from "../../../../purchase/store";
import { fetchReturnsThunk } from "../../../../purchase/store/purchaseReturn";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../../store/store";
import { toast } from "react-toastify";
import { fetchProductByIdThunk } from "@/features/products/store/product.thunks";
import { LocationSelect } from "../../LocationSelect";
import { UomSelect, buildUomOptions, translateUomName } from "../../UomSelect";
import { LotSelect, NewLotData } from "../../LotSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../../../../../components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "../../../../../components/ui/Card";
import { Package, Trash2, Calendar, Clipboard, ShoppingCart, ListCollapse } from "lucide-react";

export interface ProductItem {
  id: number;
  name: string;
  image: string;
  sku: string;
  uom: string;
  uom_id?: number | null;
  uomOptions?: Array<{ id: number; code: string; name: string }>;
  quantity: number;
  location_to_id?: number | null;
  lot_id?: number | null;
  new_lot?: NewLotData | null;
  default_supplier_id?: number | null;
}

export interface CreateReceiptForm {
  warehouse: string;
  referenceNo: string;
  move_no: string;
  notes: string;
  move_date: string;
  type: string;
  reference_type: string;
}

interface CreateReceiptModalProps {
  open: boolean;
  warehouses: Array<{ id: number; name: string }>;
  onSubmit: (data: {
    form: CreateReceiptForm;
    products: ProductItem[];
  }) => void;
  onClose: () => void;
}

export default function CreateReceiptModal({
  open,
  warehouses,
  onSubmit,
  onClose,
}: CreateReceiptModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const purchaseOrder = useSelector((state: RootState) => state.purchaseOrder);
  const purchaseReturn = useSelector((state: RootState) => state.purchaseReturn);

  const generateMoveNo = (): string => {
    const timestamp = Date.now();
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `RC${timestamp}${randomNum}`;
  };

  const [form, setForm] = useState<CreateReceiptForm>({
    warehouse: "",
    referenceNo: "",
    move_no: generateMoveNo(),
    notes: "",
    move_date: "",
    type: "receipt",
    reference_type: "purchase_order",
  });

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedPOId, setSelectedPOId] = useState<string>("");

  useEffect(() => {
    if (form.reference_type === "purchase_order") {
      dispatch(fetchPurchaseOrderByStatus("confirmed,sent,supplier_accepted,partially_received"));
    } else if (form.reference_type === "purchase_return") {
      dispatch(fetchReturnsThunk({ status: "confirmed,completed", return_type: "replacement" }));
    }
  }, [dispatch, form.reference_type]);

  useEffect(() => {
    if (!open) return;
    setForm({
      warehouse: "",
      referenceNo: "",
      notes: "",
      move_no: generateMoveNo(),
      move_date: "",
      type: "receipt",
      reference_type: "purchase_order",
    });
    setProducts([]);
    setSelectedPOId("");
  }, [open]);

  useEffect(() => {
    if (selectedPOId) {
      setForm((prev) => ({ ...prev, referenceNo: selectedPOId }));
    }
  }, [selectedPOId]);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedPOId) {
        setProducts([]);
        return;
      }

      if (form.reference_type === "purchase_order") {
        const po = purchaseOrder.items.find(
          (x: PurchaseOrder) => x.id.toString() === selectedPOId,
        );

        if (!po || !po.lines) {
          setProducts([]);
          return;
        }

        try {
          const fetchedProducts = await Promise.all(
            po.lines.map(async (line) => {
              const result = await dispatch(
                fetchProductByIdThunk(line.product_id),
              ).unwrap();

              return {
                id: result.id,
                name: result.name,
                sku: result.sku,
                uom: translateUomName(result.uom?.name ?? result.uom?.code ?? ""),
                uom_id: result.uom_id ?? null,
                uomOptions: buildUomOptions(result),
                image: result.image_url,
                quantity: Number(line.qty_in_stock_uom ?? line.quantity ?? 0),
                default_supplier_id: po.supplier_id ?? null,
              } as ProductItem;
            }),
          );

          setProducts(fetchedProducts);
        } catch (err) {
          console.error(err);
          toast.error("Tải chi tiết sản phẩm thất bại");
        }
      } else if (form.reference_type === "purchase_return") {
        const pr = purchaseReturn.returns.find(
          (x: any) => x.id.toString() === selectedPOId,
        );

        if (!pr || !pr.lines) {
          setProducts([]);
          return;
        }

        try {
          const fetchedProducts = await Promise.all(
            pr.lines.map(async (line) => {
              const result = await dispatch(
                fetchProductByIdThunk(line.product_id),
              ).unwrap();

              const quantity = Number(line.quantity_confirmed_stock_uom ?? line.qty_in_stock_uom ?? line.quantity_returned ?? 0);

              return {
                id: result.id,
                name: result.name,
                sku: result.sku,
                uom: translateUomName(result.uom?.name ?? result.uom?.code ?? ""),
                uom_id: result.uom_id ?? null,
                uomOptions: buildUomOptions(result),
                image: result.image_url,
                quantity: quantity,
                default_supplier_id: pr.supplier_id ?? null,
              } as ProductItem;
            }),
          );

          setProducts(fetchedProducts);
        } catch (err) {
          console.error(err);
          toast.error("Tải chi tiết sản phẩm thất bại");
        }
      }
    };

    loadProducts();
  }, [selectedPOId, purchaseOrder.items, purchaseReturn.returns, form.reference_type, dispatch]);

  const handleQuantityChange = (id: number, value: number) => {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: value } : item,
      ),
    );
  };

  const handleSubmit = () => {
    if (!selectedPOId) {
      toast.error(
        form.reference_type === "purchase_order"
          ? "Vui lòng chọn đơn mua hàng"
          : "Vui lòng chọn phiếu trả hàng"
      );
      return;
    }

    if (!form.warehouse) {
      toast.error("Vui lòng chọn Kho hàng");
      return;
    }

    if (!form.move_date) {
      toast.error("Vui lòng chọn Ngày nhập kho");
      return;
    }

    if (products.length === 0) {
      toast.error("Vui lòng thêm ít nhất một sản phẩm");
      return;
    }

    for (const p of products) {
      if (!p.id) {
        toast.error("Một số sản phẩm bị thiếu ID");
        return;
      }
      if (!p.quantity || p.quantity <= 0) {
        toast.error(`Số lượng không hợp lệ cho sản phẩm: ${p.name}`);
        return;
      }
      if (!p.location_to_id) {
        toast.error(`Vui lòng chọn vị trí cho sản phẩm: ${p.name}`);
        return;
      }
      if (p.new_lot !== undefined && p.new_lot !== null) {
        if (!p.new_lot.lot_no?.trim()) {
          toast.error(`Vui lòng nhập mã lô cho sản phẩm: ${p.name}`);
          return;
        }
        if (p.new_lot.expiry_date) {
          const today = new Date().toISOString().split("T")[0];
          if (p.new_lot.expiry_date < today) {
            toast.error(`Không thể lưu vì lô mới của sản phẩm ${p.name} đã hết hạn sử dụng (${p.new_lot.expiry_date})!`);
            return;
          }
        }
      }
    }

    onSubmit({
      form: {
        ...form,
        referenceNo: selectedPOId,
      },
      products,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-slate-100 flex flex-row items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 shadow-sm shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <DialogTitle className="text-lg font-bold text-slate-900">Tạo phiếu nhập kho</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-0.5">
              Nhập nguyên vật liệu hoặc sản phẩm từ các đơn mua hàng hoặc đổi trả hàng
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Main info fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Warehouse Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kho hàng *</label>
              <Select
                value={form.warehouse}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, warehouse: v }))
                }
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
                  <SelectValue placeholder="Chọn kho hàng" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Move Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày nhập kho *
              </label>
              <Input
                type="date"
                value={form.move_date}
                onChange={(value) => setForm({ ...form, move_date: value })}
                className="border-slate-200 focus:ring-orange-400 focus:border-orange-400 h-10"
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Reference Type Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loại tham chiếu *</label>
              <Select
                value={form.reference_type}
                onValueChange={(v) => {
                  setForm((prev) => ({ ...prev, reference_type: v }));
                  setSelectedPOId("");
                  setProducts([]);
                }}
              >
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
                  <SelectValue placeholder="Chọn loại tham chiếu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase_order">Đơn mua hàng (PO)</SelectItem>
                  <SelectItem value="purchase_return">Đổi trả hàng (PR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Document Select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                {form.reference_type === "purchase_order" ? (
                  <>
                    <ShoppingCart className="w-3.5 h-3.5 text-slate-400" /> Đơn mua hàng (PO) *
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Phiếu trả hàng (PR) *
                  </>
                )}
              </label>
              <Select value={selectedPOId} onValueChange={setSelectedPOId}>
                <SelectTrigger className="w-full h-10 bg-white border-slate-200 focus:ring-orange-500 focus:border-orange-500 rounded-lg">
                  <SelectValue placeholder={form.reference_type === "purchase_order" ? "Chọn PO" : "Chọn Phiếu trả hàng"} />
                </SelectTrigger>
                <SelectContent>
                  {form.reference_type === "purchase_order"
                    ? purchaseOrder.items?.map((po: PurchaseOrder) => (
                        <SelectItem key={po.id} value={po.id.toString()}>
                          {po.po_no}
                        </SelectItem>
                      ))
                    : purchaseReturn.returns?.map((pr: any) => (
                        <SelectItem key={pr.id} value={pr.id.toString()}>
                          {pr.return_no}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reference Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" /> Mã tham chiếu
              </label>
              <Input 
                value={form.referenceNo || "Tự động gán"} 
                disabled 
                className="h-10 border-slate-200 bg-slate-50 text-slate-500 font-mono font-semibold"
              />
            </div>

            {/* Move Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số phiếu</label>
              <Input 
                value={form.move_no} 
                disabled 
                className="h-10 border-slate-200 bg-slate-50 text-slate-500 font-mono font-semibold"
              />
            </div>
          </div>

          {/* TABLE SECTION */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white/80 backdrop-blur-md">
            <CardHeader className="px-5 py-3.5 bg-slate-50/15 border-b border-slate-100 flex flex-row items-center gap-2">
              <ListCollapse className="w-4.5 h-4.5 text-slate-700" />
              <CardTitle className="text-sm font-semibold text-slate-800">Danh sách sản phẩm nhập kho</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5 text-left">Sản phẩm</th>
                    <th className="py-3.5 px-5 text-left">Mã SKU</th>
                    <th className="py-3.5 px-5 text-left w-28">ĐVT</th>
                    <th className="py-3.5 px-5 text-right w-24">SL</th>
                    <th className="py-3.5 px-5 text-left w-40">Vị trí (Đến)</th>
                    <th className="py-3.5 px-5 text-left w-44">Số lô</th>
                    <th className="py-3.5 px-5 text-center w-14"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.length > 0 ? (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors align-middle">
                        <td className="py-3 px-5 flex items-center gap-3">
                          {p.image && (
                            <img
                              src={p.image}
                              className="w-9 h-9 rounded-lg object-cover border border-slate-100 bg-slate-50 shadow-xxs shrink-0"
                            />
                          )}
                          <span className="font-semibold text-slate-800">{p.name}</span>
                        </td>
                        <td className="py-3 px-5 font-mono text-xs font-bold text-slate-455 uppercase">{p.sku}</td>
                        <td className="py-3 px-5">
                          <UomSelect
                            value={p.uom_id}
                            onChange={(uomId) =>
                              setProducts((prev) =>
                                prev.map((x) =>
                                  x.id === p.id ? { ...x, uom_id: uomId } : x,
                                ),
                              )
                            }
                          />
                        </td>
                        <td className="py-3 px-5 text-right">
                          <input
                            type="number"
                            value={p.quantity}
                            min={1}
                            step="any"
                            className="w-20 h-9 border border-slate-200 rounded-lg px-2.5 text-right font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition"
                            onChange={(e) =>
                              handleQuantityChange(p.id, Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="py-3 px-5">
                          <LocationSelect
                            warehouseId={
                              form.warehouse ? Number(form.warehouse) : null
                            }
                            value={p.location_to_id}
                            onChange={(locId) =>
                              setProducts((prev) =>
                                prev.map((x) =>
                                  x.id === p.id
                                    ? { ...x, location_to_id: locId }
                                    : x,
                                ),
                              )
                            }
                            types={["internal", "input"]}
                            placeholder="— Chọn —"
                          />
                        </td>
                        <td className="py-3 px-5">
                          <LotSelect
                            productId={p.id}
                            value={p.lot_id}
                            onChange={(lotId) =>
                              setProducts((prev) =>
                                prev.map((x) =>
                                  x.id === p.id
                                    ? { ...x, lot_id: lotId, new_lot: null }
                                    : x,
                                ),
                              )
                            }
                            newLot={p.new_lot}
                            onNewLotChange={(data) =>
                              setProducts((prev) =>
                                prev.map((x) =>
                                  x.id === p.id
                                    ? { ...x, new_lot: data, lot_id: null }
                                    : x,
                                ),
                              )
                            }
                            defaultSupplierId={p.default_supplier_id}
                            allowCreate
                          />
                        </td>
                        <td className="py-3 px-5 text-center">
                          <button
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-rose-600 bg-white hover:bg-rose-50 hover:border-rose-100 transition-colors shadow-sm"
                            onClick={() =>
                              setProducts((prev) =>
                                prev.filter((x) => x.id !== p.id),
                              )
                            }
                            title="Xóa dòng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        Chưa chọn chứng từ tham chiếu hoặc chưa tải danh sách sản phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú nội bộ</label>
            <Textarea
              value={form.notes}
              onChange={(v) => setForm((prev) => ({ ...prev, notes: v }))}
              placeholder="Cung cấp ghi chú hoặc hướng dẫn nhận hàng đặc biệt..."
              className="min-h-[80px] border-slate-200 focus:ring-orange-400 focus:border-orange-400 rounded-lg text-sm placeholder:text-slate-400"
            />
          </div>

          {/* FOOTER */}
          <DialogFooter className="pt-4 border-t border-slate-100 flex-row justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
            >
              Tạo phiếu nhập
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
