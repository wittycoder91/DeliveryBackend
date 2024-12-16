const jwt = require("jsonwebtoken");

const getUserIdFromToken = (token) => {
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided." });
  }
  const secretKey = process.env.JWT_SECRET;
  const decoded = jwt.verify(token, secretKey);
  return decoded._id;
};

module.exports = { getUserIdFromToken };
