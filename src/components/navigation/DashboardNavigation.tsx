import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAppSelector } from '@/store';
import Logo from './Logo';
import UserDropdown from './UserDropdown';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface DashboardNavigationProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  onToggleSidebar,
  sidebarCollapsed = false,
}) => {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  return (
    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-white">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100"
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-4 h-4" />
            ) : (
              <ChevronLeftIcon className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Logo (only show when sidebar is collapsed) */}
        {sidebarCollapsed && <Logo />}
      </div>

      {/* Right side */}
      <div className="flex items-center space-x-4">
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-2">
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* User Dropdown */}
            <UserDropdown />
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/signin">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNavigation;
