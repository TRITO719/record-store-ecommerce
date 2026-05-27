import nodemailer from 'nodemailer';
import { env } from './env';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Send OTP verification email with a styled HTML template.
 * The OTP code is displayed prominently in the email body.
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#141414;border-radius:16px;border:1px solid #222;overflow:hidden;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1db954 0%,#148a3c 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#000;font-size:22px;font-weight:800;letter-spacing:-0.5px;">
        🎵 Classic Records
      </h1>
      <p style="margin:8px 0 0;color:rgba(0,0,0,0.7);font-size:13px;">
        Xác thực tài khoản
      </p>
    </div>

    <!-- Body -->
    <div style="padding:32px 28px;">
      <p style="color:#e0e0e0;font-size:14px;line-height:1.6;margin:0 0 20px;">
        Xin chào! Bạn vừa đăng ký tài khoản tại <strong style="color:#1db954;">Classic Records</strong>.
        Vui lòng sử dụng mã OTP bên dưới để xác thực email của bạn:
      </p>

      <!-- OTP Code -->
      <div style="background:#1a1a1a;border:2px dashed #1db954;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <p style="margin:0 0 8px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:700;">
          Mã xác thực
        </p>
        <p style="margin:0;color:#1db954;font-size:36px;font-weight:800;letter-spacing:8px;font-family:'Courier New',monospace;">
          ${otp}
        </p>
      </div>

      <p style="color:#888;font-size:12px;line-height:1.5;margin:20px 0 0;">
        ⏱ Mã có hiệu lực trong <strong style="color:#e0e0e0;">5 phút</strong>.<br>
        🔒 Không chia sẻ mã này với bất kỳ ai.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:20px 28px;border-top:1px solid #222;text-align:center;">
      <p style="margin:0;color:#555;font-size:11px;">
        Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"Classic Records" <${env.SMTP_USER}>`,
    to,
    subject: `[Classic Records] Mã xác thực OTP: ${otp}`,
    html,
  });
}
