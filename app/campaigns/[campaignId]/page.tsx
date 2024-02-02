"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Flex,
  Heading,
  Link,
  useToast,
} from "@chakra-ui/react";
import PageContainer from "../../../ui/components/PageContainer";
import AppHeader from "../../../ui/components/AppHeader";
import { CampaignDetailsResponse } from "../../models";
import { useEffect, useState } from "react";
import axios from "axios";
import CampaignDetails from "../../../ui/components/CampaignDetails";
import CampaignFunding from "../../../ui/components/CampaignFunding";
import useCurrentChainTip from "../../../ui/hooks/useCurrentChainTip";

export default function Page({ params }: { params: { campaignId: string } }) {
  const campaignId = params.campaignId;
  const toast = useToast();

  const [campaignData, setCampaignData] =
    useState<CampaignDetailsResponse | null>(null);

  const fetchCampaign = async () => {
    try {
      const { data } = await axios.get(`/api/campaigns/${campaignId}`);
      setCampaignData(data);
    } catch (error) {
      console.error(error);
      toast({
        status: "error",
        title: "There was an unknown problem loading this fundraiser.",
      });
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const chainTip = useCurrentChainTip();
  const campaign = campaignData?.campaign || null;
  const fundingInfo = campaignData?.fundingInfo || null;
  const isDataValidatedOnChain = campaignData?.isDataValidatedOnChain;

  const handleUpdateFromChain = async () => {
    try {
      await axios.post("/api/webhooks/new-block");
      await fetchCampaign();
      toast({
        status: "success",
        title: "Refreshed status from chain.",
      });
    } catch (err) {
      console.error(err);
      toast({
        status: "error",
        title: "Error checking status from chain.",
      });
    }
  };

  const fundraiserAlerts = (
    <>
      {campaign?.chainIsPending ? (
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>Pending on-chain confirmation</AlertTitle>
          <AlertDescription>
            This fundraiser was proposed, but still needs to be confirmed before
            it can be backed.{" "}
            <Link
              as="button"
              color="blue.600"
              textDecor="underline"
              onClick={handleUpdateFromChain}
            >
              Refresh status
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}
      {!campaign?.chainIsPending && !isDataValidatedOnChain ? (
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Data not validated on-chain</AlertTitle>
          <AlertDescription>
            Hmmmmmmm. The information we have for this fundraiser isn't matching
            what we found on the Stacks blockchain. Keep your wits about you!
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );

  return (
    <PageContainer>
      <Flex direction="column" gap="8">
        <AppHeader />
        {campaign ? (
          <Flex direction="column" gap="6">
            <Flex direction="column" gap="4">
              {/* <Heading size="md">About this Fundraiser</Heading> */}
              {fundraiserAlerts}
              <CampaignDetails campaign={campaign} chainTip={chainTip} />
            </Flex>
            {campaign?.chainConfirmedId && fundingInfo ? (
              <Flex direction="column" gap="4">
                {/* <Heading size="md">Back this Fundraiser</Heading> */}
                <CampaignFunding
                  campaign={campaign}
                  fundingInfo={fundingInfo}
                  chainTip={chainTip}
                  refreshCampaign={fetchCampaign}
                />
              </Flex>
            ) : null}
          </Flex>
        ) : (
          <Box
            textAlign="center"
            border="1px dashed gray"
            borderRadius="md"
            p="12"
            mx="12"
          >
            Loading this fundraiser...
          </Box>
        )}
      </Flex>
    </PageContainer>
  );
}
