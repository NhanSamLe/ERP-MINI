import {env} from "../../config/env";
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
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw new Error("Unable to send email");
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