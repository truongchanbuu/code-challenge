import type { Role } from "@/schemas/user.schema";

export function RolePill({ role }: { role: Role }) {
  return (
    <div
      className={`badge font-bold text-white ${role === "instructor" ? "badge-primary" : "badge-secondary"}`}
    >
      {role}
    </div>
  );
}
