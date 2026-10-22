import { Building2, User, Users } from "lucide-react";

/** The four application steps, as the step track names them. */
export const APPLY_STEPS = ["Who & what", "Your story", "Goal & place", "Review"] as const;

/** Who a request is for (fundraisers.beneficiary_type). */
export const BENEFICIARY_OPTIONS = [
  { id: "yourself", icon: User, title: "Myself", description: "Coupons arrive in your own account." },
  { id: "family", icon: Users, title: "My family", description: "You're applying for your household." },
  { id: "organization", icon: Building2, title: "A community group", description: "Coupons go to people your group refers." },
];
