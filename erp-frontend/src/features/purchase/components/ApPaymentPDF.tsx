import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer";
import { ApPayment } from "../store/apPayment/apPayment.types";

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
    borderBottomColor: "#f97316",
    paddingBottom: 10,
    marginBottom: 14,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#f97316",
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
    borderColor: "#f97316",
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
    color: "#f97316",
  },
  partyBody: { paddingVertical: 7, paddingHorizontal: 8 },
  partyName: { fontSize: 9, fontWeight: "bold", marginBottom: 4 },
  partyRow: { fontSize: 8, color: "#555", marginTop: 2 },
  partyRowBold: { fontWeight: "bold", color: "#1a1a1a" },
  
  detailsBlock: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    marginBottom: 14,
  },
  detailsTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#f97316",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailsLabel: { fontSize: 8, color: "#555" },
  detailsValue: { fontSize: 8, fontWeight: "bold" },
  
  summaryWrap: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 20 },
  summaryBox: { width: 220 },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f97316",
    paddingVertical: 7,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  summaryTotalLabel: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  summaryTotalVal: { fontSize: 10, fontWeight: "bold", color: "#fff" },
  sigSection: {
    borderTopWidth: 1.5,
    borderTopColor: "#f97316",
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
  payment: ApPayment;
  lang?: "vi" | "en";
}

export function ApPaymentPDF({ payment, lang = "vi" }: Props) {
  const isVi = lang === "vi";

  const fmtMoney = (v: number | string | null | undefined) =>
    `${Number(v || 0).toLocaleString(isVi ? "vi-VN" : "en-US", { maximumFractionDigits: 0 })} VND`;

  const supplier = payment.supplier;
  const creator = payment.creator;
  const branch = payment.branch;
  const bankAccount = payment.bankAccount;

  // Lấy chữ ký từ model
  const chaccSignature = (payment as any).signatures?.find(
    (s: any) => s.document_type === "ap_payment" || s.document_type === "AP_PAYMENT"
  ) || payment.signatures?.[0];

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
            <Text style={S.companyName}>{branch?.company?.name || "ERP-MINI ENTERPRISE"}</Text>
            <Text style={S.companyBranch}>Chi nhánh: {branch?.name || "Main Branch"}</Text>
            <Text style={[S.companyBranch, { marginTop: 4, fontSize: 9, fontWeight: "bold", color: "#3b82f6" }]}>
              {isVi ? "PHIẾU CHI MUA HÀNG (AP PAYMENT)" : "AP PAYMENT"}
            </Text>
          </View>
          <View style={S.invoiceTitleBlock}>
            <Text style={S.invoiceTitle}>{isVi ? "PHIẾU CHI" : "PAYMENT"}</Text>
            <View style={S.invoiceNoBox}>
              <Text style={S.invoiceNo}>{payment.payment_no}</Text>
            </View>
            <Text style={S.invoiceDateText}>
              {isVi ? "Ngày thanh toán" : "Payment Date"}: {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString(isVi ? "vi-VN" : "en-US") : "—"}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={S.partiesRow}>
          {/* Pay From */}
          <View style={S.partyBox}>
            <Text style={S.partyTitle}>{isVi ? "Đơn vị chi (Pay From)" : "Pay From"}</Text>
            <View style={S.partyBody}>
              <Text style={S.partyName}>{branch?.company?.name || "ERP-MINI Co., Ltd"}</Text>
              {branch?.address && <Text style={S.partyRow}>{isVi ? "Địa chỉ" : "Address"}: <Text style={S.partyRowBold}>{branch.address}</Text></Text>}
              {bankAccount && (
                <Text style={S.partyRow}>
                  {isVi ? "Tài khoản" : "Account"}: <Text style={S.partyRowBold}>{bankAccount.account_number} ({bankAccount.bank_name})</Text>
                </Text>
              )}
              <Text style={S.partyRow}>{isVi ? "Người lập" : "Prepared By"}: <Text style={S.partyRowBold}>{creator?.full_name || "—"}</Text></Text>
            </View>
          </View>

          {/* Supplier (Pay To) */}
          <View style={S.partyBox}>
            <Text style={S.partyTitle}>{isVi ? "Đơn vị nhận (Pay To)" : "Pay To"}</Text>
            <View style={S.partyBody}>
              <Text style={S.partyName}>{supplier?.name || "—"}</Text>
              {supplier?.phone && <Text style={S.partyRow}>SĐT: <Text style={S.partyRowBold}>{supplier.phone}</Text></Text>}
              {supplier?.email && <Text style={S.partyRow}>Email: <Text style={S.partyRowBold}>{supplier.email}</Text></Text>}
            </View>
          </View>
        </View>

        {/* Details Block */}
        <View style={S.detailsBlock}>
          <Text style={S.detailsTitle}>{isVi ? "Chi tiết thanh toán" : "Payment Details"}</Text>
          <View style={S.detailsRow}>
            <Text style={S.detailsLabel}>{isVi ? "Mã phiếu chi" : "Payment No"}</Text>
            <Text style={S.detailsValue}>{payment.payment_no}</Text>
          </View>
          <View style={S.detailsRow}>
            <Text style={S.detailsLabel}>{isVi ? "Ngày thanh toán" : "Payment Date"}</Text>
            <Text style={S.detailsValue}>{new Date(payment.payment_date).toLocaleDateString(isVi ? "vi-VN" : "en-US")}</Text>
          </View>
          <View style={S.detailsRow}>
            <Text style={S.detailsLabel}>{isVi ? "Phương thức thanh toán" : "Payment Method"}</Text>
            <Text style={S.detailsValue}>{payment.method.toUpperCase()}</Text>
          </View>
          <View style={S.detailsRow}>
            <Text style={S.detailsLabel}>{isVi ? "Trạng thái phê duyệt" : "Approval Status"}</Text>
            <Text style={S.detailsValue}>{payment.approval_status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={S.summaryWrap}>
          <View style={S.summaryBox}>
            <View style={S.summaryTotalRow}>
              <Text style={S.summaryTotalLabel}>{isVi ? "TỔNG SỐ TIỀN" : "TOTAL AMOUNT"}</Text>
              <Text style={S.summaryTotalVal}>{fmtMoney(payment.amount)}</Text>
            </View>
          </View>
        </View>

        {/* Signatures */}
        <View style={S.sigSection}>
          <View style={S.sigGrid}>
            {/* Creator */}
            <View style={S.sigBox}>
              <Text style={S.sigTitle}>{isVi ? "Người lập phiếu" : "Prepared By"}</Text>
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
              <Text style={S.sigName}>{payment.approver?.full_name || (chaccSignature ? "Kế toán trưởng đã ký" : "—")}</Text>
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
