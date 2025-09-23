// utils/generateOTP.js
export const generateOTP = () => {
  // 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Expiry time (10 minutes from now)
  const expiry = new Date(Date.now() + 10 * 60 * 1000);

  return { otp, expiry };
};
