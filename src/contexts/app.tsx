"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ContextValue } from "@/types/context";
import { User } from "@/types/user";
import useOneTapLogin from "@/hooks/useOneTapLogin";
import { useSession } from "next-auth/react";

const AppContext = createContext({} as ContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppContextProvider = ({ children }: { children: ReactNode }) => {
  if (
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ONE_TAP_ENABLED === "true" &&
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID
  ) {
    useOneTapLogin();
  }

  const { data: session } = useSession();

  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const fetchUserInfo = async function () {
    try {
      const resp = await fetch("/api/userinfo", {
        method: "POST",
      });

      if (!resp.ok) {
        throw new Error("fetch user info failed with status: " + resp.status);
      }

      const { code, message, data } = await resp.json();
      if (code !== 0) {
        throw new Error(message);
      }

      setUser(data);
    } catch (e) {
      console.log("fetch user info failed");
    }
  };

  useEffect(() => {
    if (session && session.user) {
      fetchUserInfo();
    }
  }, [session]);

  return (
    <AppContext.Provider
      value={{
        showSignModal,
        setShowSignModal,
        user,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
