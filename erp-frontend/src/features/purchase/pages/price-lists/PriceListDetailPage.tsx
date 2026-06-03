import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { ArrowLeft, Save, Plus, Trash2, Edit3, Check, X, FileSpreadsheet, Package, Search, Calendar, User, ToggleLeft, ToggleRight } from "lucide-react";
import { RootState, AppDispatch } from "../../../../store/store";
import { purchasePriceListApi, PurchasePriceList, PurchasePriceListItem } from "../../api/purchasePriceList.api";
import { searchProductsThunk } from "../../../products/store/product.thunks";
import { fetchAllUomsThunk } from "../../../master-data/store/master-data/uom/uom.thunks";
import { Product } from "../../../products/store/product.types";
import { Uom } from "@/features/master-data/dto/uom.dto";
import { formatVND } from "@/utils/currency.helper";
import { Button } from "../../../../components/ui/Button";
import { Input } from "../../../../components/ui/input";

export default function PriceListDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [priceList, setPriceList] = useState<PurchasePriceList | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  
  // Header edit state
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Items state
  const [items, setItems] = useState<PurchasePriceListItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemData, setEditingItemData] = useState<Partial<PurchasePriceListItem>>({});

  // Product search state
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const uoms = useSelector((s: RootState) => (s as any).uom?.Uoms ?? []);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await purchasePriceListApi.getById(Number(id));
      setPriceList(data);
      setName(data.name);
      setStartDate(data.start_date ? data.start_date.split("T")[0] : "");
      setEndDate(data.end_date ? data.end_date.split("T")[0] : "");
      setNotes(data.notes ?? "");
      setIsActive(data.is_active);
      setItems(data.items ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load price list details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    dispatch(fetchAllUomsThunk());
  }, [id, dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const keyword = searchTerm.trim();
      if (!keyword || keyword.length < 2) {
        setProducts([]);
        setShowDropdown(false);
        return;
      }
      setSearchLoading(true);
      dispatch(searchProductsThunk(keyword))
        .unwrap()
        .then((data) => {
          setProducts(data || []);
          setShowDropdown(true);
        })
        .catch(() => setProducts([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, dispatch]);

  // Header update
  const handleUpdateHeader = async () => {
    if (!name.trim()) return toast.error("Price list name is required");
    try {
      await purchasePriceListApi.update(Number(id), {
        name: name.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes.trim() || null,
        is_active: isActive,
      });
      toast.success("Price list details updated successfully");
      setIsEditingHeader(false);
      loadData();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to update price list details");
    }
  };

  const handleToggleActive = async () => {
    const nextState = !isActive;
    setIsActive(nextState);
    try {
      await purchasePriceListApi.update(Number(id), { is_active: nextState });
      toast.success(nextState ? "Price list activated" : "Price list deactivated");
    } catch (e: any) {
      setIsActive(!nextState);
      toast.error(e?.message ?? "Failed to update status");
    }
  };

  // Add Product Item
  const handleAddProduct = async (product: Product) => {
    if (items.some((item) => item.product_id === product.id)) {
      toast.warning("This product already exists in the price list");
      return;
    }

    try {
      await purchasePriceListApi.addItems(Number(id), [
        {
          product_id: Number(product.id),
          unit_price: Number(product.cost_price ?? 0),
          min_quantity: 1,
          discount_percent: 0,
          uom_id: product.purchase_uom_id ?? product.uom_id ?? null,
        },
      ]);
      toast.success(`Added ${product.name} to price list`);
      setSearchTerm("");
      setShowDropdown(false);
      loadData();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add product");
    }
  };

  // Edit price item
  const startEditItem = (item: PurchasePriceListItem) => {
    setEditingItemId(item.id);
    setEditingItemData({
      min_quantity: item.min_quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      lead_time_days: item.lead_time_days,
      uom_id: item.uom_id,
    });
  };

  const handleSaveItem = async (itemId: number) => {
    try {
      await purchasePriceListApi.updateItem(Number(id), itemId, editingItemData);
      toast.success("Price item updated successfully");
      setEditingItemId(null);
      loadData();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save changes");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm("Are you sure you want to remove this product from the price list?")) return;
    try {
      await purchasePriceListApi.removeItem(Number(id), itemId);
      toast.success("Product removed from price list");
      loadData();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to remove product");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6">
      {/* Sticky Header */}
      <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/purchase/price-lists")}
            className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-900 shadow-sm transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{priceList?.name}</h1>
              <span className="font-mono text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {priceList?.code || `PL-${priceList?.id}`}
              </span>
            </div>
            <p className="text-xs text-gray-400">View and configure purchase price policies</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleActive}
            className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-semibold border transition shadow-sm ${
              isActive 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            }`}
          >
            {isActive ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
            {isActive ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* Left Column: Info Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden space-y-4">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">General Info</span>
            <button
              onClick={() => setIsEditingHeader(!isEditingHeader)}
              className="text-xs text-orange-500 hover:text-orange-600 font-semibold flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {isEditingHeader ? "Cancel" : "Edit"}
            </button>
          </div>
          
          <div className="p-5 space-y-4">
            {isEditingHeader ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Price List Name</label>
                  <Input value={name} onChange={setName} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Start Date</label>
                  <Input type="date" value={startDate} onChange={setStartDate} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">End Date</label>
                  <Input type="date" value={endDate} onChange={setEndDate} className="h-9 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <Button onClick={handleUpdateHeader} className="w-full h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold">
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5 text-sm">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Supplier</span>
                    <span className="font-semibold text-gray-800">
                      {priceList?.supplier?.name ?? "Generic (All Suppliers)"}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Validity Period</span>
                    <span className="text-gray-600 text-xs">
                      {startDate ? new Date(startDate).toLocaleDateString("en-US") : "—"} to {endDate ? new Date(endDate).toLocaleDateString("en-US") : "Indefinite"}
                    </span>
                  </div>
                </div>
                {notes && (
                  <div className="pt-3 border-t border-dashed border-gray-200">
                    <span className="block text-[10px] text-gray-400 font-bold uppercase mb-1">Notes / Terms</span>
                    <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100">{notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pricing Items */}
        <div className="space-y-5 min-w-0">
          {/* Product Search Box */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-visible p-5 flex items-center gap-3">
            <div className="relative flex-1" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type product name or SKU to quickly add to price list..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400 transition"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                )}
              </div>
              
              {showDropdown && products.length > 0 && (
                <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition border-b border-gray-50 last:border-0 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-4 h-4 text-gray-400 m-auto mt-2" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-400 font-mono">SKU: {product.sku || "N/A"}</p>
                      </div>
                      <Plus className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pricing Table */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
              <h3 className="text-sm font-semibold text-gray-700">Product Pricing & Price Breaks</h3>
            </div>

            {items.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-2 text-gray-400">
                <Package className="w-12 h-12 text-gray-300" />
                <p className="text-sm font-medium">No products in this price list yet</p>
                <p className="text-xs">Use the search bar above to add your first product</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 w-[35%]">Product</th>
                      <th className="px-5 py-3 text-center">UOM</th>
                      <th className="px-5 py-3 text-center">Min Qty</th>
                      <th className="px-5 py-3 text-right">Unit Price</th>
                      <th className="px-5 py-3 text-center">Discount</th>
                      <th className="px-5 py-3 text-center">Lead Time (Days)</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => {
                      const isEditing = editingItemId === item.id;
                      const selectedUom = uoms.find((u: Uom) => u.id === (isEditing ? editingItemData.uom_id : item.uom_id));
                      
                      return (
                        <tr key={item.id} className="hover:bg-orange-50/10 transition-colors">
                          {/* Product Info */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                {item.product?.image_url ? (
                                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400 m-auto mt-2.5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{item.product?.name}</p>
                                <p className="text-xs text-gray-400 font-mono">ID: {item.product_id}</p>
                              </div>
                            </div>
                          </td>

                          {/* Unit of measure */}
                          <td className="px-5 py-4 text-center text-xs text-gray-600">
                            {selectedUom?.name ?? "—"}
                          </td>

                          {/* Minimum quantity */}
                          <td className="px-5 py-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-orange-400/20 focus:border-orange-400"
                                value={editingItemData.min_quantity ?? 1}
                                onChange={(e) => setEditingItemData(prev => ({ ...prev, min_quantity: Number(e.target.value) }))}
                              />
                            ) : (
                              <span className="font-semibold text-gray-800">{Number(item.min_quantity)}</span>
                            )}
                          </td>

                          {/* Unit Price */}
                          <td className="px-5 py-4 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                className="w-32 text-right border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-orange-400/20 focus:border-orange-400 font-mono"
                                value={editingItemData.unit_price ?? 0}
                                onChange={(e) => setEditingItemData(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                              />
                            ) : (
                              <span className="font-bold text-gray-900 tabular-nums">{formatVND(item.unit_price)}</span>
                            )}
                          </td>

                          {/* Discount % */}
                          <td className="px-5 py-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-orange-400/20 focus:border-orange-400 font-mono"
                                value={editingItemData.discount_percent ?? 0}
                                onChange={(e) => setEditingItemData(prev => ({ ...prev, discount_percent: Number(e.target.value) }))}
                              />
                            ) : (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 font-semibold">
                                {item.discount_percent}%
                              </span>
                            )}
                          </td>

                          {/* Lead Time Days */}
                          <td className="px-5 py-4 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min={0}
                                className="w-20 text-center border border-gray-300 rounded-lg px-2 py-1 text-xs focus:ring-orange-400/20 focus:border-orange-400"
                                value={editingItemData.lead_time_days ?? ""}
                                onChange={(e) => setEditingItemData(prev => ({ ...prev, lead_time_days: e.target.value ? Number(e.target.value) : null }))}
                                placeholder="Days"
                              />
                            ) : (
                              <span className="text-gray-600 text-xs">{item.lead_time_days ? `${item.lead_time_days} days` : "—"}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveItem(item.id)}
                                    className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition"
                                    title="Save"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingItemId(null)}
                                    className="p-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200 transition"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEditItem(item)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
