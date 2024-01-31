import {
  Box,
  Button,
  ButtonProps,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { useContext, useState } from "react";
import { RiFileCopyLine } from "react-icons/ri";
import { BsCheck, BsChevronDown } from "react-icons/bs";
import WalletContext from "../context/WalletContext";
import StacksIcon from "../icons/StacksIcon";
import { truncateMiddle } from "../../utils/string-utils";

const ConnectWalletButton = (buttonProps: ButtonProps) => {
  const [didCopyAddress, setDidCopyAddress] = useState(false);
  const { authenticate, isWalletConnected, mainnetAddress, disconnect } =
    useContext(WalletContext);

  const copyAddress = () => {
    // @ts-ignore
    navigator.clipboard.writeText(mainnetAddress || "");
    setDidCopyAddress(true);
    setTimeout(() => {
      setDidCopyAddress(false);
    }, 1000);
  };

  return isWalletConnected ? (
    <Menu closeOnSelect={false} placement="bottom-end">
      <MenuButton as={Button} size="sm" variant="outline">
        <Flex gap="1.5" align="center">
          <Text>Connected to</Text>
          <StacksIcon />
          {truncateMiddle(mainnetAddress || "")}
          <Icon as={BsChevronDown} ml="1" />
        </Flex>
      </MenuButton>
      <MenuList zIndex={3}>
        <MenuItem
          onClick={copyAddress}
          as="button"
          data-testid="copy-wallet-address-button"
        >
          <Flex gap="3">
            <Box maxWidth="xs" wordBreak="break-word">
              {truncateMiddle(mainnetAddress || "", 11, 11)}
            </Box>
            <Box mt="1">
              {didCopyAddress ? (
                <Icon as={BsCheck} boxSize="4" />
              ) : (
                <Icon as={RiFileCopyLine} boxSize="4" />
              )}
            </Box>
          </Flex>
        </MenuItem>
        <MenuDivider />
        <MenuItem
          onClick={disconnect}
          data-testid="disconnect-wallet-address-button"
        >
          Disconnect
        </MenuItem>
      </MenuList>
    </Menu>
  ) : (
    <Button
      size="sm"
      onClick={authenticate}
      data-testid="wallet-connect-button"
      variant="outline"
      {...buttonProps}
    >
      <Flex gap="2" align="center">
        Connect Wallet
      </Flex>
    </Button>
  );
};

export default ConnectWalletButton;
