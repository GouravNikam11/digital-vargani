export const MANDAL_ROLES = ["ADMIN", "TREASURER", "VOLUNTEER"] as const;

export type MandalRole = (typeof MANDAL_ROLES)[number];

export const PERMISSIONS = {
  mandal: {
    manage: ["ADMIN"],
    view: ["ADMIN", "TREASURER", "VOLUNTEER"],
  },
  branding: {
    manage: ["ADMIN"],
  },
  members: {
    manage: ["ADMIN"],
    view: ["ADMIN", "TREASURER"],
  },
  donors: {
    manage: ["ADMIN", "TREASURER", "VOLUNTEER"],
    view: ["ADMIN", "TREASURER", "VOLUNTEER"],
  },
  receipts: {
    create: ["ADMIN", "TREASURER", "VOLUNTEER"],
    view: ["ADMIN", "TREASURER", "VOLUNTEER"],
    cancel: ["ADMIN", "TREASURER"],
  },
  expenses: {
    create: ["ADMIN", "TREASURER"],
    manage: ["ADMIN", "TREASURER"],
    view: ["ADMIN", "TREASURER"],
  },
  pending: {
    manage: ["ADMIN", "TREASURER"],
    collect: ["ADMIN", "TREASURER", "VOLUNTEER"],
    view: ["ADMIN", "TREASURER", "VOLUNTEER"],
  },
  reports: {
    financial: ["ADMIN", "TREASURER"],
    volunteerOwn: ["ADMIN", "TREASURER", "VOLUNTEER"],
  },
  dashboard: {
    financial: ["ADMIN", "TREASURER"],
    volunteer: ["ADMIN", "TREASURER", "VOLUNTEER"],
  },
  subscription: {
    manage: ["ADMIN"],
    view: ["ADMIN"],
  },
  publicPage: {
    manage: ["ADMIN"],
  },
} as const;

export type PermissionModule = keyof typeof PERMISSIONS;
export type PermissionAction<M extends PermissionModule> = keyof (typeof PERMISSIONS)[M];

export function can(
  role: MandalRole | null | undefined,
  module: PermissionModule,
  action: string,
): boolean {
  if (!role) return false;
  const allowed = (PERMISSIONS[module] as Record<string, readonly MandalRole[]>)[action];
  if (!allowed) return false;
  return allowed.includes(role);
}

export function assertCan(
  role: MandalRole | null | undefined,
  module: PermissionModule,
  action: string,
) {
  if (!can(role, module, action)) {
    throw new Error("FORBIDDEN");
  }
}

export function isAdmin(role: MandalRole | null | undefined) {
  return role === "ADMIN";
}

export function canViewFullFinance(role: MandalRole | null | undefined) {
  return can(role, "reports", "financial");
}
