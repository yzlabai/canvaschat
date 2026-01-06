"use client";

import { Button } from "@/components/ui/button";
import { useAppContext } from "@/contexts/app";

export default function SignIn() {
  const { setShowSignModal } = useAppContext();

  return (
    <Button
      variant="default"
      onClick={() => setShowSignModal(true)}
      className="cursor-pointer"
    >
      Sign In
    </Button>
  );
}
