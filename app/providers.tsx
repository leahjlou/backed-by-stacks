"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { WalletProvider } from "../ui/context/WalletContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <WalletProvider>{children}</WalletProvider>
    </ChakraProvider>
  );
}
