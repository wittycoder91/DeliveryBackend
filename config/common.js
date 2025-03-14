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

const formatTime = (seconds) => {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return `${hrs}:${mins}:${secs}`;
};

const getCurrentDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return (formattedDate = `${year}-${month}-${day}`);
};

module.exports = {
  getUserIdFromToken,
  formatTime,
  getCurrentDate,
};
