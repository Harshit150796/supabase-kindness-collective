export interface PublicHeroDonation {
  id: string;
  display_name: string | null;
  amount: number;
}

/** Never invent activity or derive a person's public identity from an email. */
export function heroDonations(rows: PublicHeroDonation[] | null) {
  return (rows ?? []).filter((row) => Number.isFinite(Number(row.amount)) && Number(row.amount) > 0).map((row) => ({
    id: row.id,
    donorName: row.display_name?.trim() || 'Anonymous Donor',
    amount: Number(row.amount),
  }));
}