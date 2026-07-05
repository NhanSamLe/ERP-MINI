import { env } from "../../config/env";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: false,
  auth: {
    user: env.mail.user,
    pass: env.mail.pass,
  },
});

/**
 * Tên thương hiệu hiển thị trên email. Có thể override qua biến môi trường.
 */
const BRAND_NAME = process.env.MAIL_BRAND_NAME || "ERP Mini";
const SUPPORT_EMAIL = process.env.MAIL_SUPPORT_EMAIL || env.mail.user;
const BRAND_PRIMARY = "#f97316"; // orange-500
const BRAND_PRIMARY_DARK = "#ea580c"; // orange-600

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    const info = await transporter.sendMail({
      from: `"${BRAND_NAME}" <${env.mail.user}>`,
      to,
      subject,
      text,
      html: html || text,
    });
    console.log("📧 Email sent:", info.messageId);
    return true;
  } catch (err: any) {
    console.error("❌ Email send failed:", err);
    throw new Error(`Unable to send email: ${err.message || err}`);
  }
}

/**
 * Khung layout email dùng chung cho toàn hệ thống.
 * Bố cục theo chuẩn email doanh nghiệp: header thương hiệu, thân nội dung
 * trong card, footer pháp lý. Style được viết inline để tương thích tối đa
 * với các email client (Gmail, Outlook, Apple Mail...).
 */
interface BaseLayoutOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
}

function baseEmailLayout({ title, preheader, bodyHtml }: BaseLayoutOptions): string {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;-webkit-text-size-adjust:100%;">
  ${
    preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${preheader}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);border:1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_PRIMARY} 0%,${BRAND_PRIMARY_DARK} 100%);padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:0.3px;">
                    ${BRAND_NAME}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#1f2937;font-size:15px;line-height:1.65;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f9fafb;border-top:1px solid #e5e7eb;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
                Cần hỗ trợ? Liên hệ chúng tôi qua
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_PRIMARY_DARK};text-decoration:none;">${SUPPORT_EMAIL}</a>.
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;line-height:1.6;">
                Email này được gửi tự động từ hệ thống ${BRAND_NAME}. Vui lòng không phản hồi trực tiếp email này.
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${year} ${BRAND_NAME}. Bảo lưu mọi quyền.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

/**
 * Nút hành động (CTA) dùng chung — bullet-proof button cho Outlook.
 */
function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td align="center" style="border-radius:8px;background-color:${BRAND_PRIMARY};">
        <a href="${href}"
           style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:8px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

