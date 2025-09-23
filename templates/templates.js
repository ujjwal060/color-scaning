// registrationOtpTemp.js

export const registrationOtpTemp = (name, otp) => {
  const subject = "Verify your Email - Color Scanning";

  const body = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Welcome to Color Scanning, ${name}!</h2>
      <p>Thank you for signing up. Please verify your email address using the OTP below:</p>
      
      <h1 style="color: #2e86de; letter-spacing: 3px;">${otp}</h1>
      
      <p>This OTP is valid for <b>10 minutes</b>. Please do not share it with anyone.</p>
      
      <hr style="margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">
        If you didn’t sign up for a Color Scanning account, you can safely ignore this email.
      </p>
    </div>
  `;

  return { subject, body };
};
// resetPasswordTemp.js

export const resetPasswordTemp = (name, otp) => {
  const subject = "Password Reset Request - Color Scanning";

  const body = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Hello ${name},</h2>
      <p>We received a request to reset your password. Use the OTP below to proceed:</p>
      
      <h1 style="color: #e74c3c; letter-spacing: 3px;">${otp}</h1>
      
      <p>This OTP is valid for <b>10 minutes</b>. If you did not request this, please ignore this email.</p>
      
      <hr style="margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">
        For security reasons, never share this OTP with anyone.
      </p>
    </div>
  `;

  return { subject, body };
};

// verificationSuccessTemp.js

export const verificationSuccessTemp = (name) => {
  const subject = "Welcome to Color Scanning 🎉 - Email Verified Successfully";

  const body = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Hello ${name},</h2>
      <p>Congratulations! Your email has been successfully verified.</p>

      <p>You can now log in and start exploring all the features of <b>Color Scanning</b>.</p>

      <p style="margin-top: 20px;">Cheers, <br/> The Color Scanning Team</p>

      <hr style="margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">
        If this wasn’t you, please contact our support team immediately.
      </p>
    </div>
  `;

  return { subject, body };
};

