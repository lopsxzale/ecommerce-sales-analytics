import "../globals.css";

export const metadata = { title: "Olist Analytics" };

export default function RootRedirectLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
