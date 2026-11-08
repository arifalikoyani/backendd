module.exports = (req, res) => {
  res.status(200).json({
    status: "ok",
    node: process.version,
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
};
