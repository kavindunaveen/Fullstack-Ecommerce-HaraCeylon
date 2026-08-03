import nodemailer from 'nodemailer';

// Create a transporter using SMTP
// These environment variables need to be set in the production environment (.env)
let transporter: nodemailer.Transporter | null = null;
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Sends an order confirmation email to the customer.
 */
export const sendOrderConfirmationEmail = async (
  toEmail: string,
  customerName: string,
  orderNumber: string,
  totalAmount: number,
  currency: string,
  items: Array<{ name: string; quantity: number; price: number }>
) => {
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
    await getTransporter().sendMail({
      from: `"HARA Ceylon" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Your HARA Ceylon Order Confirmed (#${orderNumber})`,
      html,
    });
    console.log(`Order confirmation email sent to ${toEmail}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

/**
 * Sends a password reset email.
 */
export const sendPasswordResetEmail = async (toEmail: string, resetUrl: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n--- 📧 EMAIL MOCK (SMTP NOT CONFIGURED) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Password Reset Request`);
    console.log(`Click here to reset your password: ${resetUrl}`);
    console.log('-------------------------------------------\n');
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1a1a1a; margin: 0;">HARA Ceylon</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <h2>Password Reset Request</h2>
        <p>You recently requested to reset your password for your HARA Ceylon account.</p>
        <p>Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1a1a1a; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 24 hours.</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"HARA Ceylon" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Password Reset Request`,
      html,
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};

/**
 * Sends an order status update email.
 */
export const sendOrderStatusEmail = async (toEmail: string, customerName: string, orderNumber: string, status: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n--- 📧 EMAIL MOCK (SMTP NOT CONFIGURED) ---');
    console.log(`To: ${toEmail}`);
    console.log(`Subject: Order Update - ${orderNumber}`);
    console.log(`Hello ${customerName}, your order is now ${status}!`);
    console.log('-------------------------------------------\n');
    return;
  }

  const isShipped = status.toLowerCase() === 'shipped';
  const isDelivered = status.toLowerCase() === 'delivered';
  
  if (!isShipped && !isDelivered) return; // Only email for these statuses

  const statusText = isShipped ? "has been shipped and is on its way" : "has been delivered";
  const titleText = isShipped ? "Your Order is on the Way!" : "Your Order has Arrived!";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1a1a1a; margin: 0;">HARA Ceylon</h1>
      </div>
      <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <h2>${titleText}</h2>
        <p>Hello ${customerName},</p>
        <p>Great news! Your order <strong>#${orderNumber}</strong> ${statusText}.</p>
        
        <div style="margin: 30px 0; padding: 15px; background-color: #fff; border-left: 4px solid #1a1a1a;">
          <p style="margin: 0; font-size: 14px; color: #666;">Order Status</p>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; text-transform: capitalize;">${status}</p>
        </div>
        
        <p>Thank you for shopping with HARA Ceylon. If you have any questions, simply reply to this email.</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"HARA Ceylon" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Order Update: #${orderNumber} is ${status}`,
      html,
    });
    console.log(`Order status email sent to ${toEmail}`);
  } catch (error) {
    console.error('Failed to send order status email:', error);
  }
};

/**
 * Sends a notification to the admin when a contact form is submitted.
 */
export const sendContactFormEmail = async (name: string, email: string, message: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n--- 📧 EMAIL MOCK (SMTP NOT CONFIGURED) ---');
    console.log(`[Contact Form] From: ${name} <${email}>: ${message}`);
    console.log('-------------------------------------------\n');
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #1a1a1a;">New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #1a1a1a;">
        ${message.replace(/\n/g, '<br/>')}
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"HARA Ceylon System" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to the store owner
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send contact form email:', error);
  }
};

/**
 * Sends a notification when someone subscribes to the newsletter.
 */
export const sendNewsletterSubscriptionEmail = async (email: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n--- 📧 EMAIL MOCK (SMTP NOT CONFIGURED) ---');
    console.log(`[Newsletter] Subscribed: ${email}`);
    console.log('-------------------------------------------\n');
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #1a1a1a;">New Newsletter Subscriber! 🎉</h2>
      <p>A new user has subscribed to the newsletter:</p>
      <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #1a1a1a;">
        <strong>Email:</strong> ${email}
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"HARA Ceylon System" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to the store owner
      subject: `New Newsletter Subscriber: ${email}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send newsletter email:', error);
  }
};

export const sendVerificationEmail = async (toEmail: string, token: string) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n--- 📧 EMAIL MOCK (SMTP NOT CONFIGURED) ---');
    console.log(`To: ${toEmail}`);
    console.log('Subject: Verify your email');
    console.log(`Token: ${token}`);
    console.log('-------------------------------------------\n');
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyLink = `${frontendUrl}/account/verify?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2>Verify your Email Address</h2>
      <p>Thank you for registering with HARA Ceylon. Please click the button below to verify your email address.</p>
      <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 20px 0;">Verify Email</a>
      <p>If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: \`"HARA Ceylon" <\${process.env.SMTP_USER}>\`,
      to: toEmail,
      subject: 'Verify your HARA Ceylon account',
      html,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }
};
