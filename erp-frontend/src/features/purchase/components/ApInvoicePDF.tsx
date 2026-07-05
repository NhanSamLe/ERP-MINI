import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { ApInvoice } from "../store/apInvoice/apInvoice.types";
import { translateUomName } from "../../inventory/components/UomSelect";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf",
      fontWeight: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAx05IsDqlA.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://fonts.gstatic.com/s/roboto/v30/KFOkCnqEu92Fr1Mu52xPKTM1K9nz.ttf",
      fontWeight: "normal",
      fontStyle: "italic",
    },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const S = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: "#1a1a1a",
    backgroundColor: "#ffffff",
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#ea580c",
    paddingBottom: 10,
    marginBottom: 14,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#ea580c",
  },
  companyBranch: { fontSize: 8, color: "#555", marginTop: 2 },
  invoiceTitleBlock: { alignItems: "flex-end" },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  invoiceNoBox: {
    marginTop: 5,
    borderWidth: 1.5,
    borderColor: "#ea580c",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  invoiceNo: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  invoiceDateText: { fontSize: 8, color: "#555", marginTop: 4 },
  partiesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  partyTitle: {
    backgroundColor: "#fff7ed",
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#ea580c",
  },
  partyBody: { paddingVertical: 7, paddingHorizontal: 8 },
  partyName: { fontSize: 9, fontWeight: "bold", marginBottom: 4 },
  partyRow: { fontSize: 8, color: "#555", marginTop: 2 },
  partyRowBold: { fontWeight: "bold", color: "#1a1a1a" },
  table: { marginBottom: 14 },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#ea580c",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  thText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 5,
    paddingHorizontal: 4,
    minHeight: 22,
  },
  tableRowEven: { backgroundColor: "#fffaf5" },
  tdText: { fontSize: 8, color: "#1a1a1a" },
  tdSub: { fontSize: 7, color: "#9ca3af", marginTop: 1 },
  tdBold: { fontWeight: "bold" },
  colNo: { width: 22 },
  colProduct: { flex: 1 },
  colUom: { width: 40, textAlign: "center" },
  colQty: { width: 40, textAlign: "center" },
  colPrice: { width: 80, textAlign: "right" },
  colTax: { width: 40, textAlign: "center" },
  colTotal: { width: 90, textAlign: "right" },
  summaryWrap: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  summaryBox: { width: 220 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  summaryLabel: { fontSize: 8, color: "#555" },
  summaryVal: { fontSize: 8, fontWeight: "bold" },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#ea580c",
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  summaryTotalLabel: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  summaryTotalVal: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  sigSection: {
    borderTopWidth: 1.5,
    borderTopColor: "#ea580c",
    paddingTop: 14,
    marginTop: 4,
  },
  sigGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  sigBox: { flex: 1, alignItems: "center" },
  sigTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  sigImage: {
    width: 110,
    height: 45,
    objectFit: "contain",
    marginVertical: 4,
  },
  sigPlaceholder: {
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    borderBottomStyle: "dashed",
    width: "70%",
    marginBottom: 5,
  },
  qrImage: {
    width: 55,
    height: 55,
    marginTop: 4,
  },
  sigName: { fontSize: 8, fontWeight: "bold", marginTop: 4 },
  sigSub: { fontSize: 6, color: "#6b7280", marginTop: 2, textAlign: "center", maxLines: 2 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    marginTop: 16,
    alignItems: "center",
  },
  footerThank: { fontSize: 8, fontStyle: "italic", color: "#555", marginBottom: 3 },
  footerSub: { fontSize: 7, color: "#9ca3af" },
});

interface Props {
  invoice: ApInvoice;
  lang?: "vi" | "en";
}

