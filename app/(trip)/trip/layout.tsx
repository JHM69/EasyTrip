import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import type { Metadata } from "next";
import { TrpcProvider } from "@/utils/trpc-provider";

// export const metadata: Metadata = {
//   title: "Easy Trip",
//   description: "Quantum Guys",
// };

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TrpcProvider>
      <Header />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="w-full pt-16">
            {children}
        </main>
      </div>
      </TrpcProvider>
    </>
  );
}