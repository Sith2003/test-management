'use client';

import Link from 'next/link';
import {
  ClipboardDocumentListIcon,
  PlayIcon,
  TrashIcon,
  UsersIcon,
  UserPlusIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import type { Project } from '@/shared/types';

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
  canManageMembers?: boolean;
  onAssignDeveloper?: (project: Project) => void;
}

const LOGO_MAP: { keywords: string[]; src: string; alt: string }[] = [
  { keywords: ['fuel'], src: '/dtop-fuel logo.png', alt: 'DTOP Fuel' },
  { keywords: ['move'], src: '/dtop-move logo.png', alt: 'DTOP Move' },
  { keywords: ['iof'],  src: '/iof logo.png',       alt: 'IOF' },
];

function getProjectLogo(key: string, name: string) {
  const search = `${key} ${name}`.toLowerCase();
  return LOGO_MAP.find(({ keywords }) => keywords.some((kw) => search.includes(kw))) ?? null;
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

export function ProjectCard({ project, onDelete, canManageMembers, onAssignDeveloper }: ProjectCardProps) {
  const logo = project.logoUrl
    ? { src: project.logoUrl, alt: project.name }
    : getProjectLogo(project.key, project.name);

  const testCases = project._count?.testCases ?? 0;
  const testRuns  = project._count?.testRuns  ?? 0;
  const members   = (project._count as Record<string, number> | undefined)?.members ?? 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-gray-200 hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100 hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">

      {/* Top-right action buttons */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
        {canManageMembers && (
          <button
            onClick={() => onAssignDeveloper?.(project)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="Assign developer"
            title="Assign Developer"
          >
            <UserPlusIcon className="h-4 w-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(project.id)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Delete project"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-4">

        {/* Header: icon tile + name + key */}
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 flex items-center justify-center overflow-hidden">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo.src} alt={logo.alt} width={44} height={44} className="object-contain" />
            ) : (
              <span className="text-primary-500 font-bold text-2xl tracking-wide select-none">
                {getInitials(project.name)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-semibold text-gray-900 text-[15px] leading-snug truncate pr-6">
              {project.name}
            </h3>
            <span className="inline-block mt-1.5 text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-primary-50 text-primary-600 ring-1 ring-primary-200">
              {project.key}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {project.description
            ? <span className="text-gray-500">{project.description}</span>
            : <span className="text-gray-300 italic">No description</span>
          }
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ClipboardDocumentListIcon, value: testCases, label: 'Cases'   },
            { icon: PlayIcon,                  value: testRuns,  label: 'Runs'    },
            { icon: UsersIcon,                 value: members,   label: 'Members' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 px-1 border border-gray-100">
              <Icon className="h-4 w-4 mb-1 text-primary-400" />
              <span className="font-bold text-gray-800 text-sm leading-none">{value}</span>
              <span className="text-[10px] text-gray-400 mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/projects/${project.id}/overview`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl text-white bg-primary-500 hover:bg-primary-600 transition-colors"
          >
            <Squares2X2Icon className="h-3.5 w-3.5" />
            View Details
          </Link>
          <Link
            href={`/projects/${project.id}/cases`}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
            View Cases
          </Link>
        </div>

      </div>
    </div>
  );
}
