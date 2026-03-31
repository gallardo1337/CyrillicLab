export const metadata = {
  title: "Cyrillic Lab",
  description: "Trainiere kyrillische Buchstaben im Casual- und Hardcore-Modus.",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
