// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", // you can also use outlook, yahoo, etc.
      auth: {
        user: process.env.SMTP_USER, // ✅ set in .env
        pass: process.env.SMTP_PASS, // ✅ app password or SMTP password
      },
    });

    const mailOptions = {
      from: `"Picasso Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
