"use client";

import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Flex,
  Link,
  useToast,
} from "@chakra-ui/react";
import PageContainer from "../../../ui/components/PageContainer";
import AppHeader from "../../../ui/components/AppHeader";
import { CampaignDetailsResponse, Contribution } from "../../models";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import CampaignDetails from "../../../ui/components/CampaignDetails";
import CampaignFunding from "../../../ui/components/CampaignFunding";
import useCurrentChainTip from "../../../ui/hooks/useCurrentChainTip";
import {
  CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_NAME,
  ContractFunctionName,
  STACKS_NETWORK,
} from "../../../utils/stacks-api";
import WalletContext from "../../../ui/context/WalletContext";
import { ustxToStx } from "../../../utils/token-utils";
import {
  ContractCallOptions,
  FinishedTxData,
  openContractCall,
} from "@stacks/connect";
import {
  Cl,
  FungibleConditionCode,
  PostConditionMode,
  makeContractSTXPostCondition,
} from "@stacks/transactions";

export default function Page({ params }: { params: { campaignId: string } }) {
  const campaignId = params.campaignId;
  const toast = useToast();

  const { mainnetAddress, testnetAddress } = useContext(WalletContext);
  const userWalletAddress = STACKS_NETWORK.isMainnet()
    ? mainnetAddress
    : testnetAddress;

  const [campaignData, setCampaignData] =
    useState<CampaignDetailsResponse | null>(null);
  const [userContribution, setUserContribution] = useState<Contribution | null>(
    null
  );

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

  const fetchUserContribution = async () => {
    const { data } = await axios(
      `/api/campaigns/${campaignId}/contributions/${userWalletAddress}`
    );
    setUserContribution(data);
  };

  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  useEffect(() => {
    fetchUserContribution();
  }, [userWalletAddress]);

  const chainTip = useCurrentChainTip();
  const campaign = campaignData?.campaign || null;
  const fundingInfo = campaignData?.fundingInfo || null;
  const isDataValidatedOnChain = campaignData?.isDataValidatedOnChain;

  const isCampaignOwner = campaign?.owner === userWalletAddress;
  const isCampaignContributor = !!userContribution;
  const isExpired =
    campaign?.blockHeightExpiration &&
    chainTip &&
    chainTip >= campaign.blockHeightExpiration;
  const isSucceeded =
    Number(campaign?.totalRaised) >= Number(campaign?.fundingGoal);

  const handleCollectFunds = async () => {
    const postCondition = makeContractSTXPostCondition(
      CONTRACT_DEPLOYER_ADDRESS,
      CONTRACT_NAME,
      FungibleConditionCode.LessEqual,
      campaign?.totalRaised || 0
    );
    const functionName: ContractFunctionName = "fund-campaign";
    const collectFundsContractCallOptions: ContractCallOptions = {
      network: STACKS_NETWORK,
      contractName: CONTRACT_NAME,
      contractAddress: CONTRACT_DEPLOYER_ADDRESS,
      functionName,
      functionArgs: [Cl.uint(campaign?.chainConfirmedId || 0)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [postCondition],
      onFinish: async (data: FinishedTxData) => {
        console.log("Funding request submitted in tx: " + data.txId);
        toast({
          status: "success",
          title: "Funds requested",
          description:
            "Your collection of funds is pending. You should receive them soon!",
        });
        await axios.put(`/api/campaigns/${campaignId}`, {
          ...campaign,
          isCollected: true,
        });
        fetchCampaign();
      },
    };

    try {
      await openContractCall(collectFundsContractCallOptions);
    } catch (error) {
      console.error(error);
      toast({
        status: "error",
        title: "Error requesting your funds",
        description:
          "There was a problem collecting your raised funds. Please try again later.",
      });
    }
  };

  const handleGetRefund = async () => {
    const postCondition = makeContractSTXPostCondition(
      CONTRACT_DEPLOYER_ADDRESS,
      CONTRACT_NAME,
      FungibleConditionCode.LessEqual,
      userContribution?.amount || 0
    );
    const functionName: ContractFunctionName = "refund-contribution";
    const getRefundContractCallOptions: ContractCallOptions = {
      network: STACKS_NETWORK,
      contractName: CONTRACT_NAME,
      contractAddress: CONTRACT_DEPLOYER_ADDRESS,
      functionName,
      functionArgs: [
        Cl.uint(campaign?.chainConfirmedId || 0),
        Cl.principal(userWalletAddress || ""),
      ],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [postCondition],
      onFinish: async (data: FinishedTxData) => {
        console.log("Refund submitted in tx: " + data.txId);
        toast({
          status: "success",
          title: "Refund requested",
          description: "Your refund is pending. You'll receive it soon!",
        });
        await axios.put(
          `/api/campaigns/${campaignId}/contributions/${userWalletAddress}`,
          { ...userContribution, isRefunded: true }
        );
        fetchUserContribution();
      },
    };

    try {
      await openContractCall(getRefundContractCallOptions);
    } catch (error) {
      console.error(error);
      toast({
        status: "error",
        title: "Error requesting refund",
        description:
          "There was a problem getting your refund. Please try again later.",
      });
    }
  };
  // await axios.put(`/api/campaigns/${campaignId}`, { ...campaign, isCollected: true });

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
          <Box>
            <AlertTitle>Pending on-chain confirmation</AlertTitle>
            <AlertDescription>
              This fundraiser was proposed, but still needs to be confirmed
              on-chain before it can be backed.{" "}
              <Link
                as="button"
                color="blue.600"
                textDecor="underline"
                onClick={handleUpdateFromChain}
              >
                Refresh status
              </Link>
            </AlertDescription>
          </Box>
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
      {isCampaignOwner ? (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>This is your fundraiser.</AlertTitle>
            <AlertDescription>
              {isExpired ? (
                <Box display="inline">
                  {isSucceeded ? (
                    <Box display="inline">
                      This fundraiser is finished, and it met its goal! 🎉{" "}
                      {campaign.isCollected ? (
                        <Box display="inline">
                          You've already requested to collect your funds.
                          (Problem? You can
                          <Link
                            as="button"
                            onClick={handleCollectFunds}
                            color="blue.600"
                            textDecor="underline"
                            ml="1"
                          >
                            make another request
                          </Link>
                          .)
                        </Box>
                      ) : (
                        <Link
                          as="button"
                          onClick={handleCollectFunds}
                          color="blue.600"
                          textDecor="underline"
                          ml="1"
                        >
                          Collect your funds now.
                        </Link>
                      )}
                    </Box>
                  ) : (
                    "It did not meet its goal, so you are not eligible to collect the funds raised. Backers will get their contributions refunded."
                  )}
                </Box>
              ) : (
                <Box display="inline">
                  Good luck reaching your funding goal! Come back to this page
                  when your fundraiser is expired to collect your funds.
                </Box>
              )}
            </AlertDescription>
          </Box>
        </Alert>
      ) : null}
      {isCampaignContributor ? (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>
              You backed this campaign with {ustxToStx(userContribution.amount)}{" "}
              STX.
            </AlertTitle>
            <AlertDescription>
              {isExpired ? (
                <Box display="inline">
                  {isSucceeded ? (
                    <Box display="inline">
                      This fundraiser met its goal and funds will be collected
                      by its owner. Thanks for making it happen!
                    </Box>
                  ) : (
                    <Box display="inline">
                      This fundraiser did not reach its goal.{" "}
                      {userContribution.isRefunded ? (
                        <>
                          You've already requested your refund. (Problem? You
                          can
                          <Link
                            as="button"
                            onClick={handleGetRefund}
                            color="blue.600"
                            textDecor="underline"
                            ml="1"
                          >
                            request it again
                          </Link>
                          .)
                        </>
                      ) : (
                        <>
                          Your contribution is eligible for a refund.
                          <Link
                            as="button"
                            onClick={handleGetRefund}
                            color="blue.600"
                            textDecor="underline"
                            ml="1"
                          >
                            Get {ustxToStx(userContribution.amount)} STX
                            refunded.
                          </Link>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box display="inline">
                  Thanks for your contribution! This fundraiser is currently
                  active. When it expires, you may return to this page for a
                  refund if it did not meet its funding goal.
                </Box>
              )}
            </AlertDescription>
          </Box>
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
            {!campaign?.chainIsPending ? (
              <Flex direction="column" gap="4">
                {/* <Heading size="md">Back this Fundraiser</Heading> */}
                <CampaignFunding
                  campaign={campaign}
                  fundingInfo={fundingInfo}
                  isExpired={isExpired || false}
                  refreshCampaign={() => {
                    fetchCampaign();
                    fetchUserContribution();
                  }}
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
