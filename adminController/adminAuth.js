export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const ADMIN_EMAIL = "admin@example.com";
    const ADMIN_PASSWORD = "supersecret123";

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        admin: {
          email: ADMIN_EMAIL,
          role: "admin",
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid admin credentials",
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
