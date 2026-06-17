import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ No token found in request');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    console.log('✅ Token decoded:', decoded);

    req.user = { 
      id: decoded.id || decoded._id,
      email: decoded.email
    };

    console.log('🔐 User ID from token:', req.user.id);
    next();
  } catch (err) {
    console.error('❌ Invalid token:', err.message);
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

export default authenticateToken;