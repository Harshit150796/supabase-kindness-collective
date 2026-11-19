/** All unfinished monthly gifts remain manageable from the dashboard. */
export const manageableMonthlyGiftStatuses = ['active', 'pending', 'payment_problem', 'paused'] as const;

export function monthlyGiftStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Awaiting first payment';
    case 'payment_problem': return 'Payment needs attention';
    case 'paused': return 'Paused';
    default: return 'Active';
  }
}