export function ApInvoicePDF({ invoice, lang = "vi" }: Props) {
  const isVi = lang === "vi";
  const currencyCode = invoice.currency?.code || "VND";
  const currencySymbol = invoice.currency?.symbol || currencyCode;

  const fmtMoney = (v: number | string | null | undefined) =>
    `${Number(v || 0).toLocaleString(isVi ? "vi-VN" : "en-US", { maximumFractionDigits: 2 })} ${currencySymbol}`;

  const supplier = invoice.order?.supplier;
  const creator = invoice.creator;

  // Lấy chữ ký từ model
  const chaccSignature = (invoice as any).signatures?.find(
    (s: any) => s.document_type === "ap_invoice"
  );

  // Sinh QR Code link xác thực công cộng
  const verifyUrl = `${window.location.origin}/public/verify-signature/${chaccSignature?.hash_value || ""}`;
  const qrCodeUrl = chaccSignature
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`
    : null;

  const ts = new Date().toLocaleString(isVi ? "vi-VN" : "en-GB");

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.headerRow}>
          <View>
            <Text style={S.companyName}>ERP-MINI ENTERPRISE</Text>
            <Text style={S.companyBranch}>Chi nhánh: {invoice.branch?.name || "Main"}</Text>
            <Text style={[S.companyBranch, { marginTop: 4, fontSize: 9, fontWeight: "bold", color: "#3b82f6" }]}>
              {isVi ? "HÓA ĐƠN ĐẦU VÀO (AP INVOICE)" : "AP INVOICE"}
            </Text>
          </View>
          <View style={S.invoiceTitleBlock}>
            <Text style={S.invoiceTitle}>{isVi ? "HÓA ĐƠN" : "INVOICE"}</Text>
            <View style={S.invoiceNoBox}>
              <Text style={S.invoiceNo}>{invoice.invoice_no}</Text>
            </View>
            <Text style={S.invoiceDateText}>
              {isVi ? "Ngày hóa đơn" : "Date"}: {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString(isVi ? "vi-VN" : "en-US") : "—"}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={S.partiesRow}>
          {/* Buyer */}
          <View style={S.partyBox}>
            <Text style={S.partyTitle}>{isVi ? "Khách hàng mua (Bill To)" : "Bill To"}</Text>
            <View style={S.partyBody}>
              <Text style={S.partyName}>ERP-MINI Co., Ltd</Text>
              <Text style={S.partyRow}>Email: <Text style={S.partyRowBold}>accounting@erp-mini.com</Text></Text>
              <Text style={S.partyRow}>Người lập: <Text style={S.partyRowBold}>{creator?.full_name || "—"}</Text></Text>
            </View>
          </View>

          {/* Supplier */}
          <View style={S.partyBox}>
            <Text style={S.partyTitle}>{isVi ? "Đơn vị phát hành (Supplier)" : "Supplier"}</Text>
            <View style={S.partyBody}>
              <Text style={S.partyName}>{supplier?.name || "—"}</Text>
              {supplier?.phone && <Text style={S.partyRow}>SĐT: <Text style={S.partyRowBold}>{supplier.phone}</Text></Text>}
              {supplier?.email && <Text style={S.partyRow}>Email: <Text style={S.partyRowBold}>{supplier.email}</Text></Text>}
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={S.table}>
          <View style={S.tableHead}>
            <Text style={[S.thText, S.colNo]}>#</Text>
            <Text style={[S.thText, S.colProduct]}>{isVi ? "Mô tả sản phẩm" : "Item Description"}</Text>
            <Text style={[S.thText, S.colUom]}>{isVi ? "ĐVT" : "Uom"}</Text>
            <Text style={[S.thText, S.colQty]}>{isVi ? "SL" : "Qty"}</Text>
            <Text style={[S.thText, S.colPrice]}>{isVi ? "Đơn giá" : "Price"}</Text>
            <Text style={[S.thText, S.colTax]}>{isVi ? "Thuế" : "Tax"}</Text>
            <Text style={[S.thText, S.colTotal]}>{isVi ? "Thành tiền" : "Total"}</Text>
          </View>

          {(invoice.lines || []).map((line, idx) => {
            const displayQty = line.quantity;
            const rawUom = (line as any).uom?.name || (line as any).product?.uom?.name;
            const uom = rawUom ? translateUomName(rawUom) : "—";
            const product = line.product;

            return (
              <View key={idx} style={[S.tableRow, idx % 2 === 1 ? S.tableRowEven : {}]} wrap={false}>
                <Text style={[S.tdText, S.colNo, { color: "#9ca3af" }]}>{idx + 1}</Text>
                <View style={S.colProduct}>
                  <Text style={[S.tdText, S.tdBold]}>{product?.name || line.description || "—"}</Text>
                </View>
                <Text style={[S.tdText, S.colUom]}>{uom}</Text>
                <Text style={[S.tdText, S.tdBold, S.colQty]}>{displayQty}</Text>
                <Text style={[S.tdText, S.colPrice]}>{fmtMoney(line.unit_price)}</Text>
                <Text style={[S.tdText, S.colTax]}>{line.tax_rate_id ? "VAT" : "0%"}</Text>
                <Text style={[S.tdText, S.tdBold, S.colTotal]}>{fmtMoney(line.line_total_after_tax)}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={S.summaryWrap}>
          <View style={S.summaryBox}>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>{isVi ? "Cộng tiền chưa thuế" : "Subtotal"}</Text>
              <Text style={S.summaryVal}>{fmtMoney(invoice.total_before_tax)}</Text>
            </View>
            <View style={S.summaryRow}>
              <Text style={S.summaryLabel}>{isVi ? "Thuế GTGT" : "VAT Total"}</Text>
              <Text style={S.summaryVal}>{fmtMoney(invoice.total_tax)}</Text>
            </View>
            <View style={S.summaryTotalRow}>
              <Text style={S.summaryTotalLabel}>{isVi ? "TỔNG CỘNG" : "GRAND TOTAL"}</Text>
              <Text style={S.summaryTotalVal}>{fmtMoney(invoice.total_after_tax)}</Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={S.sigSection}>
          <View style={S.sigGrid}>
            {/* Creator */}
            <View style={S.sigBox}>
              <Text style={S.sigTitle}>{isVi ? "Người lập hóa đơn" : "Prepared By"}</Text>
              <View style={S.sigPlaceholder} />
              <Text style={S.sigName}>{creator?.full_name || "—"}</Text>
            </View>

            {/* Manager signature (drawn + QR Code) */}
            <View style={S.sigBox}>
              <Text style={S.sigTitle}>{isVi ? "Kế toán trưởng (Ký số)" : "Chief Accountant (E-Signed)"}</Text>
              {chaccSignature ? (
                <>
                  <Image src={chaccSignature.signature_image} style={S.sigImage} />
                  {qrCodeUrl && <Image src={qrCodeUrl} style={S.qrImage} />}
                  <Text style={S.sigSub}>Mã băm xác thực chống giả mạo:</Text>
                  <Text style={[S.sigSub, { fontFamily: "Roboto", fontSize: 5, color: "#1e3a8a", fontWeight: "bold" }]}>
                    {chaccSignature.hash_value}
                  </Text>
                </>
              ) : (
                <View style={S.sigPlaceholder} />
              )}
              <Text style={S.sigName}>{invoice.approver?.full_name || (chaccSignature ? "Kế toán trưởng đã ký" : "—")}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerThank}>{isVi ? "Tài liệu lưu hành nội bộ!" : "Internal circulation only!"}</Text>
          <Text style={S.footerSub}>{isVi ? "Tài liệu tự động tạo bởi ERP-MINI" : "Document generated by ERP-MINI"} · {ts}</Text>
        </View>
      </Page>
    </Document>
  );
}
