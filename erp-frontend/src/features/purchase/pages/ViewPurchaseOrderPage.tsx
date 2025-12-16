import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../store/store";
import { useParams, useNavigate } from "react-router-dom";
import { fetchProductByIdThunk } from "../../products/store/product.thunks";
import { fetchTaxRatesByIdThunk } from "../../master-data/store/master-data/tax/tax.thunks";
import { fetchAllBranchesThunk } from "../../../features/company/store/branch.thunks";
import {
  approvePurchaseOrderThunk,
  cancelPurchaseOrderThunk,
  fetchPurchaseOrderByIdThunk,
  submitPurchaseOrderThunk,
} from "../store/purchaseOrder.thunks";
import { PurchaseOrderLine } from "../store";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/utils/ErrorHelper";
import { loadPartnerDetail } from "@/features/partner/store/partner.thunks";
import { Partner } from "@/features/partner/store";
import { Roles } from "@/types/enum";

interface LineItem {
  id?: number;
  temp_id?: number;
  product_id: string | number;
  product_name: string;
  product_image: string;
  sale_price?: number;
  sku?: string;
  quantity: number;
  tax_rate_id?: number;
  tax_type: string;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
}

export default function ViewPurchaseOrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const purchaseOrder = useSelector(
    (state: RootState) => state.purchaseOrder.selectedPO
  );

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [, setSupplierId] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [totalOrderTax, setTotalOrderTax] = useState(0);
  const [, setBranch] = useState("");
  const [branches, setBranches] = useState<{ id: number; name: string }[]>([]);
  const [totalBeforeTax, setTotalBeforeTax] = useState(0);
  const [totalAfterTax, setTotalAfterTax] = useState(0);
  const [description, setDescription] = useState("");
  const [supplierInfo, setSupplierInfo] = useState<Partner | null>(null);

  const [lines, setLines] = useState<LineItem[]>([]);

  useEffect(() => {
    dispatch(fetchAllBranchesThunk())
      .unwrap()
      .then((data) => setBranches(data || []))
      .catch(() => setBranches([]));
  }, [dispatch]);

  useEffect(() => {
    if (id) dispatch(fetchPurchaseOrderByIdThunk(Number(id)));
  }, [dispatch, id]);

  const finalPO = purchaseOrder;
  useEffect(() => {
    if (finalPO?.branch_id && branches.length > 0) {
      setBranch(finalPO.branch_id.toString());
    }
  }, [finalPO, branches]);

  const selectedBranchName =
    branches.find((b) => b.id === finalPO?.branch_id)?.name || "";

  useEffect(() => {
    const linesToLoad = finalPO?.lines ?? [];
    if (linesToLoad.length === 0) return;
    const loadLines = async () => {
      setSupplierId(finalPO?.supplier_id?.toString() || "");

      if (finalPO?.supplier_id) {
        try {
          const supplier = await dispatch(
            loadPartnerDetail(finalPO.supplier_id)
          ).unwrap();
          setSupplierInfo(supplier);
        } catch (err) {
          console.log(err);
          setSupplierInfo(null);
        }
      }
      if (finalPO?.order_date) {
        const d = new Date(finalPO.order_date);
        setDate(d.toISOString().split("T")[0]);
      }
      setReference(finalPO?.po_no || "");
      setDescription(finalPO?.description || "");
      const enrichedLines = await Promise.all(
        linesToLoad.map(async (l: PurchaseOrderLine) => {
          const product = await dispatch(
            fetchProductByIdThunk(Number(l.product_id))
          ).unwrap();

          const tax = await dispatch(
            fetchTaxRatesByIdThunk(product.tax_rate_id || 0)
          ).unwrap();
          const taxAmount =
            (Number(l.unit_price || 0) *
              Number(l.quantity || 0) *
              (tax?.rate || 0)) /
            100;

          return {
            id: l.id ?? undefined,
            temp_id: l.id ?? Date.now(),
            product_id: l.product_id,
            product_name: product.name,
            sku: product.sku,
            product_image: product.image_url ?? "",
            sale_price: Number(l.unit_price || 0),
            quantity: Number(l.quantity || 0),
            tax_rate: tax?.rate || 0,
            tax_rate_id: product.tax_rate_id,
            tax_type: tax?.type || "VAT",
            tax_amount: taxAmount,
            line_total: Number(l.line_total || 0),
          };
        })
      );

      setLines(enrichedLines);

      // tính totals
      const before = enrichedLines.reduce(
        (s, l) => s + (l.sale_price || 0) * l.quantity,
        0
      );
      const tax = enrichedLines.reduce((s, l) => s + l.tax_amount, 0);
      // const after = enrichedLines.reduce((s, l) => s + l.line_total, 0);

      const after = finalPO?.total_after_tax ?? 0;
      setTotalBeforeTax(before);
      setTotalOrderTax(tax);
      setTotalAfterTax(after);
    };

    loadLines();
  }, [finalPO, dispatch]);

  const handleSubmitApproval = async () => {
    if (!finalPO) return;

    setSubmitting(true);
    try {
      console.log(">>> Submitting PO id:", finalPO.id);
      console.log(">>> PO status:", finalPO.status);

      const result = await dispatch(
        submitPurchaseOrderThunk(finalPO.id)
      ).unwrap();

      console.log(">>> Submit result:", result);

      toast.success("Purchase order submitted for approval!");

      const refreshedPO = await dispatch(
        fetchPurchaseOrderByIdThunk(finalPO.id)
      ).unwrap();
      console.log(">>> Refreshed PO:", refreshedPO);
      setConfirmSubmit(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!finalPO) return;
    try {
      setSubmitting(true);
      await dispatch(approvePurchaseOrderThunk(finalPO.id)).unwrap();
      toast.success("Purchase Order approved!");
      setConfirmApprove(false);
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!finalPO) return;
    if (!rejectReason.trim()) {
      toast.error("Reject reason is required");
      return;
    }
    try {
      setSubmitting(true);
      await dispatch(
        cancelPurchaseOrderThunk({ id: finalPO.id, reason: rejectReason })
      ).unwrap();
      toast.success("Purchase Order cancelled!");
      setConfirmReject(false);
      setRejectReason("");
    } catch (error) {
      console.log(">>> Error caught:", error);
      console.log(">>>> ERROR TYPE:", typeof error);
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">
          Purchase Order Details
        </h1>

        {finalPO &&
          currentUser &&
          currentUser.id === finalPO.creator.id &&
          finalPO.status === "draft" &&
          finalPO.branch_id === currentUser.branch.id && (
            <div className="flex gap-3">
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-6"
                onClick={() => navigate(`/purchase-orders/edit/${id}`)}
              >
                Edit Purchase Order
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700 px-6"
                onClick={() => setConfirmSubmit(true)}
              >
                Submit for Approval
              </Button>
            </div>
          )}

        {currentUser?.role.code === Roles.PURCHASEMANAGER &&
          finalPO?.status === "waiting_approval" &&
          finalPO?.branch_id === currentUser?.branch.id && (
            <div className="flex gap-3 mt-4">
              {/* APPROVE BUTTON */}
              <button
                onClick={() => setConfirmApprove(true)}
                className="flex items-center gap-2 px-5 py-2.5 
               bg-emerald-600 text-white font-medium 
               rounded-xl shadow-sm
               hover:bg-emerald-700 hover:shadow-md 
               active:scale-[0.97] transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Approve
              </button>

              {/* CANCEL BUTTON */}
              <button
                onClick={() => setConfirmReject(true)}
                className="flex items-center gap-2 px-5 py-2.5 
               bg-red-600 text-white font-medium 
               rounded-xl shadow-sm
               hover:bg-red-700 hover:shadow-md 
               active:scale-[0.97] transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel
              </button>
            </div>
          )}
      </div>

      {/* MAIN TOP CARD */}
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3">
          General Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* STATUS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>

            <span
              className={`
      inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold
      border shadow-sm
      ${
        finalPO?.status === "draft"
          ? "bg-gray-50 text-gray-700 border-gray-300"
          : ""
      }
      ${
        finalPO?.status === "waiting_approval"
          ? "bg-amber-50 text-amber-700 border-amber-300"
          : ""
      }
      ${
        finalPO?.status === "confirmed"
          ? "bg-blue-50 text-blue-700 border-blue-300"
          : ""
      }
      ${
        finalPO?.status === "partially_received"
          ? "bg-purple-50 text-purple-700 border-purple-300"
          : ""
      }
      ${
        finalPO?.status === "completed"
          ? "bg-emerald-50 text-emerald-700 border-emerald-300"
          : ""
      }
      ${
        finalPO?.status === "cancelled"
          ? "bg-red-50 text-red-700 border-red-300"
          : ""
      }
    `}
            >
              ● {finalPO?.status?.replace("_", " ") || "N/A"}
            </span>
          </div>
          {/* CREATED BY */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Created By
            </label>
            <Input
              className="mt-1"
              value={finalPO?.creator.full_name || ""}
              disabled
            />
          </div>

          {/* DATE */}
          <div>
            <label className="text-sm font-medium text-gray-600">Date</label>
            <Input className="mt-1" value={date} disabled />
          </div>

          {/* BRANCH */}
          <div>
            <label className="text-sm font-medium text-gray-600">Branch</label>
            <Input className="mt-1" value={selectedBranchName} disabled />
          </div>
        </div>

        <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg mt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              Approval Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creator Card */}
            <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={finalPO?.creator?.avatar_url}
                    alt={finalPO?.creator?.full_name}
                    className="w-20 h-20 rounded-xl object-cover border-4 border-blue-100 shadow-md"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-3 border-white shadow-md">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    Created By
                  </p>
                  <h4 className="text-lg font-bold text-gray-800 mb-2 truncate">
                    {finalPO?.creator?.full_name || "N/A"}
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <svg
                        className="w-4 h-4 text-blue-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm truncate">
                        {finalPO?.creator?.email || "N/A"}
                      </span>
                    </div>

                    {finalPO?.creator?.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg
                          className="w-4 h-4 text-blue-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="text-sm">{finalPO.creator.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Approver Card */}
            <div
              className={`p-6 rounded-xl shadow-md border-2 transition-all duration-300 ${
                finalPO?.approver
                  ? "bg-white border-green-100 hover:shadow-xl hover:scale-[1.02]"
                  : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
              }`}
            >
              {finalPO?.approver ? (
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={finalPO.approver.avatar_url}
                      alt={finalPO.approver.full_name}
                      className="w-20 h-20 rounded-xl object-cover border-4 border-green-100 shadow-md"
                    />
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-3 border-white shadow-md">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">
                      Approved By
                    </p>
                    <h4 className="text-lg font-bold text-gray-800 mb-2 truncate">
                      {finalPO.approver.full_name}
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg
                          className="w-4 h-4 text-green-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-sm truncate">
                          {finalPO.approver.email}
                        </span>
                      </div>

                      {finalPO.approver.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <svg
                            className="w-4 h-4 text-green-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-sm">
                            {finalPO.approver.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Aprroved By
                  </p>
                  <p className="text-base font-semibold text-gray-500">
                    No one has approved it yet
                  </p>
                  <p className="text-sm text-gray-400 mt-1 text-center">
                    Waiting for assignment
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Reject Reason Section */}
          {finalPO?.reject_reason && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-red-50 to-rose-50 p-5 rounded-xl border-2 border-red-200 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-red-700 mb-2 uppercase tracking-wide">
                      Lý Do Từ Chối
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {finalPO.reject_reason}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Supplier Information
          </h3>

          {supplierInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {/* Name */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Name</p>
                <p className="font-medium">{supplierInfo.name}</p>
              </div>

              {/* Contact Person */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Contact Person</p>
                <p className="font-medium">{supplierInfo.contact_person}</p>
              </div>

              {/* Phone */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Phone</p>
                <p className="font-medium">{supplierInfo.phone}</p>
              </div>

              {/* Email */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Email</p>
                <p className="font-medium">{supplierInfo.email}</p>
              </div>

              {/* Address (full width) */}
              <div className="col-span-1 md:col-span-3">
                <p className="text-gray-500 text-xs mb-1">Address</p>
                <p className="font-medium whitespace-pre-line">
                  {supplierInfo.address}
                </p>
              </div>

              {/* Province */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Province</p>
                <p className="font-medium">{supplierInfo.province}</p>
              </div>

              {/* District */}
              <div>
                <p className="text-gray-500 text-xs mb-1">District</p>
                <p className="font-medium">{supplierInfo.district}</p>
              </div>

              {/* Ward */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Ward</p>
                <p className="font-medium">{supplierInfo.ward}</p>
              </div>

              {/* Bank Name */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Bank Name</p>
                <p className="font-medium">{supplierInfo.bank_name}</p>
              </div>

              {/* Bank Account */}
              <div>
                <p className="text-gray-500 text-xs mb-1">Bank Account</p>
                <p className="font-medium">{supplierInfo.bank_account}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Loading supplier info...</p>
          )}
        </div>

        {/* TIMELINE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="p-4 bg-gray-50 border rounded">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Created At: </span>
              {finalPO?.created_at
                ? new Date(finalPO.created_at).toLocaleString()
                : "N/A"}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              <span className="font-medium">Updated At: </span>
              {finalPO?.updated_at
                ? new Date(finalPO.updated_at).toLocaleString()
                : "N/A"}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">
              Reference
            </label>
            <Input className="mt-1" value={reference} disabled />
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-3 mb-4">
          Purchase Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-3 text-left w-10"></th>
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-center font-medium">Image</th>
                <th className="px-4 py-3 text-center font-medium">Price</th>
                <th className="px-4 py-3 text-center font-medium">Quantity</th>
                <th className="px-4 py-3 text-center font-medium">Tax Type</th>
                <th className="px-4 py-3 text-center font-medium">
                  Tax Rate(%)
                </th>
                <th className="px-4 py-3 text-right font-medium">Tax Amount</th>
                <th className="px-4 py-3 text-right font-medium">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-500">
                    Chưa có sản phẩm. Hãy tìm kiếm và thêm ở trên
                  </td>
                </tr>
              ) : (
                lines.map((line) => (
                  <tr key={line.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        className="text-red-500 hover:text-red-700"
                        disabled
                      ></button>
                    </td>

                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{line.product_name}</div>
                        {line.sku && (
                          <div className="text-xs text-gray-500">
                            SKU: {line.sku}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <img
                        src={line.product_image || "/placeholder.png"}
                        alt={line.product_name}
                        className="h-12 w-12 object-cover rounded-md mx-auto border"
                      />
                    </td>
                    <td className="px-4 py-3 text-center capitalize">
                      {line.sale_price?.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Input
                        type="number"
                        className="w-20 mx-auto"
                        value={line.quantity.toString()}
                        disabled
                      />
                    </td>

                    <td className="px-4 py-3 text-center capitalize">
                      {line.tax_type}
                    </td>

                    <td className="px-4 py-3 text-center">{line.tax_rate}%</td>

                    <td className="px-4 py-3 text-right font-medium">
                      {line.tax_amount.toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-orange-600">
                      {line.line_total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOTALS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="text-sm font-medium text-gray-600">
            Total Before Tax
          </label>
          <Input className="mt-1" value={`${totalBeforeTax}`} disabled />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Order Tax Total
          </label>
          <Input className="mt-1" value={`${totalOrderTax}`} disabled />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-600">
            Total After Tax
          </label>
          <Input className="mt-1" value={`${totalAfterTax}`} disabled />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          Description
        </h2>
        <Textarea value={description} disabled rows={5} />
      </div>

      {/* FOOTER BUTTON */}
      <div className="flex justify-end">
        <Button
          className="bg-orange-500 hover:bg-orange-600 px-8"
          onClick={() => navigate("/purchase/orders")}
        >
          Back to List
        </Button>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Submit for Approval?</h2>
            <p className="text-gray-600 mb-6">
              After submitting for approval, you will no longer be able to edit
              this purchase order.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmitApproval}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Yes, Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Approve Purchase Order?</h2>

            <p className="text-gray-600 mb-6">
              Once approved, this purchase order will be confirmed.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmApprove(false)}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={submitting}
              >
                {submitting ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmReject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          {" "}
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm">
            {" "}
            <h2 className="text-lg font-bold mb-4">
              Cancel Purchase Order
            </h2>{" "}
            <p className="text-gray-600 mb-4">
              Please provide a reason for cancellation.
            </p>{" "}
            <Textarea
              placeholder="Enter reject reason..."
              value={rejectReason}
              onChange={(value) => setRejectReason(value)}
              rows={4}
              className="mb-6"
            />{" "}
            <div className="flex justify-end gap-3">
              {" "}
              <Button
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmReject(false)}
                disabled={submitting}
              >
                {" "}
                Close{" "}
              </Button>{" "}
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={submitting}
              >
                {" "}
                {submitting ? "Cancelling..." : "Cancel Order"}{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );
}
