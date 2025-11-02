'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  className?: string;
  customItems?: BreadcrumbItem[];
}

export function Breadcrumbs({ className, customItems }: BreadcrumbsProps) {
  const pathname = usePathname();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' },
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Don't add href to the last item (current page)
      const href = index === segments.length - 1 ? undefined : currentPath;
      
      breadcrumbs.push({ label, href });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index === 0 ? (
            <Link
              href={item.href || '#'}
              className={cn(
                'flex items-center hover:text-foreground transition-colors',
                !item.href && 'text-foreground cursor-default'
              )}
            >
              <Home className="h-4 w-4" />
            </Link>
          ) : (
            <span
              className={cn(
                'hover:text-foreground transition-colors',
                !item.href && 'text-foreground cursor-default'
              )}
            >
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                item.label
              )}
            </span>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-1" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumbs;

