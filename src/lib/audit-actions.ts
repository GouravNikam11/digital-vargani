export const AUDIT_ACTIONS = {
  RECEIPT_CREATED: "Receipt Created",
  RECEIPT_UPDATED: "Receipt Updated",
  RECEIPT_CANCELLED: "Receipt Cancelled",
  EXPENSE_CREATED: "Expense Created",
  EXPENSE_UPDATED: "Expense Updated",
  EXPENSE_DELETED: "Expense Deleted",
  DONOR_CREATED: "Donor Created",
  DONOR_UPDATED: "Donor Updated",
  MEMBER_ADDED: "Member Added",
  MEMBER_REMOVED: "Member Removed",
  SUBSCRIPTION_CHANGED: "Subscription Changed",
  MANDAL_CREATED: "Mandal Created",
  MANDAL_SUSPENDED: "Mandal Suspended",
  MANDAL_ACTIVATED: "Mandal Activated",
  PENDING_CREATED: "Pending Collection Created",
  PENDING_COLLECTED: "Pending Collection Collected",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];
