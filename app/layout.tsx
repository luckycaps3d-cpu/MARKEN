import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Configurador de Elevador',
  description: 'Aplicativo para dimensionamento e configuração de elevadores (poço, cabine e arcada) com planta baixa técnica interativa.',
  openGraph: {
    title: 'Configurador de Elevador',
    description: 'Aplicativo para dimensionamento e configuração de elevadores (poço, cabine e arcada) com planta baixa técnica interativa.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Configurador de Elevador',
    description: 'Aplicativo para dimensionamento e configuração de elevadores (poço, cabine e arcada) com planta baixa técnica interativa.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
