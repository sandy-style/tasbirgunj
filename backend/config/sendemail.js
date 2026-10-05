import { transporter } from "./emailconfig.js";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoAttachment = {
  filename: "tasbirgunj-logo.png",
  path: path.join(__dirname, "../assets/logo.png"),
  cid: "tasbirgunj-logo",
};

// ===============================
// Verification Email
// ===============================

export const verificationEmail = async (email, verificationcode) => {
  try {
    const info = await transporter.sendMail({
      from: `"TasbirGunj" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Verify your email — TasbirGunj",

      text: `Your TasbirGunj verification code is: ${verificationcode}. This code expires in 10 minutes.`,

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Verify your email</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #032932;
              font-family: Arial, Helvetica, sans-serif;
              color: #123f42;
            "
          >

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                background-color: #032932;
                padding: 40px 15px;
              "
            >
              <tr>
                <td align="center">

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      max-width: 600px;
                      background-color: #fffdf8;
                      border-radius: 18px;
                      overflow: hidden;
                      border: 1px solid #c9a85c;
                    "
                  >

                    <!-- Logo -->
                    <tr>
                      <td
                        align="center"
                        style="
                          padding: 38px 30px 32px;
                          background-color: #032932;
                          border-bottom: 2px solid #c9a85c;
                        "
                      >
                        <img
                          src="cid:tasbirgunj-logo"
                          alt="TasbirGunj"
                          width="230"
                          style="
                            display: block;
                            max-width: 230px;
                            width: 100%;
                            height: auto;
                            margin: 0 auto;
                          "
                        />
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 45px 45px 35px;">

                        <p
                          style="
                            margin: 0 0 10px;
                            font-size: 16px;
                            color: #6d7778;
                          "
                        >
                          Hello there,
                        </p>

                        <h1
                          style="
                            margin: 0 0 20px;
                            font-family: Georgia, 'Times New Roman', serif;
                            font-size: 38px;
                            line-height: 1.15;
                            font-weight: 600;
                            color: #032932;
                          "
                        >
                          Verify your email
                        </h1>

                        <p
                          style="
                            margin: 0;
                            font-size: 16px;
                            line-height: 1.7;
                            color: #667274;
                          "
                        >
                          You're one step closer to joining
                          <strong style="color: #032932;">
                            TasbirGunj
                          </strong>.
                          Use the verification code below to complete your
                          registration.
                        </p>

                        <!-- Verification Code -->
                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="margin-top: 32px;"
                        >
                          <tr>
                            <td
                              align="center"
                              style="
                                background-color: #f7f3e9;
                                border: 1px solid #c9a85c;
                                border-radius: 12px;
                                padding: 25px 15px;
                              "
                            >
                              <div
                                style="
                                  font-size: 32px;
                                  font-weight: 700;
                                  letter-spacing: 9px;
                                  color: #032932;
                                  margin-left: 9px;
                                "
                              >
                                ${verificationcode}
                              </div>
                            </td>
                          </tr>
                        </table>

                        <!-- Expiration -->
                        <p
                          style="
                            margin: 25px 0 0;
                            text-align: center;
                            font-size: 14px;
                            color: #6d7778;
                          "
                        >
                          This code expires in
                          <strong style="color: #032932;">
                            10 minutes
                          </strong>.
                        </p>

                        <!-- Security Notice -->
                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="
                            margin-top: 30px;
                            background-color: #eef3f1;
                            border-left: 3px solid #c9a85c;
                            border-radius: 10px;
                          "
                        >
                          <tr>
                            <td
                              style="
                                padding: 18px 20px;
                                font-size: 13px;
                                line-height: 1.6;
                                color: #5e6c6d;
                              "
                            >
                              <strong style="color: #032932;">
                                Didn't create an account?
                              </strong>
                              <br />
                              You can safely ignore this email.
                            </td>
                          </tr>
                        </table>

                        <!-- Sign Off -->
                        <p
                          style="
                            margin: 35px 0 0;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #707b7c;
                          "
                        >
                          Best regards,<br />

                          <strong style="color: #032932;">
                            The TasbirGunj Team
                          </strong>
                        </p>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td
                        align="center"
                        style="
                          background-color: #032932;
                          padding: 30px 25px;
                          border-top: 1px solid #c9a85c;
                        "
                      >
                        <p
                          style="
                            margin: 0;
                            font-family: Georgia, 'Times New Roman', serif;
                            font-size: 19px;
                            color: #f7f3e9;
                          "
                        >
                          More than just photos.
                        </p>

                        <p
                          style="
                            margin: 6px 0 0;
                            font-size: 13px;
                            letter-spacing: 1px;
                            color: #c9a85c;
                          "
                        >
                          IT'S YOUR STORY.
                        </p>

                        <div
                          style="
                            width: 45px;
                            height: 1px;
                            background-color: #c9a85c;
                            margin: 18px auto 0;
                          "
                        ></div>

                      </td>
                    </tr>

                  </table>

                  <p
                    style="
                      margin: 20px 0 0;
                      font-size: 11px;
                      color: #9aa8a8;
                      text-align: center;
                    "
                  >
                    © ${new Date().getFullYear()} TasbirGunj.
                    All rights reserved.
                  </p>

                </td>
              </tr>
            </table>

          </body>
        </html>
      `,

      attachments: [logoAttachment],
    });

    console.log("Verification email sent:", info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      console.log("Preview URL:", previewUrl);
    }
  } catch (err) {
    console.error("Error while sending verification email:", err);
    throw err;
  }
};

// ===============================
// Password Reset Email
// ===============================

