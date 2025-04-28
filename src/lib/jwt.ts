import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "your-secret-key";

export const generateToken = (user: {
  id: number;
  email: string;
  role: string;
}) => {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, SECRET, {
    expiresIn: "1h",
  });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};
// This function generates a JWT token for the user with the given id, email, and role.
// The token is signed with a secret key and expires in 1 hour.
