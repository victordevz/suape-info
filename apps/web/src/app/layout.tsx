import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Central de Dados e Evidencias | Poketeam',
  description:
    'Interface de governanca ambiental para documentos, pastas monitoradas e evidencias importadas do Google Drive.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
