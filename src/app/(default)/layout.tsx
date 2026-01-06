import Header from "@/components/header";
import { ReactNode } from "react";

export default async function DefaultLayout({
  children,
}: {
  children: ReactNode;
}) {

  return (
    <>
      <Header />
      <main className="overflow-x-hidden">{children}</main>
    </>
  );
}
