"use client";

import { Button, Flex, Heading, Tooltip } from "@chakra-ui/react";
import CampaignsList from "../ui/components/CampaignsList";
import AppHeader from "../ui/components/AppHeader";
import PageContainer from "../ui/components/PageContainer";
import Link from "next/link";
import { useContext } from "react";
import WalletContext from "../ui/context/WalletContext";

// UI to
// x- connect wallet
// x- browse campaign listings
// - click to view campaign details
// - submit a new campaign
// - view history of campaigns that connected wallet has backed
export default function Page() {
  const { isWalletConnected } = useContext(WalletContext);

  return (
    <PageContainer>
      <Flex direction="column" gap="8">
        <AppHeader />
        <Flex justify="space-between" align="center">
          <Heading size="md">Browse all Fundraisers</Heading>
          <Tooltip
            label={
              !isWalletConnected
                ? "Connect your Stacks wallet above to propose a new fundraiser."
                : null
            }
          >
            <Button
              isDisabled={!isWalletConnected}
              as={Link}
              href="/campaigns/new"
              variant="solid"
              colorScheme="purple"
            >
              Create a fundraiser
            </Button>
          </Tooltip>
        </Flex>
        <CampaignsList />
      </Flex>
    </PageContainer>
  );
}
