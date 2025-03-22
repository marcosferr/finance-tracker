import NextAuth from "next-auth";
import { authOptions } from "@/auth";

// Create the handler
const handler = NextAuth(authOptions);

// Export the handler for GET and POST requests
export { handler as GET, handler as POST };
