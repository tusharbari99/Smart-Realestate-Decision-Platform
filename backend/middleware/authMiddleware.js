const jwt = require('jsonwebtoken');

// Verify JWT token and attach user info to request
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = decoded; // { userId, role }
    next();
  });
};

// Restrict access to sellers only
exports.isSeller = (req, res, next) => {
  if (!['seller', 'broker'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Only sellers or broker partners can perform this action.' });
  }
  next();
};

exports.isBuyer = (req, res, next) => {
  if (req.user.role !== 'buyer') {
    return res.status(403).json({ message: 'Only buyers can perform this action.' });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can perform this action.' });
  }
  next();
};
