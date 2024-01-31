import { Link as ChakraLink, Flex, Heading, Text } from "@chakra-ui/react";
import ConnectWalletButton from "./ConnectWalletButton";
import Link from "next/link";

const AppHeader = () => {
  return (
    <Flex justify="space-between" align="center">
      <Flex direction="column">
        <Heading as={Link} href="/">
          BACKED BY STX
        </Heading>
        <Text fontSize="xs">
          Decentralized crowdfunding, powered by{" "}
          <ChakraLink
            textDecor="underline"
            color="purple.600"
            href="https://www.stacks.co/"
            target="_blank"
          >
            Stacks
          </ChakraLink>{" "}
          + Bitcoin.
        </Text>
      </Flex>
      <ConnectWalletButton />
    </Flex>
  );
};

export default AppHeader;
