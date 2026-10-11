import './globals.css';

export const metadata = { title: 'Ajaia Docs', description: 'Lightweight collaborative document editor' };

export default function RootLayout({ children }) {
  return (<html lang="en"><body>{children}</body></html>);
}
