'use client';

import type { DashboardFilters, MonitoredFolder } from '@/lib/api';
import Link from 'next/link';
import { useRef } from 'react';

type StatusOption = {
  label: string;
  value: string;
};

type DocumentFiltersProps = {
  filters: DashboardFilters;
  folders: MonitoredFolder[];
  statusOptions: StatusOption[];
};

export function DocumentFilters({
  filters,
  folders,
  statusOptions,
}: DocumentFiltersProps) {
  const formRef = useRef<HTMLFormElement>(null);

  function submitFilters() {
    formRef.current?.requestSubmit();
  }

  return (
    <form action="/" className="filter-row" ref={formRef}>
      {filters.fileType ? (
        <input name="fileType" type="hidden" value={filters.fileType} />
      ) : null}
      {filters.q ? <input name="q" type="hidden" value={filters.q} /> : null}
      <select
        defaultValue={filters.monitoredFolderId}
        name="monitoredFolderId"
        onChange={submitFilters}
      >
        <option value="">Pasta monitorada</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>
            {folder.folderName}
          </option>
        ))}
      </select>
      <select
        defaultValue={filters.importStatus}
        name="importStatus"
        onChange={submitFilters}
      >
        {statusOptions.map((option) => (
          <option key={option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button className="filter-submit" type="submit">
        Aplicar filtros
      </button>
      {hasActiveFilters(filters) ? (
        <Link className="filter-clear" href="/">
          Limpar
        </Link>
      ) : null}
    </form>
  );
}

function hasActiveFilters(filters: DashboardFilters) {
  return Boolean(
    filters.q ||
      filters.monitoredFolderId ||
      filters.importStatus ||
      filters.fileType,
  );
}
