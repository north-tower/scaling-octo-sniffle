'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/store/auth';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  LogOut,
  X,
  User,
  School,
  Receipt,
  Calendar,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Students',
    href: '/admin/students',
    icon: Users,
    children: [
      { title: 'All Students', href: '/admin/students', icon: Users },
      // { title: 'Add Student', href: '/admin/students/add', icon: User },
      { title: 'Import Students', href: '/admin/students/import', icon: ClipboardList },
    ],
  },
  {
    title: 'Fee Management',
    href: '/admin/fees',
    icon: CreditCard,
    children: [
      { title: 'Fee Structures', href: '/admin/fees', icon: BookOpen },
      { title: 'Assign Fees', href: '/admin/fees/assign', icon: ClipboardList },
      { title: 'Outstanding Fees', href: '/admin/fees/outstanding', icon: Calendar },
    ],
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: Receipt,
    children: [
      { title: 'All Payments', href: '/admin/payments', icon: Receipt },
      { title: 'Record Payment', href: '/admin/payments/record', icon: CreditCard },
      { title: 'Payment History', href: '/admin/payments/history', icon: Calendar },
    ],
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
    children: [
      { title: 'Fee Collection', href: '/admin/reports/collection', icon: BarChart3 },
      { title: 'Outstanding Report', href: '/admin/reports/outstanding', icon: Calendar },
      { title: 'Defaulters Report', href: '/admin/reports/defaulters', icon: FileText },
    ],
  },
  {
    title: 'Classes',
    href: '/admin/classes',
    icon: School,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

const studentNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/student/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Fees',
    href: '/student/fees',
    icon: CreditCard,
  },
  {
    title: 'Payment History',
    href: '/student/payments',
    icon: Receipt,
  },
  {
    title: 'Receipts',
    href: '/student/receipts',
    icon: FileText,
  },
];

const parentNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/parent/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Children',
    href: '/parent/children',
    icon: Users,
  },
  {
    title: 'Fee Overview',
    href: '/parent/fees',
    icon: CreditCard,
  },
  {
    title: 'Payment History',
    href: '/parent/payments',
    icon: Receipt,
  },
];

const accountantNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Payments',
    href: '/admin/payments',
    icon: Receipt,
  },
  {
    title: 'Reports',
    href: '/admin/reports',
    icon: BarChart3,
  },
];

export function Sidebar({ className, isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getNavItems = (): NavItem[] => {
    if (!user) return [];
    
    switch (user.role) {
      case 'admin':
        return adminNavItems;
      case 'student':
        return studentNavItems;
      case 'parent':
        return parentNavItems;
      case 'accountant':
        return accountantNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const NavItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;
    const [isExpanded, setIsExpanded] = React.useState(
      hasChildren && item.children?.some(child => pathname === child.href)
    );

    const handleClick = () => {
      if (hasChildren) {
        setIsExpanded(!isExpanded);
      } else if (isMobile && onClose) {
        onClose();
      }
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center">
          <Link
            href={item.href}
            onClick={handleClick}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent text-accent-foreground',
              level > 0 && 'ml-4'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4 space-y-1">
            {item.children?.map((child) => (
              <NavItem key={child.href} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex h-full flex-col bg-background border-r', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <School className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Fee Management</h2>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        {isMobile && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;

