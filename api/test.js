module.exports = async (req, res) => {
  try {
    const { getBrowser } = require("../lib/browser");
    res.status(200).json({ status: "browser_loaded_successfully" });
  } catch (err) {
    res.status(500).json({
      error: "require failed",
      message: err.message,
      stack: err.stack,
    });
  }
};
