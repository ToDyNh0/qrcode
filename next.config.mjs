/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tudo roda no browser: nao existe rota de servidor, entao o app e exportado
  // como site estatico e pode ser hospedado em qualquer lugar (Pages, S3, etc).
  output: 'export',
  images: { unoptimized: true },
  // some o selo flutuante do Next durante o dev
  devIndicators: false,
};

export default nextConfig;
