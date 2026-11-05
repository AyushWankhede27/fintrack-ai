import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  try {
    if (scheme !== 'Bearer' || !token) throw new Error('missing');
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};
