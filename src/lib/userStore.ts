import { PlanId } from "@/data/plans";

export type UserRole = "admin" | "user";
export type UserStatus = "active" | "suspended";
export type BillingStatus = "free" | "checkout" | "active";

export interface PaymentRecord {
  id: string;
  date: string;
  amount: string;
  status: "Pago" | "Pendente";
  plan: string;
  method: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  company?: string;
  plan: PlanId;
  role: UserRole;
  status: UserStatus;
  billingStatus: BillingStatus;
  createdAt: string;
  lastLogin: string;
  usage: {
    sent: number;
    limit: number;
  };
  payments: PaymentRecord[];
}

const USERS_KEY = "md_users";
const CURRENT_USER_KEY = "md_current_user";

const createId = () => `usr_${Math.random().toString(36).slice(2, 10)}`;

const defaultUsers: UserRecord[] = [
  {
    id: "usr_admin",
    name: "Admin MediaDrop",
    email: "admin@mediadrop.com",
    company: "MediaDrop TG",
    plan: "agency",
    role: "admin",
    status: "active",
    billingStatus: "active",
    createdAt: "2024-10-10T10:00:00.000Z",
    lastLogin: "2024-12-10T12:30:00.000Z",
    usage: { sent: 9800, limit: 20000 },
    payments: [
      {
        id: "pay_admin_01",
        date: "15/12/2024",
        amount: "R$499,00",
        status: "Pago",
        plan: "Agency",
        method: "Cartão •••• 8451",
      },
    ],
  },
  {
    id: "usr_001",
    name: "Larissa Fernandes",
    email: "larissa@estudiofoco.com",
    company: "Estúdio Foco",
    plan: "pro",
    role: "user",
    status: "active",
    billingStatus: "active",
    createdAt: "2024-11-02T09:12:00.000Z",
    lastLogin: "2024-12-12T08:40:00.000Z",
    usage: { sent: 2847, limit: 10000 },
    payments: [
      {
        id: "pay_001",
        date: "15/12/2024",
        amount: "R$149,00",
        status: "Pago",
        plan: "Pro",
        method: "Pix",
      },
      {
        id: "pay_002",
        date: "15/11/2024",
        amount: "R$149,00",
        status: "Pago",
        plan: "Pro",
        method: "Cartão •••• 9210",
      },
    ],
  },
  {
    id: "usr_002",
    name: "Rafael Cunha",
    email: "rafael@agencianova.com",
    company: "Agência Nova",
    plan: "basic",
    role: "user",
    status: "active",
    billingStatus: "active",
    createdAt: "2024-11-18T15:50:00.000Z",
    lastLogin: "2024-12-11T17:05:00.000Z",
    usage: { sent: 742, limit: 1000 },
    payments: [
      {
        id: "pay_003",
        date: "15/12/2024",
        amount: "R$49,00",
        status: "Pago",
        plan: "Basic",
        method: "Boleto",
      },
    ],
  },
  {
    id: "usr_003",
    name: "Bruna Melo",
    email: "bruna@dropsocial.io",
    company: "Drop Social",
    plan: "free",
    role: "user",
    status: "suspended",
    billingStatus: "free",
    createdAt: "2024-12-01T11:25:00.000Z",
    lastLogin: "2024-12-08T09:10:00.000Z",
    usage: { sent: 98, limit: 100 },
    payments: [],
  },
];

const readUsers = () => {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as UserRecord[];
  } catch {
    return null;
  }
};

export const seedUsers = () => {
  if (typeof window === "undefined") {
    return;
  }
  const stored = readUsers();
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }
};

export const getUsers = (): UserRecord[] => {
  if (typeof window === "undefined") {
    return defaultUsers;
  }
  const stored = readUsers();
  return stored ?? defaultUsers;
};

export const saveUsers = (users: UserRecord[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const addUser = (user: Omit<UserRecord, "id">) => {
  const users = getUsers();
  const newUser: UserRecord = { ...user, id: createId() };
  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const updateUser = (userId: string, updates: Partial<UserRecord>) => {
  const users = getUsers();
  const updated = users.map((user) =>
    user.id === userId ? { ...user, ...updates } : user
  );
  saveUsers(updated);
  return updated.find((user) => user.id === userId) ?? null;
};

export const setCurrentUser = (userId: string) => {
  localStorage.setItem(CURRENT_USER_KEY, userId);
};

export const clearCurrentUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const getCurrentUser = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const userId = localStorage.getItem(CURRENT_USER_KEY);
  if (!userId) {
    return null;
  }
  return getUsers().find((user) => user.id === userId) ?? null;
};

export const recordPayment = (userId: string, payment: PaymentRecord, plan: PlanId) => {
  const user = getUsers().find((entry) => entry.id === userId);
  if (!user) {
    return null;
  }
  const updatedPayments = [payment, ...user.payments];
  return updateUser(userId, { plan, payments: updatedPayments });
};

export const findOrCreateUserByEmail = (email: string, fallbackName: string) => {
  const users = getUsers();
  const match = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  if (match) {
    return match;
  }
  const isAdmin = email.toLowerCase() === "admin@mediadrop.com";
  return addUser({
    name: fallbackName || "Novo Usuário",
    email,
    company: "",
    plan: "free",
    role: isAdmin ? "admin" : "user",
    status: "active",
    billingStatus: "free",
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    usage: { sent: 0, limit: 100 },
    payments: [],
  });
};

export const isUserOnline = (user: UserRecord) => {
  const lastLogin = new Date(user.lastLogin).getTime();
  const now = Date.now();
  const diffMinutes = (now - lastLogin) / (1000 * 60);
  return diffMinutes <= 30;
};
