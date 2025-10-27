import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "your_secret_key";

/**
 * Tạo token
 */
export const generateToken = (payload: object, expiresIn: string | number = "7d" ) => {
    const options: SignOptions = { expiresIn: expiresIn as any };
return jwt.sign(payload, JWT_SECRET, options);

  };

/**
 * Xác thực token
 */
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