export function resetPasswordTemplate(username: string, resetLink: string) {
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#111827;">Đặt lại mật khẩu</h1>
    <p style="margin:0 0 12px;">Xin chào <strong>${username}</strong>,</p>
    <p style="margin:0 0 12px;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn vào nút bên dưới để tạo mật khẩu mới.
    </p>
    ${ctaButton(resetLink, "Đặt lại mật khẩu")}
    <p style="margin:0 0 12px;font-size:14px;color:#6b7280;">
      ⏳ Vì lý do bảo mật, liên kết này sẽ <strong>hết hạn sau 10 phút</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
      Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email — mật khẩu của bạn sẽ không thay đổi.
    </p>
    <div style="margin-top:20px;padding:14px 16px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt:</p>
      <p style="margin:0;font-size:13px;word-break:break-all;"><a href="${resetLink}" style="color:${BRAND_PRIMARY_DARK};text-decoration:none;">${resetLink}</a></p>
    </div>`;

  return {
    subject: `${BRAND_NAME} — Yêu cầu đặt lại mật khẩu`,
    text: [
      `Xin chào ${username},`,
      ``,
      `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.`,
      `Truy cập liên kết sau để tạo mật khẩu mới (hết hạn sau 10 phút):`,
      `${resetLink}`,
      ``,
      `Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email này.`,
      ``,
      `Trân trọng,`,
      `${BRAND_NAME}`,
    ].join("\n"),
    html: baseEmailLayout({
      title: "Đặt lại mật khẩu",
      preheader: "Yêu cầu đặt lại mật khẩu của bạn — liên kết hết hạn sau 10 phút.",
      bodyHtml,
    }),
  };
}


export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export async function sendEmail2(
  to: string,
  subject: string,
  text: string,
  html?: string,
  cc?: string | null,
  bcc?: string | null,
  attachments?: EmailAttachment[]
) {
  try {
    const info = await transporter.sendMail({
      from: `"ERP System" <${env.mail.user}>`,
      to,
      ...(cc ? { cc } : {}),
      ...(bcc ? { bcc } : {}),
      subject,
      text,
      html: html || text,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    console.log("📧 Email sent:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      info,
    };
  } catch (err) {
    console.error("❌ Email send failed:", err);
    return {
      success: false,
      messageId: null,
      error: err,
    };
  }
}

export function newEmployeeAccountTemplate(
  username: string,
  fullName: string | undefined,
  resetLink: string
) {
  const displayName = fullName || username;
  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#111827;">
      Chào mừng bạn đến với ${BRAND_NAME}
    </h1>
    <p style="margin:0 0 12px;">Xin chào <strong>${displayName}</strong>,</p>
    <p style="margin:0 0 12px;">
      Tài khoản truy cập hệ thống <strong>${BRAND_NAME}</strong> đã được tạo cho bạn.
      Vui lòng hoàn tất bước thiết lập mật khẩu bên dưới để kích hoạt và bắt đầu sử dụng.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr>
        <td style="padding:14px 16px;background-color:#f9fafb;font-size:13px;color:#6b7280;width:140px;">Tên đăng nhập</td>
        <td style="padding:14px 16px;background-color:#ffffff;font-size:14px;color:#111827;font-weight:bold;">${username}</td>
      </tr>
    </table>

    <p style="margin:0 0 4px;">
      Nhấn nút bên dưới để <strong>thiết lập mật khẩu và kích hoạt tài khoản</strong>:
    </p>
    ${ctaButton(resetLink, "Thiết lập mật khẩu")}

    <p style="margin:0 0 12px;font-size:14px;color:#6b7280;">
      ⏳ Liên kết kích hoạt có hiệu lực trong <strong>24 giờ</strong>. Sau khi đặt mật khẩu thành công, tài khoản sẽ được kích hoạt ngay.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;">
      Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ bộ phận <strong>IT / Nhân sự</strong> của công ty.
    </p>

    <div style="margin-top:20px;padding:14px 16px;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
      <p style="margin:0 0 6px;font-size:13px;color:#6b7280;">Nếu nút không hoạt động, sao chép liên kết sau vào trình duyệt:</p>
      <p style="margin:0;font-size:13px;word-break:break-all;"><a href="${resetLink}" style="color:${BRAND_PRIMARY_DARK};text-decoration:none;">${resetLink}</a></p>
    </div>`;

  return {
    subject: `${BRAND_NAME} — Kích hoạt tài khoản của bạn`,
    text: [
      `Xin chào ${displayName},`,
      ``,
      `Tài khoản truy cập hệ thống ${BRAND_NAME} đã được tạo cho bạn.`,
      ``,
      `Tên đăng nhập: ${username}`,
      ``,
      `Vui lòng truy cập đường dẫn bên dưới để thiết lập mật khẩu và kích hoạt tài khoản:`,
      `${resetLink}`,
      ``,
      `Lưu ý:`,
      `- Đường dẫn này chỉ có hiệu lực trong 24 giờ.`,
      `- Sau khi đặt mật khẩu thành công, tài khoản sẽ được kích hoạt.`,
      ``,
      `Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ bộ phận IT / Nhân sự.`,
      ``,
      `Trân trọng,`,
      `${BRAND_NAME}`,
    ].join("\n"),
    html: baseEmailLayout({
      title: "Kích hoạt tài khoản",
      preheader: `Tài khoản ${BRAND_NAME} của bạn đã sẵn sàng — thiết lập mật khẩu để bắt đầu.`,
      bodyHtml,
    }),
  };
}

