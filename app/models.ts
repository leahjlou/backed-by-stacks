import { z } from "zod";
import crypto from "crypto";

export const CampaignSchema = z.object({
  title: z.string(),
  chainTxId: z.string(),
  chainIsPending: z.boolean(),
  chainConfirmedId: z.number().optional(),
  description: z.string(),
  url: z.string().optional(),
  image: z.string().optional(),
  blockHeightExpiration: z.number().int().optional(),
  fundingGoal: z.number().int(),
  totalRaised: z.number().int(),
  isCollected: z.boolean().optional(),
  dateCreated: z.number(),
  dateUpdated: z.number(),
});

export interface Campaign {
  id?: number;
  chainTxId: string; // Transaction ID of the contract call which added this campaign
  chainIsPending: boolean; // If the campaign creation is still pending on chain
  chainConfirmedId?: number; // Campaign ID on chain
  title: string;
  description: string;
  url?: string;
  image?: string;
  blockHeightExpiration?: number;
  fundingGoal: number;
  totalRaised: number;
  isCollected?: boolean; // If funds have been collected at the end of the campaign
  dateCreated: number; // ms timestamp
  dateUpdated: number; // ms timestamp
}

export interface CampaignFundingInfo {
  amount: number;
  numContributions: number;
  isCollected: boolean;
}

export interface CampaignDetailsResponse {
  campaign: Campaign | null;
  fundingInfo: CampaignFundingInfo | null;
  isDataValidatedOnChain: boolean | null;
}

// Convert db row to client-ready campaign data
export function campaignDbToClient(campaignData: any) {
  return {
    id: campaignData.id,
    chainTxId: campaignData.chaintxid,
    chainIsPending: campaignData.chainispending,
    chainConfirmedId: campaignData.chainconfirmedid,
    title: campaignData.title,
    description: campaignData.description,
    url: campaignData.url,
    image: campaignData.image,
    blockHeightExpiration: Number(campaignData.blockheightexpiration),
    fundingGoal: Number(campaignData.fundinggoal),
    totalRaised: Number(campaignData.totalraised),
    isCollected: campaignData.iscollected,
    dateCreated: new Date(campaignData.datecreated).getTime(),
    dateUpdated: new Date(campaignData.dateupdated).getTime(),
  };
}

// This hash is stored on the blockchain and checked to ensure user-facing data in centralized data store has not been altered.
export function getCampaignDataHash(
  title: string,
  description: string,
  url?: string,
  image?: string
) {
  const dataToHash = {
    title,
    description,
    url,
    image,
  };
  const sha1 = crypto.createHash("sha1");
  sha1.update(JSON.stringify(dataToHash));
  return sha1.digest("hex");
}

export const ContributionSchema = z.object({
  campaignId: z.number().int(),
  principal: z.string(),
  amount: z.number().int(),
  isRefunded: z.boolean().optional(),
  dateCreated: z.number(),
  dateUpdated: z.number(),
});

export interface Contribution {
  campaignId: number;
  principal: string;
  amount: number;
  isRefunded?: boolean;
  dateCreated: number; // ms timestamp
  dateUpdated: number; // ms timestamp
}

// Convert db row to client-ready campaign data
export function contributionDbToClient(contributionData: any) {
  return {
    campaignId: contributionData.campaignid,
    principal: contributionData.principal,
    amount: Number(contributionData.amount),
    isRefunded: contributionData.isrefunded,
    dateCreated: new Date(contributionData.datecreated).getTime(),
    dateUpdated: new Date(contributionData.dateupdated).getTime(),
  };
}
