'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { removeMonitoredFolder } from '@/lib/api';

export function RemoveFolderButton({
  folderName,
  id,
}: {
  folderName: string;
  id: string;
}) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function removeFolder() {
    const confirmed = window.confirm(
      `Remover a pasta "${folderName}" das pastas conectadas?`,
    );

    if (!confirmed) {
      return;
    }

    setIsRemoving(true);

    try {
      await removeMonitoredFolder(id);
      router.refresh();
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <button
      aria-label={`Remover ${folderName}`}
      className="folder-remove-button"
      disabled={isRemoving}
      onClick={removeFolder}
      title="Remover pasta conectada"
      type="button"
    >
      x
    </button>
  );
}
