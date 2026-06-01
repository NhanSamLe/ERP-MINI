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

export async function sendEmail(to: string, subject: string, text: string, html?: string) {
  try {
    const info = await transporter.sendMail({
      from: `"ERP System" <${env.mail.user}>`,
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
export function resetPasswordTemplate(username: string, resetLink: string) {
  return {
    subject: "Password Reset",
    text: `Xin chào ${username}, hãy nhấn vào link sau để đặt lại mật khẩu: ${resetLink}`,
    html: `
      <div style="font-family:sans-serif;line-height:1.5;">
        <h2 style="color:#f97316;">Password Reset</h2>
        <p>Chào ${username},</p>
        <p>Nhấn nút bên dưới để đặt lại mật khẩu (hết hạn sau 10 phút):</p>
        <a href="${resetLink}" 
           style="display:inline-block;margin-top:10px;padding:10px 16px;
                  background:#f97316;color:#fff;text-decoration:none;
                  border-radius:6px;font-weight:bold;">
           Reset Password
        </a>
      </div>
    `,
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
  return {
    subject: "Thông báo cấp tài khoản ERP",
    text: `
Xin chào ${fullName || username},

Bạn đã được cấp tài khoản truy cập hệ thống ERP của công ty.

Tên đăng nhập: ${username}

Vui lòng truy cập đường dẫn bên dưới để thiết lập mật khẩu và kích hoạt tài khoản:
${resetLink}

Lưu ý:
- Đường dẫn này chỉ có hiệu lực trong 24 giờ
- Sau khi đặt mật khẩu thành công, tài khoản sẽ được kích hoạt

Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ bộ phận IT / Nhân sự.

Trân trọng,
ERP System
    `.trim(),

    html: `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
  <h2 style="color: #f97316;">🎉 Chào mừng bạn đến với hệ thống ERP</h2>

  <p>Xin chào <strong>${fullName || username}</strong>,</p>

  <p>
    Bạn đã được cấp tài khoản truy cập <strong>hệ thống ERP của công ty</strong>.
  </p>

  <div style="background:#f9fafb;padding:12px;border-radius:8px;margin:16px 0;">
    <p><strong>Tên đăng nhập:</strong> ${username}</p>
  </div>

  <p>
    Vui lòng nhấn nút bên dưới để <strong>thiết lập mật khẩu và kích hoạt tài khoản</strong>:
  </p>

  <a href="${resetLink}"
     style="
       display:inline-block;
       margin-top:12px;
       padding:12px 20px;
       background:#f97316;
       color:#ffffff;
       text-decoration:none;
       border-radius:6px;
       font-weight:bold;
     ">
    Thiết lập mật khẩu
  </a>

  <p style="margin-top:16px;font-size:14px;color:#555;">
    ⏳ Lưu ý: Đường dẫn này sẽ hết hạn sau <strong>24 giờ</strong>.
  </p>

  <p style="margin-top:20px;">
    Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ <strong>bộ phận IT / Nhân sự</strong>.
  </p>

  <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"/>

  <p style="font-size:13px;color:#777;">
    Email này được gửi tự động từ hệ thống ERP. Vui lòng không phản hồi email này.
  </p>
</div>
    `,
  };
}
