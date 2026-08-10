const authService = require("../services/auth.service");

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login(email, password);
    if (!result.ok) return res.status(401).json(result);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Login failed" });
  }
}

async function register(req, res) {
  try {
    const result = await authService.register(req.body || {});
    if (!result.ok) return res.status(400).json(result);
    return res.status(201).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Register failed" });
  }
}

async function me(req, res) {
  try {
    const user = await authService.getUserById(req.user.userId, { includeInactive: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status === "inactive" && user.role !== "ADMIN") {
      return res.status(403).json({
        message: "This account has been deactivated. Contact support.",
      });
    }
    return res.json({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      loggedInAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed" });
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body || {};
    const result = await authService.changePassword(req.user.userId, oldPassword, newPassword);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to change password" });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};
    const result = await authService.forgotPassword(email);
    if (!result.ok) {
      const status =
        /not registered/i.test(result.message || "")
          ? 404
          : /deactivated/i.test(result.message || "")
            ? 403
            : /could not send/i.test(result.message || "")
              ? 503
              : 400;
      return res.status(status).json(result);
    }
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to start password reset" });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password, newPassword } = req.body || {};
    const result = await authService.resetPassword(token, password || newPassword);
    if (!result.ok) return res.status(400).json(result);
    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to reset password" });
  }
}

module.exports = {
  login,
  register,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
};
