import { AppConfig, showConnect, UserSession } from "@stacks/connect";
import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const appConfig = new AppConfig(["store_write", "publish_data"]);
export const userSession = new UserSession({ appConfig });

interface Wallet {
  isWalletOpen: boolean;
  isWalletConnected: boolean;
  testnetAddress: string | null;
  mainnetAddress: string | null;
  authenticate: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<Wallet>({
  isWalletOpen: false,
  isWalletConnected: false,
  testnetAddress: null,
  mainnetAddress: null,
  authenticate: () => {},
  disconnect: () => {},
});
export default WalletContext;

interface ProviderProps {
  children: ReactNode | ReactNode[];
}

export const WalletProvider: FC<ProviderProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(
    mounted && userSession.isUserSignedIn()
  );
  const [isWalletOpen, setIsWalletOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsWalletConnected(mounted && userSession.isUserSignedIn());
  }, [mounted]);

  const authenticate = useCallback(() => {
    setIsWalletOpen(true);
    showConnect({
      appDetails: {
        name: "Backed By STX",
        icon: "/icon.png",
      },
      redirectTo: "/",
      onFinish: () => {
        setIsWalletOpen(false);
        setIsWalletConnected(userSession.isUserSignedIn());
      },
      onCancel: () => {
        setIsWalletOpen(false);
      },
      userSession,
    });
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut("/");
  }, []);

  const testnetAddress = isWalletConnected
    ? userSession.loadUserData().profile.stxAddress.testnet
    : null;
  const mainnetAddress = isWalletConnected
    ? userSession.loadUserData().profile.stxAddress.mainnet
    : null;

  const walletContext = useMemo(
    () => ({
      authenticate,
      disconnect,
      isWalletOpen,
      isWalletConnected,
      testnetAddress,
      mainnetAddress,
    }),
    [
      authenticate,
      disconnect,
      isWalletOpen,
      isWalletConnected,
      mainnetAddress,
      testnetAddress,
    ]
  );

  return (
    <WalletContext.Provider value={walletContext}>
      {children}
    </WalletContext.Provider>
  );
};
