export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: 'donor' | 'recipient' | 'partner';
  roleLabel: string;
  location: string;
  image: string;
  verified: boolean;
}

export const testimonials: Testimonial[] = [
  {
    id: '1',
    quote: "I've donated to many platforms, but this is the first time I can see exactly where my money goes. Knowing my $50 became 100 meals for a family in need is incredibly fulfilling.",
    name: "Sarah Chen",
    role: 'donor',
    roleLabel: 'Verified Donor',
    location: 'San Francisco, CA',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    verified: true
  },
  {
    id: '2',
    quote: "When my family was struggling, these coupons helped us get essentials with dignity. I didn't have to stand in a food line - I could shop like everyone else.",
    name: "Maria G.",
    role: 'recipient',
    roleLabel: 'Verified Recipient',
    location: 'Houston, TX',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    verified: true
  },
  {
    id: '3',
    quote: "As a DoorDash restaurant partner, we love that donations through our platform help feed families while supporting local businesses. It's a win-win-win.",
    name: "James Wilson",
    role: 'partner',
    roleLabel: 'Partner - DoorDash',
    location: 'New York, NY',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    verified: true
  },
  {
    id: '4',
    quote: "I set up a monthly donation and receive updates showing exactly which families benefited. The transparency is what keeps me giving.",
    name: "Michael Torres",
    role: 'donor',
    roleLabel: 'Monthly Donor',
    location: 'Austin, TX',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    verified: true
  }
];
