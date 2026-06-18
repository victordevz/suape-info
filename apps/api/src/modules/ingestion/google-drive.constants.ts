export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
] as const;

export const GOOGLE_DRIVE_FOLDER_MIME_TYPE =
  'application/vnd.google-apps.folder';

export const GOOGLE_DRIVE_MIME_TYPES = {
  docs: 'application/vnd.google-apps.document',
  sheets: 'application/vnd.google-apps.spreadsheet',
  slides: 'application/vnd.google-apps.presentation',
  pdf: 'application/pdf',
  text: 'text/plain',
} as const;

export const GOOGLE_WORKSPACE_EXPORT_MIME_TYPES: Record<string, string> = {
  [GOOGLE_DRIVE_MIME_TYPES.docs]: 'text/plain',
  [GOOGLE_DRIVE_MIME_TYPES.sheets]: 'text/csv',
  [GOOGLE_DRIVE_MIME_TYPES.slides]: 'text/plain',
};
