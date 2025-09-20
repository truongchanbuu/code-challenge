import type { Role } from "@/schemas/user.schema";

const KEY = {
  token: "token",
  role: "role",
  phoneNumber: "phoneNumber",
};

export const storage = {
  get token(): string | null {
    return localStorage.getItem(KEY.token);
  },
  get role(): Role | null {
    const r = localStorage.getItem(KEY.role);
    return r === "student" || r === "instructor" ? r : null;
  },
  get phoneNumber(): string | null {
    return localStorage.getItem(KEY.phoneNumber);
  },

  set token(v: string | null) {
    v ? localStorage.setItem(KEY.token, v) : localStorage.removeItem(KEY.token);
  },
  set role(v: Role | null) {
    v ? localStorage.setItem(KEY.role, v) : localStorage.removeItem(KEY.role);
  },
  set phoneNumber(v: string | null | undefined) {
    v
      ? localStorage.setItem(KEY.phoneNumber, v)
      : localStorage.removeItem(KEY.phoneNumber);
  },

  saveLogin(data: {
    role: Role;
    phoneNumber?: string | null;
    accessToken: string;
  }) {
    this.token = data.accessToken;
    this.role = data.role;
    this.phoneNumber = data.phoneNumber ?? null;
  },
  clear() {
    localStorage.removeItem(KEY.token);
    localStorage.removeItem(KEY.role);
    localStorage.removeItem(KEY.phoneNumber);
  },
  isAuthed(): boolean {
    return !!this.token;
  },
};
