/**
 * Cookie utility functions for client-side cookie management
 */

export const cookies = {
  /**
   * Set a cookie
   */
  set: (name: string, value: string, days: number = 7) => {
    if (typeof document === 'undefined') return;
    
    const maxAge = days * 24 * 60 * 60; // Convert days to seconds
    document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  },

  /**
   * Get a cookie value
   */
  get: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null;
  },

  /**
   * Delete a cookie
   */
  delete: (name: string) => {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },

  /**
   * Check if a cookie exists
   */
  has: (name: string): boolean => {
    return cookies.get(name) !== null;
  },
};

export default cookies;
