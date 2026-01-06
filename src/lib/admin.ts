import { auth } from "@/auth";

/**
 * Check if the current user is an admin based on ADMIN_EMAILS environment variable
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return false;
    }

    const adminEmails = process.env.ADMIN_EMAILS;
    
    if (!adminEmails) {
      console.warn("ADMIN_EMAILS environment variable is not set");
      return false;
    }

    // Split by comma and trim whitespace, then check if user email is in the list
    const adminEmailList = adminEmails
      .split(',')
      .map(email => email.trim().toLowerCase());
    
    return adminEmailList.includes(session.user.email.toLowerCase());
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Check if a specific email is an admin
 */
export function isAdminEmail(email: string): boolean {
  try {
    const adminEmails = process.env.ADMIN_EMAILS;
    
    if (!adminEmails) {
      console.warn("ADMIN_EMAILS environment variable is not set");
      return false;
    }

    // Split by comma and trim whitespace, then check if email is in the list
    const adminEmailList = adminEmails
      .split(',')
      .map(adminEmail => adminEmail.trim().toLowerCase());
    
    return adminEmailList.includes(email.toLowerCase());
  } catch (error) {
    console.error("Error checking admin email:", error);
    return false;
  }
}

/**
 * Middleware helper to check admin access for API routes
 */
export async function checkAdminAccess(): Promise<{ isAdmin: boolean; userEmail?: string }> {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return { isAdmin: false };
    }

    const userEmail = session.user.email;
    const adminStatus = isAdminEmail(userEmail);
    
    return { 
      isAdmin: adminStatus, 
      userEmail 
    };
  } catch (error) {
    console.error("Error checking admin access:", error);
    return { isAdmin: false };
  }
}