import { Link, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSignOut } from '@/hooks/useSignOut';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSiteMenu } from './menuContext';
import { accountLinksFor, displayName, isActivePath } from './siteLinks';

const itemClass = 'flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-3 text-sm text-foreground focus:bg-secondary focus:text-foreground data-[highlighted]:bg-secondary';

/**
 * The signed-in person's quick menu in the header (wider screens; phones use the
 * account panel in the full-screen menu). Non-modal, so it never locks the page.
 */
export function AccountMenu({ className = '' }: { className?: string }) {
  const { user, roles } = useAuth();
  const { unread } = useSiteMenu();
  const signOut = useSignOut();
  const { pathname } = useLocation();
  if (!user) return null;
  const name = displayName(user);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={unread > 0 ? `Your account, ${unread} unread messages` : 'Your account'}
          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full outline-none transition-transform hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-muted ${className}`}
        >
          <span aria-hidden="true" className="nav-account-badge flex h-10 w-10 items-center justify-center rounded-full bg-primary-20 text-sm font-semibold text-primary-foreground">
            {name.charAt(0).toUpperCase()}
          </span>
          {unread > 0 && <span aria-hidden="true" className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-72 rounded-xl p-2">
        <div className="px-3 pb-3 pt-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </div>
        <DropdownMenuSeparator />
        {accountLinksFor(roles).map((link) => (
          <DropdownMenuItem key={link.to} asChild className={itemClass}>
            <Link to={link.to} aria-current={isActivePath(pathname, link.to) ? 'page' : undefined}>
              <link.icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1">{link.label}</span>
              {link.unread && unread > 0 && <span className="text-xs font-semibold tabular-nums text-primary">{unread} new</span>}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className={itemClass} onSelect={() => { void signOut(); }}>
          <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
