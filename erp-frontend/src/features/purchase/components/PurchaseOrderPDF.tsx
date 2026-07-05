import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { PurchaseOrder } from "../store/purchaseOrder.types";

// Register Roboto Font for clean vietnamese typography
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

/* ────────────── colour tokens ────────────── */
const C = {
  primary: "#f97316",       // system primary orange (#f97316)
  primaryDark: "#ea580c",   // darker orange for text/accents
  primaryBg: "#fff7ed",     // orange-50 tint
  primaryBanner: "#f97316", // exact system primary orange for banner
  accent: "#f97316",        // system primary orange
  accentDark: "#d97706",
  dark: "#0f172a",
  text: "#1e293b",
  textMuted: "#475569",
  textLight: "#94a3b8",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  rowAlt: "#f8fafc",
  white: "#ffffff",
  success: "#16a34a",
  successBg: "#dcfce7",
  warningBg: "#fef9c3",
  dangerBg: "#fee2e2",
  danger: "#dc2626",
};

const S = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 0,
    paddingBottom: 55,
    paddingHorizontal: 0,
  },

  /* ── Top banner ── */
  banner: {
    backgroundColor: C.primaryBanner,
    paddingVertical: 18,
    paddingHorizontal: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLeft: {},
  bannerCompany: {
    fontSize: 16,
    fontWeight: "bold",
    color: C.white,
    letterSpacing: 1,
  },
  bannerSubtitle: {
    fontSize: 7.5,
    color: "#fed7aa",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  bannerRight: {
    alignItems: "flex-end",
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  bannerPoNo: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#fdba74",
    marginTop: 3,
  },

  /* ── Content wrapper ── */
  content: {
    paddingHorizontal: 40,
    paddingTop: 16,
  },

  /* ── Status + Meta row ── */
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  metaLeft: {
    flexDirection: "row",
    gap: 20,
  },
  metaItem: {
    marginRight: 18,
  },
  metaLabel: {
    fontSize: 7,
    color: C.textLight,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.dark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 7,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* ── Parties ── */
  partiesContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  partyCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  partyHeader: {
    backgroundColor: C.primaryBg,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#fed7aa",
  },
  partyTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: C.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  partyBody: {
    padding: 10,
  },
  partyName: {
    fontSize: 10,
    fontWeight: "bold",
    color: C.dark,
    marginBottom: 4,
  },
  partyLine: {
    fontSize: 8,
    color: C.textMuted,
    marginTop: 2,
    lineHeight: 1.4,
  },
  partyLabel: {
    color: C.textLight,
    fontSize: 8,
  },

  /* ── Table ── */
  tableContainer: {
    marginBottom: 4,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  thRow: {
    flexDirection: "row",
    backgroundColor: C.primaryBanner,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  thText: {
    fontSize: 7,
    fontWeight: "bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tdRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    alignItems: "center",
  },
  tdRowAlt: {
    backgroundColor: C.rowAlt,
  },
  tdText: {
    fontSize: 8,
    color: C.text,
  },
  tdBold: {
    fontWeight: "bold",
    color: C.dark,
  },
  colNo: { width: "5%", textAlign: "center" },
  colDesc: { width: "31%", textAlign: "left" },
  colUom: { width: "9%", textAlign: "center" },
  colQty: { width: "7%", textAlign: "right" },
  colPrice: { width: "15%", textAlign: "right" },
  colDisc: { width: "11%", textAlign: "right" },
  colTax: { width: "9%", textAlign: "right" },
  colTotal: { width: "13%", textAlign: "right" },

  /* ── Summary + Notes row ── */
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 25,
    gap: 20,
  },
  notesBox: {
    flex: 1,
    maxWidth: "50%",
  },
  notesTitle: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: C.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  notesContent: {
    fontSize: 8,
    color: C.textMuted,
    lineHeight: 1.5,
    fontStyle: "italic",
  },
  summaryBlock: {
    width: 230,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  summaryLabel: {
    fontSize: 8,
    color: C.textMuted,
  },
  summaryValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: C.dark,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: C.primaryBanner,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.white,
  },
  grandTotalValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fdba74",
  },

  /* ── Signatures ── */
  signaturesContainer: {
    borderTopWidth: 2,
    borderTopColor: C.accent,
    paddingTop: 18,
    marginTop: 5,
  },
  signaturesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sigBox: {
    width: "45%",
    alignItems: "center",
  },
  sigTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: C.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sigPlaceholder: {
    height: 45,
    width: "80%",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "dashed",
    marginVertical: 4,
  },
  sigImage: {
    width: 100,
    height: 36,
    objectFit: "contain",
    marginVertical: 4,
  },
  signerText: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: C.dark,
    marginTop: 4,
    textAlign: "center",
  },
  signerRole: {
    fontSize: 7,
    color: C.textLight,
    marginTop: 1,
    textAlign: "center",
  },

  /* ── QR Code ── */
  qrCodeBlock: {
    alignItems: "center",
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: C.primaryBg,
    borderRadius: 4,
    padding: 6,
    width: 180,
  },
  qrCodeImage: {
    width: 44,
    height: 44,
  },
  qrLabel: {
    fontSize: 5.5,
    fontWeight: "bold",
    color: C.primaryDark,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 4,
    textAlign: "center",
  },
  qrCodeHash: {
    fontSize: 4,
    color: C.textMuted,
    marginTop: 2,
    textAlign: "center",
    width: 168,
  },
  qrVerified: {
    fontSize: 5.5,
    fontWeight: "bold",
    color: C.success,
    marginTop: 2,
    textAlign: "center",
  },

  /* ── Footer ── */
  footerContainer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: C.textLight,
  },
  footerPageNo: {
    fontSize: 7,
    fontWeight: "bold",
    color: C.textMuted,
  },
});

