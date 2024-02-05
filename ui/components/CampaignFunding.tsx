import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
  Progress,
  Text,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { Campaign, CampaignFundingInfo } from "../../app/models";
import { stxToUstx, ustxToStx } from "../../utils/token-utils";
import StacksIcon from "../icons/StacksIcon";
import { useContext, useState } from "react";
import WalletContext from "../context/WalletContext";
import ConnectWalletButton from "./ConnectWalletButton";
import {
  ContractCallOptions,
  FinishedTxData,
  openContractCall,
} from "@stacks/connect";
import {
  CONTRACT_DEPLOYER_ADDRESS,
  CONTRACT_NAME,
  ContractFunctionName,
  STACKS_NETWORK,
} from "../../utils/stacks-api";
import {
  Cl,
  FungibleConditionCode,
  PostConditionMode,
  makeStandardSTXPostCondition,
} from "@stacks/transactions";
import axios from "axios";

const CampaignFunding = ({
  campaign,
  fundingInfo,
  chainTip,
  refreshCampaign,
}: {
  campaign: Campaign;
  fundingInfo: CampaignFundingInfo | null;
  chainTip: number | null;
  refreshCampaign: Function;
}) => {
  const toast = useToast();
  const { isWalletConnected, mainnetAddress, testnetAddress } =
    useContext(WalletContext);
  const userWalletAddress = STACKS_NETWORK.isMainnet()
    ? mainnetAddress
    : testnetAddress;

  const [contributionAmount, setContributionAmount] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const isExpired =
    chainTip && chainTip > (campaign.blockHeightExpiration || 0);
  const isSucceeded =
    Number(campaign.totalRaised) >= Number(campaign.fundingGoal);

  const handleMakeContribution = async () => {
    if (!userWalletAddress) {
      console.error("No connected wallet");
      return;
    }

    // this post-condition ensures that the user will have the given amount transferred out of their wallet
    const postCondition = makeStandardSTXPostCondition(
      userWalletAddress,
      FungibleConditionCode.LessEqual,
      stxToUstx(contributionAmount)
    );

    const functionName: ContractFunctionName = "contribute-to-campaign";
    const contributeContractCallOptions: ContractCallOptions = {
      network: STACKS_NETWORK,
      contractName: CONTRACT_NAME,
      contractAddress: CONTRACT_DEPLOYER_ADDRESS,
      functionName,
      functionArgs: [
        Cl.uint(campaign.chainConfirmedId || 0),
        Cl.uint(stxToUstx(contributionAmount)),
      ],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [postCondition],
      onCancel: () => {
        setIsLoading(false);
      },
      onFinish: async (data: FinishedTxData) => {
        toast({
          status: "success",
          title: "Contribution submitted",
          description: `Thanks for contributing to ${campaign.title}! It will take a few minutes for your contribution to be confirmed on-chain.`,
        });
        setIsLoading(false);

        // Store contribution in application data too
        await axios.post("/api/contributions", {
          campaignId: campaign.id,
          principal: userWalletAddress,
          amount: stxToUstx(contributionAmount),
          dateCreated: Date.now(),
          dateUpdated: Date.now(),
        });

        // Refresh page to reflect the new contribution
        refreshCampaign();
      },
    };

    try {
      await openContractCall(contributeContractCallOptions);
    } catch (error) {
      console.error(error);
      toast({
        status: "error",
        title: "Error backing fundraiser",
        description:
          "There was a problem backing this fundraiser. Please try again later.",
      });
    }
  };

  return (
    <Flex direction="column" gap="4" my="2" py="4">
      <Box>
        <Text as="span" fontWeight="bold">
          {campaign.title}
        </Text>{" "}
        {isExpired ? (
          <Text as="span">
            {isSucceeded
              ? "reached its goal and will be funded succesfully! 🎉"
              : "did not reach its goal this time, and contributions will be returned to the backers. We're rooting for them next time!"}
          </Text>
        ) : (
          <Text as="span">
            {isSucceeded
              ? "already reached its goal! 🎉 But you can still back this project and make it even more successful."
              : "is looking for backers to reach its funding goal!"}
          </Text>
        )}
      </Box>
      <Box>
        <Flex w="full" direction="column" justify="center" align="center">
          {fundingInfo?.numContributions ? (
            <Flex>
              <Text fontWeight="bold" mx="2">
                {fundingInfo.numContributions}
              </Text>{" "}
              {fundingInfo.numContributions === 1
                ? "backer has raised"
                : "backers have raised"}
            </Flex>
          ) : null}
          <Flex gap="2">
            <Flex gap="1">
              <StacksIcon mt="1" />
              <Text fontWeight="bold" mr="1">
                {ustxToStx(campaign.totalRaised)}
              </Text>{" "}
              STX
            </Flex>
            <Box>of</Box>
            <Flex gap="1">
              <StacksIcon mt="1" />
              <Text fontWeight="bold" mr="1">
                {ustxToStx(campaign.fundingGoal)}
              </Text>{" "}
              STX
            </Flex>
          </Flex>
        </Flex>
        <Progress
          colorScheme="purple"
          mt="2"
          value={Math.max(
            1, // Show at least a little sliver of the progress bar
            Math.min(
              100,
              (Number(campaign.totalRaised) / Number(campaign.fundingGoal)) *
                100
            ) // Max out at 100, even if over goal
          )}
        />
      </Box>
      {!isExpired ? (
        <>
          {!isWalletConnected ? (
            <Flex direction="column" align="center" gap="4">
              Connect your wallet to back this fundraiser.
              <ConnectWalletButton variant="solid" colorScheme="purple" />
            </Flex>
          ) : (
            <Flex direction="column" gap="4" mt="8">
              <FormLabel mb="0">Back this project</FormLabel>
              <Flex gap="4" align="center">
                {["20", "50", "100", "200", "1000"].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    bg={amount === contributionAmount ? "gray.200" : "white"}
                    _hover={{
                      bg: amount === contributionAmount ? "gray.200" : "white",
                    }}
                    onClick={() => {
                      setContributionAmount(amount);
                    }}
                  >
                    {amount} STX
                  </Button>
                ))}
              </Flex>
              <FormControl>
                <Flex gap="3">
                  <InputGroup>
                    <InputLeftAddon
                      bg="gray.600"
                      color="white"
                      borderColor="purple.600"
                    >
                      <StacksIcon />
                    </InputLeftAddon>
                    <Input
                      type="number"
                      value={contributionAmount}
                      onChange={(e) => {
                        setContributionAmount(e.target.value);
                      }}
                    />
                  </InputGroup>
                  <Tooltip label="You'll be prompted to confirm this transaction with your wallet.">
                    <Button
                      minW="20%"
                      isDisabled={
                        isLoading || isNaN(parseInt(contributionAmount))
                      }
                      isLoading={isLoading}
                      colorScheme="purple"
                      onClick={handleMakeContribution}
                    >
                      I'm in!
                    </Button>
                  </Tooltip>
                </Flex>
                <FormHelperText>
                  If this campaign reaches its goal before it expires, the funds
                  will be collected by the owner of this fundraiser. If not,
                  you'll receive a refund.
                </FormHelperText>
              </FormControl>
            </Flex>
          )}
        </>
      ) : null}
    </Flex>
  );
};

export default CampaignFunding;
