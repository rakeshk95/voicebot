/**
 * Safely parse JSON from localStorage
 * Handles cases where the stored value might be the string "undefined"
 */
export const safeParseJSON = (key: string, defaultValue: any = null) => {
  try {
    const storedValue = localStorage.getItem(key);
    
    // Handle cases where the stored value is the string "undefined"
    if (storedValue === 'undefined' || storedValue === null) {
      return defaultValue;
    }
    
    return JSON.parse(storedValue);
  } catch (error) {
    console.error(`Error parsing JSON for key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Safely get user data from localStorage
 */
export const getUserData = () => {
  return safeParseJSON('userData', {});
};

/**
 * Safely get auth token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
}; 