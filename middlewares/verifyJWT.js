// middleware/verifyJWT.js
const { CognitoJwtVerifier } = require("aws-jwt-verify");
const dotenv = require("dotenv");
dotenv.config();

// Create the Cognito verifier instance
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID,
  cache: true, // enable in-memory cache
  jwksCache: {
    store: {}, // use an in-memory store
    maxAge: 600000, // optional: 10 minutes
  }
});

// Express middleware to verify JWT
const verifyJWT = (jwtVerifier) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(`[JWT Middleware] Incoming request to ${req.method} ${req.originalUrl}`);
    console.log(`[JWT Middleware] Authorization Header: ${authHeader}`);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided or malformed token" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Token not found" });
    }

    try {
      const verifyPromise = jwtVerifier.verify(token);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Token verification timed out")), 5000)
      );

      const payload = await Promise.race([verifyPromise, timeoutPromise]);
  
     
      req.user = payload; 
      console.log(req.user); 
      next();
    } catch (err) {
      console.error("[JWT Middleware] Verification failed:", err);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};

module.exports = { verifyJWT, jwtVerifier };
