const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
// Function to generate a simple random string for verification
const generateRandomToken = () => {
  return require('crypto').randomBytes(20).toString('hex');
};

module.exports = {
  generateToken,
  generateRandomToken
};