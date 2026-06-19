'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

type DebouncedDocumentSearchProps = {
  initialValue?: string;
};

const searchDebounceMs = 450;

export function DebouncedDocumentSearch({
  initialValue = '',
}: DebouncedDocumentSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalizedValue = value.trim();
      const currentValue = searchParams.get('q') ?? '';

      if (normalizedValue === currentValue) {
        return;
      }

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete('docPage');

      if (normalizedValue) {
        nextParams.set('q', normalizedValue);
      } else {
        nextParams.delete('q');
      }

      const query = nextParams.toString();

      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname);
      });
    }, searchDebounceMs);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, value]);

  return (
    <label className="search-box">
      <span>Buscar</span>
      <input
        aria-label="Buscar documentos por nome, licenca, processo ou pasta"
        onChange={(event) => setValue(event.target.value)}
        placeholder="Nome, licenca, processo ou pasta"
        type="search"
        value={value}
      />
      <small aria-live="polite">
        {isPending ? 'Buscando...' : 'Busca automatica apos pausa'}
      </small>
    </label>
  );
}
