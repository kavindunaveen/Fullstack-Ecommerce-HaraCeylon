"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderConfirmationEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Create a transporter using SMTP
// These environment variables need to be set in the production environment (.env)
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
/**
 * Sends an order confirmation email to the customer.
 */
const sendOrderConfirmationEmail = async (toEmail, customerName, orderNumber, totalAmount, currency, items) => {
    // If SMTP is not configured, log to console (useful for development)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('\n--- 📧 EMAIL MOCK (SMTP NOT CONFIGURED) ---');
        console.log(`To: ${toEmail}`);
        console.log(`Subject: Order Confirmation - ${orderNumber}`);
        console.log(`Hello ${customerName}, your order for ${currency} ${totalAmount.toFixed(2)} is confirmed!`);
        console.log('-------------------------------------------\n');
        return;
    }
    // Generate HTML table for items
    const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)}</td>
    </tr>
  `).join('');
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1a1a1a; margin: 0;">HARA Ceylon</h1>
        <p style="color: #666; margin-top: 5px; font-size: 14px; letter-spacing: 2px; text-transform: uppercase;">Premium Sri Lankan Heritage</p>
      </div>
      
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <h2 style="margin-top: 0;">Order Confirmed!</h2>
        <p>Hello ${customerName},</p>
        <p>Thank you for your order. We are preparing it for shipment.</p>
        
        <div style="margin: 25px 0; padding: 15px; background-color: #fff; border-left: 4px solid #1a1a1a;">
          <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${orderNumber}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
              <th style="text-align: center; padding: 10px; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="text-align: right; padding: 15px 10px; font-weight: bold;">Total:</td>
              <td style="text-align: right; padding: 15px 10px; font-weight: bold; color: #1a1a1a;">
                ${currency} ${totalAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
        <p>HARA CEYLON LTD. All rights reserved.</p>
        <p>If you have any questions, reply to this email.</p>
      </div>
    </div>
  `;
    try {
        await transporter.sendMail({
            from: `"HARA Ceylon" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: `Your HARA Ceylon Order Confirmed (#${orderNumber})`,
            html,
        });
        console.log(`Order confirmation email sent to ${toEmail}`);
    }
    catch (error) {
        console.error('Failed to send email:', error);
    }
};
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