/* ─── helpers ─── */
const statusConfig: Record<string, { bg: string; color: string; vi: string; en: string }> = {
  draft:              { bg: C.borderLight, color: C.textMuted,  vi: "Bản nháp",          en: "Draft" },
  waiting_approval:   { bg: C.warningBg,   color: C.accentDark, vi: "Chờ duyệt",         en: "Pending" },
  confirmed:          { bg: C.successBg,   color: C.success,    vi: "Đã xác nhận",       en: "Confirmed" },
  partially_received: { bg: "#fff7ed",     color: C.primary,    vi: "Nhận một phần",     en: "Partial" },
  completed:          { bg: C.successBg,   color: C.success,    vi: "Hoàn thành",        en: "Completed" },
  cancelled:          { bg: C.dangerBg,    color: C.danger,     vi: "Đã hủy",            en: "Cancelled" },
};

interface Props {
  po: PurchaseOrder;
  lang?: "vi" | "en";
}

export function PurchaseOrderPDF({ po, lang = "vi" }: Props) {
  const isVi = lang === "vi";
  const currencyCode = po.currency_id ? ((po as any).currency?.code || "VND") : "VND";
  const currencySymbol = po.currency_id ? ((po as any).currency?.symbol || currencyCode) : "VND";

  const fmtMoney = (v: number | null | undefined) =>
    `${Number(v || 0).toLocaleString(isVi ? "vi-VN" : "en-US", { maximumFractionDigits: 2 })} ${currencySymbol}`;

  const supplier = po.supplier;
  const creator = po.creator;

  const managerSignature = (po as any).signatures?.find(
    (s: any) => s.document_type === "purchase_order"
  );

  const verifyUrl = `${window.location.origin}/public/verify/${managerSignature?.hash_value || ""}`;
  const qrCodeUrl = managerSignature
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(verifyUrl)}`
    : null;

  const printedAt = new Date().toLocaleString(isVi ? "vi-VN" : "en-GB");
  const statusCfg = statusConfig[po.status] || statusConfig.draft;

  const orderDate = po.order_date
    ? new Date(po.order_date).toLocaleDateString(isVi ? "vi-VN" : "en-US", {
        day: "2-digit", month: "2-digit", year: "numeric",
      })
    : "—";

  const paymentTerm = (po as any).paymentTerm;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* ═══ Banner ═══ */}
        <View style={S.banner}>
          <View style={S.bannerLeft}>
            <Text style={S.bannerCompany}>ERP-MINI</Text>
            <Text style={S.bannerSubtitle}>
              {isVi ? "Hệ thống quản lý doanh nghiệp" : "Enterprise Resource Planning"}
            </Text>
          </View>
          <View style={S.bannerRight}>
            <Text style={S.bannerTitle}>
              {isVi ? "Đơn đặt hàng" : "Purchase Order"}
            </Text>
            <Text style={S.bannerPoNo}>{po.po_no}</Text>
          </View>
        </View>

        <View style={S.content}>
          {/* ═══ Meta info row ═══ */}
          <View style={S.metaRow}>
            <View style={S.metaLeft}>
              <View style={S.metaItem}>
                <Text style={S.metaLabel}>{isVi ? "Ngày lập" : "Order Date"}</Text>
                <Text style={S.metaValue}>{orderDate}</Text>
              </View>
              {paymentTerm && (
                <View style={S.metaItem}>
                  <Text style={S.metaLabel}>{isVi ? "Điều khoản thanh toán" : "Payment Term"}</Text>
                  <Text style={S.metaValue}>
                    {paymentTerm.name} ({paymentTerm.days} {isVi ? "ngày" : "days"})
                  </Text>
                </View>
              )}
              <View style={S.metaItem}>
                <Text style={S.metaLabel}>{isVi ? "Tiền tệ" : "Currency"}</Text>
                <Text style={S.metaValue}>{currencyCode}</Text>
              </View>
            </View>
            <View style={[S.statusBadge, { backgroundColor: statusCfg.bg }]}>
              <Text style={[S.statusText, { color: statusCfg.color }]}>
                {isVi ? statusCfg.vi : statusCfg.en}
              </Text>
            </View>
          </View>

          {/* ═══ Parties ═══ */}
          <View style={S.partiesContainer}>
            {/* Buyer */}
            <View style={S.partyCard}>
              <View style={S.partyHeader}>
                <Text style={S.partyTitle}>{isVi ? "Bên mua" : "Buyer"}</Text>
              </View>
              <View style={S.partyBody}>
                <Text style={S.partyName}>ERP-MINI Co., Ltd</Text>
                <Text style={S.partyLine}>
                  <Text style={S.partyLabel}>{isVi ? "Người lập: " : "Prepared by: "}</Text>
                  {creator?.full_name || "—"}
                </Text>
                <Text style={S.partyLine}>
                  <Text style={S.partyLabel}>Email: </Text>
                  {creator?.email || "support@erp-mini.com"}
                </Text>
                {creator?.phone && (
                  <Text style={S.partyLine}>
                    <Text style={S.partyLabel}>{isVi ? "SĐT: " : "Phone: "}</Text>
                    {creator.phone}
                  </Text>
                )}
              </View>
            </View>

            {/* Supplier */}
            <View style={S.partyCard}>
              <View style={S.partyHeader}>
                <Text style={S.partyTitle}>{isVi ? "Nhà cung cấp" : "Supplier"}</Text>
              </View>
              <View style={S.partyBody}>
                {supplier ? (
                  <>
                    <Text style={S.partyName}>{supplier.name}</Text>
                    {supplier.phone && (
                      <Text style={S.partyLine}>
                        <Text style={S.partyLabel}>{isVi ? "SĐT: " : "Phone: "}</Text>
                        {supplier.phone}
                      </Text>
                    )}
                    {supplier.email && (
                      <Text style={S.partyLine}>
                        <Text style={S.partyLabel}>Email: </Text>
                        {supplier.email}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={{ fontSize: 8, color: C.textLight, fontStyle: "italic", marginTop: 4 }}>
                    {isVi ? "Chưa chọn nhà cung cấp" : "No supplier assigned"}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ═══ Items table ═══ */}
          <View style={S.tableContainer}>
            <View style={S.thRow}>
              <Text style={[S.thText, S.colNo]}>#</Text>
              <Text style={[S.thText, S.colDesc]}>{isVi ? "Sản phẩm" : "Product"}</Text>
              <Text style={[S.thText, S.colUom]}>{isVi ? "ĐVT" : "UoM"}</Text>
              <Text style={[S.thText, S.colQty]}>{isVi ? "SL" : "Qty"}</Text>
              <Text style={[S.thText, S.colPrice]}>{isVi ? "Đơn giá" : "Unit Price"}</Text>
              <Text style={[S.thText, S.colDisc]}>{isVi ? "Chiết khấu" : "Discount"}</Text>
              <Text style={[S.thText, S.colTax]}>{isVi ? "Thuế" : "Tax"}</Text>
              <Text style={[S.thText, S.colTotal]}>{isVi ? "Thành tiền" : "Amount"}</Text>
            </View>

            {(po.lines || []).map((line, idx) => {
              const product = line.product;
              const alt = idx % 2 === 1;
              const lineDiscount = line.discount_amount
                ? fmtMoney(line.discount_amount)
                : line.discount_percent
                  ? `${line.discount_percent}%`
                  : "—";
              const lineTax = fmtMoney(line.line_tax);

              // Translate UoM if it's 'Piece' / 'piece'
              let uomName = line.uom?.name || "—";
              if (uomName.toLowerCase() === "piece") {
                uomName = isVi ? "Cái" : "Pcs";
              }

              return (
                <View key={idx} style={[S.tdRow, alt ? S.tdRowAlt : {}]} wrap={false}>
                  <Text style={[S.tdText, S.colNo, { color: C.textLight }]}>{idx + 1}</Text>
                  <Text style={[S.tdText, S.tdBold, S.colDesc]}>{product?.name || "—"}</Text>
                  <Text style={[S.tdText, S.colUom]}>{uomName}</Text>
                  <Text style={[S.tdText, S.tdBold, S.colQty]}>
                    {line.quantity.toLocaleString(isVi ? "vi-VN" : "en-US")}
                  </Text>
                  <Text style={[S.tdText, S.colPrice]}>{fmtMoney(line.unit_price)}</Text>
                  <Text style={[S.tdText, S.colDisc]}>{lineDiscount}</Text>
                  <Text style={[S.tdText, S.colTax]}>{lineTax}</Text>
                  <Text style={[S.tdText, S.tdBold, S.colTotal]}>{fmtMoney(line.line_total_after_tax)}</Text>
                </View>
              );
            })}
          </View>

          {/* ═══ Notes + Summary ═══ */}
          <View style={S.bottomRow}>
            {/* Notes */}
            <View style={S.notesBox}>
              <Text style={S.notesTitle}>{isVi ? "Ghi chú" : "Notes"}</Text>
              <Text style={S.notesContent}>
                {po.description || (isVi ? "Không có ghi chú" : "No notes")}
              </Text>
            </View>

            {/* Summary */}
            <View style={S.summaryBlock}>
              <View style={S.summaryRow}>
                <Text style={S.summaryLabel}>{isVi ? "Tiền hàng (chưa thuế)" : "Subtotal"}</Text>
                <Text style={S.summaryValue}>{fmtMoney(po.total_before_tax)}</Text>
              </View>
              <View style={S.summaryRow}>
                <Text style={S.summaryLabel}>{isVi ? "Thuế GTGT (VAT)" : "VAT"}</Text>
                <Text style={S.summaryValue}>{fmtMoney(po.total_tax)}</Text>
              </View>
              {po.discount_amount && Number(po.discount_amount) > 0 ? (
                <View style={S.summaryRow}>
                  <Text style={S.summaryLabel}>{isVi ? "Chiết khấu" : "Discount"}</Text>
                  <Text style={[S.summaryValue, { color: C.danger }]}>-{fmtMoney(po.discount_amount)}</Text>
                </View>
              ) : null}
              <View style={S.grandTotalRow}>
                <Text style={S.grandTotalLabel}>{isVi ? "TỔNG CỘNG" : "GRAND TOTAL"}</Text>
                <Text style={S.grandTotalValue}>{fmtMoney(po.total_after_tax)}</Text>
              </View>
            </View>
          </View>

          {/* ═══ Signatures ═══ */}
          <View style={S.signaturesContainer}>
            <View style={S.signaturesGrid}>
              {/* Prepared By */}
              <View style={S.sigBox}>
                <Text style={S.sigTitle}>{isVi ? "Người lập đơn" : "Prepared by"}</Text>
                <View style={S.sigPlaceholder} />
                <Text style={S.signerText}>{creator?.full_name || "—"}</Text>
                <Text style={S.signerRole}>{isVi ? "Nhân viên mua hàng" : "Purchaser"}</Text>
              </View>

              {/* Approved By */}
              <View style={S.sigBox}>
                <Text style={S.sigTitle}>
                  {isVi ? "Người phê duyệt" : "Approved by"}
                </Text>
                {managerSignature ? (
                  <>
                    <Image src={managerSignature.signature_image} style={S.sigImage} />
                    {qrCodeUrl && (
                      <View style={S.qrCodeBlock}>
                        <Image src={qrCodeUrl} style={S.qrCodeImage} />
                        <Text style={S.qrLabel}>
                          {isVi ? "Xác thực chữ ký số" : "Digital Signature"}
                        </Text>
                        <Text style={S.qrVerified}>✓ {isVi ? "Hợp lệ" : "Verified"}</Text>
                        <Text style={S.qrCodeHash}>{managerSignature.hash_value}</Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={S.sigPlaceholder} />
                )}
                <Text style={S.signerText}>
                  {po.approver?.full_name ||
                    (managerSignature
                      ? (isVi ? "Quản lý đã ký số" : "Digitally signed")
                      : "—")}
                </Text>
                <Text style={S.signerRole}>
                  {isVi ? "Người có thẩm quyền" : "Authorized Signatory"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ Footer ═══ */}
        <View style={S.footerContainer} fixed>
          <Text style={S.footerText}>
            {isVi
              ? "Tài liệu được tạo tự động bởi hệ thống ERP-MINI"
              : "Auto-generated by ERP-MINI"}{" "}
            · {printedAt}
          </Text>
          <Text
            style={S.footerPageNo}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}