export const passwordResetEmail = async (email, resetUrl) => {
  try {
    const info = await transporter.sendMail({
      from: `"TasbirGunj" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your password — TasbirGunj",

      text: `You requested a password reset for your TasbirGunj account. Use this link to reset your password: ${resetUrl}. This link expires in 15 minutes.`,

      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Reset your password</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #032932;
              font-family: Arial, Helvetica, sans-serif;
              color: #123f42;
            "
          >

            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              border="0"
              style="
                background-color: #032932;
                padding: 40px 15px;
              "
            >
              <tr>
                <td align="center">

                  <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="
                      max-width: 600px;
                      background-color: #fffdf8;
                      border-radius: 18px;
                      overflow: hidden;
                      border: 1px solid #c9a85c;
                    "
                  >

                    <!-- Logo -->
                    <tr>
                      <td
                        align="center"
                        style="
                          padding: 38px 30px 32px;
                          background-color: #032932;
                          border-bottom: 2px solid #c9a85c;
                        "
                      >
                        <img
                          src="cid:tasbirgunj-logo"
                          alt="TasbirGunj"
                          width="230"
                          style="
                            display: block;
                            max-width: 230px;
                            width: 100%;
                            height: auto;
                            margin: 0 auto;
                          "
                        />
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 45px 45px 35px;">

                        <p
                          style="
                            margin: 0 0 10px;
                            font-size: 16px;
                            color: #6d7778;
                          "
                        >
                          Hello there,
                        </p>

                        <h1
                          style="
                            margin: 0 0 20px;
                            font-family: Georgia, 'Times New Roman', serif;
                            font-size: 38px;
                            line-height: 1.15;
                            font-weight: 600;
                            color: #032932;
                          "
                        >
                          Reset your password
                        </h1>

                        <p
                          style="
                            margin: 0;
                            font-size: 16px;
                            line-height: 1.7;
                            color: #667274;
                          "
                        >
                          We received a request to reset the password for
                          your
                          <strong style="color: #032932;">
                            TasbirGunj
                          </strong>
                          account.
                        </p>

                        <p
                          style="
                            margin: 18px 0 0;
                            font-size: 16px;
                            line-height: 1.7;
                            color: #667274;
                          "
                        >
                          Click the button below to create a new password.
                        </p>

                        <!-- Reset Button -->
                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="margin-top: 32px;"
                        >
                          <tr>
                            <td align="center">

                              <a
                                href="${resetUrl}"
                                style="
                                  display: inline-block;
                                  background-color: #032932;
                                  color: #f7f3e9;
                                  text-decoration: none;
                                  font-size: 16px;
                                  font-weight: 600;
                                  padding: 15px 32px;
                                  border-radius: 8px;
                                  border: 1px solid #c9a85c;
                                "
                              >
                                Reset Password
                              </a>

                            </td>
                          </tr>
                        </table>

                        <!-- Expiration -->
                        <p
                          style="
                            margin: 25px 0 0;
                            text-align: center;
                            font-size: 14px;
                            color: #6d7778;
                          "
                        >
                          This link expires in
                          <strong style="color: #032932;">
                            15 minutes
                          </strong>.
                        </p>

                        <!-- Security Notice -->
                        <table
                          width="100%"
                          cellpadding="0"
                          cellspacing="0"
                          border="0"
                          style="
                            margin-top: 30px;
                            background-color: #eef3f1;
                            border-left: 3px solid #c9a85c;
                            border-radius: 10px;
                          "
                        >
                          <tr>
                            <td
                              style="
                                padding: 18px 20px;
                                font-size: 13px;
                                line-height: 1.6;
                                color: #5e6c6d;
                              "
                            >
                              <strong style="color: #032932;">
                                Didn't request a password reset?
                              </strong>
                              <br />
                              You can safely ignore this email.
                              Your password will remain unchanged.
                            </td>
                          </tr>
                        </table>

                        <!-- Sign Off -->
                        <p
                          style="
                            margin: 35px 0 0;
                            font-size: 14px;
                            line-height: 1.6;
                            color: #707b7c;
                          "
                        >
                          Best regards,<br />

                          <strong style="color: #032932;">
                            The TasbirGunj Team
                          </strong>
                        </p>

                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td
                        align="center"
                        style="
                          background-color: #032932;
                          padding: 30px 25px;
                          border-top: 1px solid #c9a85c;
                        "
                      >

                        <p
                          style="
                            margin: 0;
                            font-family: Georgia, 'Times New Roman', serif;
                            font-size: 19px;
                            color: #f7f3e9;
                          "
                        >
                          More than just photos.
                        </p>

                        <p
                          style="
                            margin: 6px 0 0;
                            font-size: 13px;
                            letter-spacing: 1px;
                            color: #c9a85c;
                          "
                        >
                          IT'S YOUR STORY.
                        </p>

                        <div
                          style="
                            width: 45px;
                            height: 1px;
                            background-color: #c9a85c;
                            margin: 18px auto 0;
                          "
                        ></div>

                      </td>
                    </tr>

                  </table>

                  <p
                    style="
                      margin: 20px 0 0;
                      font-size: 11px;
                      color: #9aa8a8;
                      text-align: center;
                    "
                  >
                    © ${new Date().getFullYear()} TasbirGunj.
                    All rights reserved.
                  </p>

                </td>
              </tr>
            </table>

          </body>
        </html>
      `,

      attachments: [logoAttachment],
    });

    console.log("Password reset email sent:", info.messageId);

    const previewUrl = nodemailer.getTestMessageUrl(info);

    if (previewUrl) {
      console.log("Preview URL:", previewUrl);
    }
  } catch (err) {
    console.error("Error while sending password reset email:", err);
    throw err;
  }
};
