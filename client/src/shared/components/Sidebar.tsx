'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  FolderIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  PlayIcon,
  ArrowUpTrayIcon,
  ChartBarIcon,
  BugAntIcon,
  CheckCircleIcon,
  UserGroupIcon,
  BeakerIcon,
  DocumentCheckIcon,
  UsersIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/shared/stores/authStore';
import { UserRole } from '@/shared/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const projectIdMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectIdMatch?.[1];
  const isDeveloper = user?.role === UserRole.DEVELOPER;

  const topNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <HomeIcon className="h-5 w-5" /> },
    { href: '/projects', label: 'Projects', icon: <FolderIcon className="h-5 w-5" /> },
  ];

  const projectNavItems: NavItem[] = projectId
    ? isDeveloper
      ? [
          {
            href: `/projects/${projectId}/defects`,
            label: 'Defect Log',
            icon: <BugAntIcon className="h-5 w-5" />,
          },
        ]
      : [
          {
            href: `/projects/${projectId}/overview`,
            label: 'Overview',
            icon: <Squares2X2Icon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/reports`,
            label: 'Reports',
            icon: <ChartBarIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/cases`,
            label: 'Test Cases',
            icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/runs`,
            label: 'Test Runs',
            icon: <PlayIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/plans`,
            label: 'Test Plans',
            icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/defects`,
            label: 'Defect Log',
            icon: <BugAntIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/requirements`,
            label: 'Requirements',
            icon: <DocumentCheckIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/checklist`,
            label: 'Daily Checklist',
            icon: <CheckCircleIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/uat`,
            label: 'UAT',
            icon: <UserGroupIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/adhoc`,
            label: 'Ad-Hoc Cases',
            icon: <BeakerIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/upload`,
            label: 'Import',
            icon: <ArrowUpTrayIcon className="h-5 w-5" />,
          },
          {
            href: `/projects/${projectId}/settings`,
            label: 'Settings',
            icon: <Cog6ToothIcon className="h-5 w-5" />,
          },
        ]
    : [];

  const isActive = (href: string) => {
    if (href === '/projects') return pathname === '/projects';
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        className={clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150',
          active
            ? 'bg-primary-500 text-white shadow-sm'
            : 'text-gray-900 hover:bg-primary-50 hover:text-primary-500'
        )}
      >
        <span className={clsx('shrink-0', active ? 'text-white' : 'text-gray-500')}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-white border-r border-gray-200 h-screen print:hidden shadow-[2px_0_8px_0_rgba(0,0,0,0.04)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 shrink-0">
        <div className="h-10 w-10 rounded-xl bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
          <Image src="/qa-logo.png" alt="QA" width={36} height={36} className="object-contain" />
        </div>
        <div className="leading-tight min-w-0">
          <p className="text-[15px] font-bold text-primary-500 leading-tight truncate">Quality Intelligence</p>
          <p className="text-[11px] text-gray-500 leading-tight mt-0.5">Test Management System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        {topNavItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {projectNavItems.length > 0 && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Project
            </p>
            <div className="space-y-0.5">
              {projectNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        )}

        {user?.role === 'ADMIN' && (
          <div className="pt-4">
            <p className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Admin
            </p>
            <div className="space-y-0.5">
              <NavLink
                item={{
                  href: '/admin/users',
                  label: 'User Management',
                  icon: <UsersIcon className="h-5 w-5" />,
                }}
              />
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
