import './globals.css';

export const metadata = {
  title: 'QR Code Grid — folhas de QR para imprimir e recortar',
  description:
    'Digite um texto, escolha o tamanho da grade e a quantidade: gera um PDF de QR codes pronto para imprimir e recortar. Tudo no seu navegador.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5fa' },
    { media: '(prefers-color-scheme: dark)', color: '#07070c' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
