import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { Product, ProductSupplierInfo } from "../store/product.types";
import { productApi } from "../api/product.api";
import { productSupplierInfoApi } from "../api/productSupplierInfo.api";
import {
  ArrowLeft,
  Pencil,
  Star,
  Package,
  Tag,
  Ruler,
  Truck,
  ImageOff,
} from "lucide-react";
import { formatMoney } from "@/utils/currency.helper";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  storable: "Storable",
  consumable: "Consumable",
  service: "Service",
};
const PRODUCT_TYPE_COLORS: Record<string, string> = {
  storable: "bg-blue-100 text-blue-700",
  consumable: "bg-purple-100 text-purple-700",
  service: "bg-teal-100 text-teal-700",
};
const SOURCE_TYPE_LABELS: Record<string, string> = {
  purchased: "Purchased",
  manufactured: "Manufactured",
};

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium">
        {value ?? <span className="text-gray-300">—</span>}
      </span>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-6 py-4 border-b bg-gray-50">
        <span className="text-orange-500">{icon}</span>
        <h3 className="font-semibold text-gray-700 text-sm">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(
    location.state?.product ?? null,
  );
  const [supplierInfo, setSupplierInfo] = useState<ProductSupplierInfo[]>([]);
  const [loading, setLoading] = useState(!location.state?.product);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const categories = useSelector(
    (state: RootState) => state.product.categories,
  );

  const productId = id ? Number(id) : null;

  useEffect(() => {
    if (!product && productId) {
      setLoading(true);
      productApi
        .getProductById(productId)
        .then((p) => {
          setProduct(p);
          setActiveImage(p.image_url ?? null);
        })
        .catch(() => navigate("/inventory/products"))
        .finally(() => setLoading(false));
    } else if (product) {
      setActiveImage(product.image_url ?? null);
    }
  }, [productId]);

  useEffect(() => {
    if (!productId) return;
    if (product?.supplierInfo?.length) {
      setSupplierInfo(product.supplierInfo);
    } else {
      productSupplierInfoApi
        .getByProduct(productId)
        .then(setSupplierInfo)
        .catch(() => {});
    }
  }, [product, productId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const allImages = [
    ...(product.image_url ? [{ url: product.image_url, id: 0 }] : []),
    ...(product.images?.map((img) => ({ url: img.image_url, id: img.id })) ??
      []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover border"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
              <Package className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              {product.name}
            </h1>
            <p className="text-sm text-gray-400">{product.sku}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
          >
            {product.status === "active" ? "Active" : "Inactive"}
          </span>
          {product.product_type && (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${PRODUCT_TYPE_COLORS[product.product_type]}`}
            >
              {PRODUCT_TYPE_LABELS[product.product_type]}
            </span>
          )}
          <Link
            to={`/inventory/products/edit/${product.id}`}
            state={{ product }}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={() => navigate("/inventory/products")}
            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <Section
            icon={<Tag className="w-4 h-4" />}
            title="General Information"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <InfoRow label="SKU" value={product.sku} />
              <InfoRow label="Barcode" value={product.barcode} />
              <InfoRow label="Internal Ref" value={product.internal_ref} />
              <InfoRow
                label="Category"
                value={
                  categories.find((c) => c.id === product.category_id)?.name ??
                  (product.category_id ? `#${product.category_id}` : undefined)
                }
              />
              <InfoRow
                label="Product Type"
                value={
                  product.product_type ? (
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${PRODUCT_TYPE_COLORS[product.product_type]}`}
                    >
                      {PRODUCT_TYPE_LABELS[product.product_type]}
                    </span>
                  ) : undefined
                }
              />
              <InfoRow
                label="Source Type"
                value={
                  product.source_type
                    ? SOURCE_TYPE_LABELS[product.source_type]
                    : undefined
                }
              />
              <InfoRow label="UOM" value={product.uom?.name} />
              <InfoRow label="Purchase UOM" value={product.purchaseUom?.name} />
              <InfoRow
                label="Min Stock Qty"
                value={
                  product.min_stock_qty != null
                    ? String(Number(product.min_stock_qty))
                    : undefined
                }
              />
              <InfoRow label="Origin" value={product.origin} />
              <InfoRow
                label="Warranty"
                value={
                  product.warranty_months != null
                    ? `${product.warranty_months} months`
                    : undefined
                }
              />
              <InfoRow
                label="Tax Rate"
                value={
                  product.taxRate
                    ? `${product.taxRate.name} (${product.taxRate.rate}%)`
                    : undefined
                }
              />
            </div>

            {product.description && (
              <div className="mt-5 pt-5 border-t">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </Section>

          {/* Pricing */}
          <Section icon={<span className="text-base">💰</span>} title="Pricing">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Cost Price
                </span>
                <span className="text-lg font-semibold text-gray-800">
                  {product.cost_price != null
                    ? formatMoney(product.cost_price, "VND")
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-gray-400 uppercase tracking-wide">
                  Sale Price
                </span>
                <span className="text-lg font-semibold text-orange-500">
                  {product.sale_price != null
                    ? formatMoney(product.sale_price, "VND")
                    : "—"}
                </span>
              </div>
              {product.cost_price != null &&
                product.sale_price != null &&
                product.cost_price > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-400 uppercase tracking-wide">
                      Margin
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      {(
                        ((product.sale_price - product.cost_price) /
                          product.cost_price) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                )}
            </div>
          </Section>

          {/* Attributes */}
          <Section icon={<Ruler className="w-4 h-4" />} title="Attributes">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <InfoRow
                label="Weight"
                value={
                  product.weight != null ? `${product.weight} kg` : undefined
                }
              />
              <InfoRow
                label="Volume"
                value={
                  product.volume != null ? `${product.volume} m³` : undefined
                }
              />
              <InfoRow label="Notes" value={product.notes} />
            </div>
          </Section>

          {/* Suppliers */}
          {supplierInfo.length > 0 && (
            <Section
              icon={<Truck className="w-4 h-4" />}
              title={`Suppliers (${supplierInfo.length})`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-400 uppercase border-b">
                      <th className="pb-2 font-medium">Supplier</th>
                      <th className="pb-2 font-medium">Code</th>
                      <th className="pb-2 font-medium">Price</th>
                      <th className="pb-2 font-medium">MOQ</th>
                      <th className="pb-2 font-medium">Lead Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {supplierInfo.map((s) => (
                      <tr key={s.id} className="py-2">
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            {s.is_preferred && (
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                            )}
                            <span className="font-medium text-gray-800">
                              {s.supplier?.name ?? `#${s.supplier_id}`}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 text-gray-500">
                          {s.supplier_product_code ?? "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-700">
                          {s.price != null
                            ? formatMoney(
                                Number(s.price),
                                s.currency?.code || "VND",
                              )
                            : "—"}
                        </td>
                        <td className="py-2.5 pr-4 text-gray-500">
                          {s.min_order_qty ?? "—"}
                        </td>
                        <td className="py-2.5 text-gray-500">
                          {s.lead_time_days != null
                            ? `${s.lead_time_days} days`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}
        </div>

        {/* Right column — Images */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b bg-gray-50">
              <span className="text-orange-500">🖼️</span>
              <h3 className="font-semibold text-gray-700 text-sm">Images</h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Main image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border flex items-center justify-center">
                {activeImage ? (
                  <img
                    src={activeImage}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <ImageOff className="w-10 h-10" />
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img.url)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${activeImage === img.url ? "border-orange-400" : "border-transparent hover:border-gray-300"}`}
                    >
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm">Quick Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Created</span>
                <span className="text-gray-700">
                  {new Date(product.created_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              {product.updated_at && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Updated</span>
                  <span className="text-gray-700">
                    {new Date(product.updated_at).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Suppliers</span>
                <span className="text-gray-700">{supplierInfo.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gallery</span>
                <span className="text-gray-700">
                  {product.images?.length ?? 0} images
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
