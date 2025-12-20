const ADMIN_SESSION_KEY = "md_admin_session";

const getAdminEmail = () => import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
const getAdminPassword = () => import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;

export const isAdminConfigured = () => {
  return Boolean(getAdminEmail() && getAdminPassword());
};

export const authenticateAdmin = (email: string, password: string) => {
  const adminEmail = getAdminEmail();
  const adminPassword = getAdminPassword();
  if (!adminEmail || !adminPassword) {
    return false;
  }
  return email === adminEmail && password === adminPassword;
};

export const setAdminSession = () => {
  localStorage.setItem(ADMIN_SESSION_KEY, "true");
};

export const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

export const isAdminAuthenticated = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem(ADMIN_SESSION_KEY) === "true";
};