export function purchaseOrderTemplate(po: any, supplierName: string, isVi: boolean) {
  const brandName = "ERP Mini";
  const managerSig = po.signatures?.find((s: any) => s.document_type === "purchase_order");
  const viewLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/public/verify/${managerSig?.hash_value || ""}`;
  const orderDateStr = po.order_date
    ? new Date(po.order_date).toLocaleDateString(isVi ? "vi-VN" : "en-US")
    : "—";
  const currencySymbol = po.currency?.symbol || "VND";
  const fmtMoney = (v: number) =>
    `${Number(v || 0).toLocaleString(isVi ? "vi-VN" : "en-US")} ${currencySymbol}`;

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:20px;font-weight:bold;color:#111827;">
      ${isVi ? "Đơn đặt hàng mới" : "New Purchase Order"} — ${po.po_no}
    </h1>
    <p style="margin:0 0 12px;">Xin chào <strong>${supplierName}</strong>,</p>
    <p style="margin:0 0 12px;">
      ${
        isVi
          ? `Công ty chúng tôi xin gửi đến quý đối tác Đơn đặt hàng mã số <strong>${po.po_no}</strong> được tạo ngày ${orderDateStr}.`
          : `Our company would like to send you Purchase Order No. <strong>${po.po_no}</strong> created on ${orderDateStr}.`
      }
    </p>

    <h3 style="margin:20px 0 10px;font-size:16px;font-weight:bold;color:#f97316;">
      ${isVi ? "Thông tin tóm tắt đơn hàng" : "Purchase Order Summary"}
    </h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-collapse:collapse;">
      <thead>
        <tr style="background-color:#f9fafb;border-bottom:1px solid #e5e7eb;">
          <th style="padding:10px;text-align:left;font-size:13px;color:#4b5563;font-weight:bold;width:40%;">${isVi ? "Sản phẩm" : "Product"}</th>
          <th style="padding:10px;text-align:right;font-size:13px;color:#4b5563;font-weight:bold;width:15%;">${isVi ? "ĐVT" : "UoM"}</th>
          <th style="padding:10px;text-align:right;font-size:13px;color:#4b5563;font-weight:bold;width:15%;">${isVi ? "Số lượng" : "Qty"}</th>
          <th style="padding:10px;text-align:right;font-size:13px;color:#4b5563;font-weight:bold;width:15%;">${isVi ? "Đơn giá" : "Price"}</th>
          <th style="padding:10px;text-align:right;font-size:13px;color:#4b5563;font-weight:bold;width:15%;">${isVi ? "Thành tiền" : "Total"}</th>
        </tr>
      </thead>
      <tbody>
        ${(po.lines || [])
          .map(
            (line: any) => `
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:10px;font-size:13px;color:#1f2937;">${line.product?.name || "—"}</td>
            <td style="padding:10px;font-size:13px;color:#1f2937;text-align:right;">${line.uom?.name || "—"}</td>
            <td style="padding:10px;font-size:13px;color:#1f2937;text-align:right;">${line.quantity}</td>
            <td style="padding:10px;font-size:13px;color:#1f2937;text-align:right;">${fmtMoney(line.unit_price)}</td>
            <td style="padding:10px;font-size:13px;color:#1f2937;text-align:right;font-weight:bold;">${fmtMoney(line.line_total_after_tax)}</td>
          </tr>
        `
          )
          .join("")}
        <tr style="background-color:#f9fafb;">
          <td colspan="4" style="padding:10px;font-size:13px;color:#4b5563;font-weight:bold;text-align:right;">${isVi ? "TỔNG CỘNG" : "GRAND TOTAL"}:</td>
          <td style="padding:10px;font-size:14px;color:#ea580c;font-weight:bold;text-align:right;">${fmtMoney(po.total_after_tax)}</td>
        </tr>
      </tbody>
    </table>

    <p style="margin:0 0 12px;">
      ${
        isVi
          ? "Đơn hàng này đã được phê duyệt bằng chữ ký số hợp lệ của ban quản lý. Quý đối tác vui lòng nhấn nút dưới đây để xem chi tiết bản gốc và xác thực tính pháp lý của chữ ký số."
          : "This order has been approved with a valid digital signature by our management team. Please click the button below to view the original details and verify the signature's validity."
      }
    </p>
    ${ctaButton(viewLink, isVi ? "Xem chi tiết & Xác thực" : "View Details & Verify")}
  `;

  return {
    subject: `[${brandName}] ${isVi ? "Đơn đặt hàng mới" : "New Purchase Order"} — ${po.po_no}`,
    text: `${isVi ? "Đơn đặt hàng mới" : "New Purchase Order"} ${po.po_no}`,
    html: baseEmailLayout({
      title: isVi ? "Đơn đặt hàng mới" : "New Purchase Order",
      preheader: `${isVi ? "Đơn đặt hàng từ" : "Purchase order from"} ${brandName} - ${po.po_no}`,
      bodyHtml,
    }),
  };
}
