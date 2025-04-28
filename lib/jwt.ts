// Denna modul hanterar autentisering och auktorisering med hjälp av JSON Web Tokens (JWT) och innehåller funktioner för att generera och verifiera JWT-tokens.
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
