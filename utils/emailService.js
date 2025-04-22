import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export const emailTemplates = {
  verification: (token) => ({
    subject: 'Verify Your Email',
    html: `<a href="${process.env.CLIENT_URL}/verify-email?token=${token}">Verify Email</a>`
  }),
  passwordReset: (token) => ({
    subject: 'Password Reset Request',
    html: `<a href="${process.env.CLIENT_URL}/reset-password?token=${token}">Reset Password</a>`
  })
};