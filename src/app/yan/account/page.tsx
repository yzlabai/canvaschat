import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUserInfo } from "@/services/user";
import { getUserCredits, getCreditsByUserUuid } from "@/services/credit";
import { AccountContent } from "@/components/yan/account/account-content";
import { AccountSkeleton } from "@/components/yan/account/account-skeleton";

async function getAccountData() {
  const user = await getUserInfo();
  if (!user) {
    redirect("/auth/signin");
  }

  const [userCredits, creditHistory] = await Promise.all([
    getUserCredits(user.uuid!),
    getCreditsByUserUuid(user.uuid!, 1, 50),
  ]);

  return {
    user: {
      ...user,
      credits: userCredits,
    },
    creditHistory: creditHistory || [],
  };
}

export default async function AccountPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Account</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings, subscription, and usage.
        </p>
      </div>
      
      <Suspense fallback={<AccountSkeleton />}>
        <AccountData />
      </Suspense>
    </div>
  );
}

async function AccountData() {
  const data = await getAccountData();
  return <AccountContent {...data} />;
}
