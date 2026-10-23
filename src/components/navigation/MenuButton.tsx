import { forwardRef, type MouseEvent } from 'react';
import { useSiteMenu } from './menuContext';

interface MenuButtonProps {
  /** Forces the drawn state (the copy inside the open menu animates from "Menu" to "Close"). */
  expanded?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

/**
 * Opens and closes the site menu from anywhere. The label rolls between "Menu" and
 * "Close" and the two lines turn into a cross; both are transforms only.
 */
export const MenuButton = forwardRef<HTMLButtonElement, MenuButtonProps>(function MenuButton({ expanded, onClick, className = '' }, ref) {
  const menu = useSiteMenu();
  const isExpanded = expanded ?? menu.isOpen;
  return (
    <button
      ref={ref}
      type="button"
      onClick={(event) => (onClick ? onClick(event) : menu.toggle(event.currentTarget))}
      aria-expanded={isExpanded}
      aria-controls="site-menu"
      aria-haspopup="dialog"
      aria-label={isExpanded ? 'Close menu' : menu.unread > 0 ? `Open menu, ${menu.unread} unread messages` : 'Open menu'}
      data-expanded={isExpanded ? 'true' : 'false'}
      className={`site-menu-button ${className}`}
    >
      <span className="site-menu-button-label" aria-hidden="true">
        <span>Menu</span>
        <span>Close</span>
      </span>
      <span className="site-menu-button-icon" aria-hidden="true"><i /><i /></span>
      {menu.unread > 0 && !isExpanded && <span className="site-menu-button-dot" aria-hidden="true" />}
    </button>
  );
});
