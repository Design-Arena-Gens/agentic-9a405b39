export const metadata = {
  title: "YouTube Auto Poster",
  description: "Daily automated YouTube posting"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 24 }}>
        {children}
      </body>
    </html>
  );
}
