import {
  Badge,
  Box,
  Link as ChakraLink,
  Flex,
  Heading,
  Text,
} from "@chakra-ui/react";
import ConnectWalletButton from "./ConnectWalletButton";
import Link from "next/link";

const AppHeader = () => {
  return (
    <Flex justify="space-between" align="center">
      <Flex direction="column">
        <Flex direction="row" gap="4" align="center">
          <Heading as={Link} href="/">
            BACKED BY STX
          </Heading>
          <Box>
            <Badge variant="outline" colorScheme="orange">
              testnet
            </Badge>
          </Box>
        </Flex>
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
