// OwnState — public site chrome (Brick 06)
// Wraps marketing / browse pages with the Navbar + Footer. Auth and the
// dashboard live outside this group and supply their own layouts.

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
