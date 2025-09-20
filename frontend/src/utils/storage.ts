import type { Role } from "@/schemas/user.schema";

const KEY = {
  accessToken: "accessToken",
  role: "role",
  phoneNumber: "phoneNumber",
};

export const storage = {
  get accessToken(): string | null {
    return localStorage.getItem(KEY.accessToken);
  },
  get role(): Role | null {
    const r = localStorage.getItem(KEY.role);
    return r === "student" || r === "instructor" ? r : null;
  },
  get phoneNumber(): string | null {
    return localStorage.getItem(KEY.phoneNumber);
  },

  set accessToken(v: string | null) {
    v
      ? localStorage.setItem(KEY.accessToken, v)
      : localStorage.removeItem(KEY.accessToken);
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
    this.accessToken = data.accessToken;
    this.role = data.role;
    this.phoneNumber = data.phoneNumber ?? null;
  },
  clear() {
    localStorage.removeItem(KEY.accessToken);
    localStorage.removeItem(KEY.role);
    localStorage.removeItem(KEY.phoneNumber);
  },
  isAuthed(): boolean {
    return !!this.accessToken;
  },
};
