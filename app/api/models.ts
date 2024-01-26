import { z } from "zod";
import crypto from "crypto";

export const CampaignSchema = z.object({
  id: z.number().int(),
  description: z.string().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  blockHeightExpiration: z.number().int(),
  fundingGoal: z.number().int(),
  totalRaised: z.number().int(),
  dateCreated: z.number(),
  dateUpdated: z.number(),
});

export interface Campaign {
  id: number;
  description?: string;
  url?: string;
  image?: string;
  blockHeightExpiration: number;
  fundingGoal: number;
  totalRaised: number;
  dateCreated: number; // ms timestamp
  dateUpdated: number; // ms timestamp
}

// Convert db row to client-ready campaign data
export function campaignDbToClient(campaignData: any) {
  return {
    id: campaignData.id,
    description: campaignData.description,
    url: campaignData.url,
    image: campaignData.image,
    blockHeightExpiration: campaignData.blockheightexpiration,
    fundingGoal: campaignData.fundinggoal,
    totalRaised: campaignData.totalraised,
    dateCreated: new Date(campaignData.datecreated).getTime(),
    dateUpdated: new Date(campaignData.dateupdated).getTime(),
  };
}

// This hash is stored on the blockchain and checked to ensure data in centralized data store has not been altered.
export function getCampaignDataHash(campaign: Campaign) {
  const data = {
    ...campaign,
    // The database uses a seconds timestamp for dates, so ensure milliseconds precision is removed for consistency.
    dateCreated: Math.round(campaign.dateCreated / 1000) * 1000,
    dateUpdated: Math.round(campaign.dateUpdated / 1000) * 1000,
  };
  return crypto.createHash(JSON.stringify(data));
}

export const ContributionSchema = z.object({
  campaignId: z.number().int(),
  principal: z.string(),
  amount: z.number().int(),
  dateCreated: z.number(),
  dateUpdated: z.number(),
});

export interface Contribution {
  campaignId: number;
  principal: string;
  amount: number;
  dateCreated: number; // ms timestamp
  dateUpdated: number; // ms timestamp
}

// Convert db row to client-ready campaign data
export function contributionDbToClient(contributionData: any) {
  return {
    campaignId: contributionData.campaignid,
    principal: contributionData.principal,
    amount: contributionData.amount,
    dateCreated: new Date(contributionData.datecreated).getTime(),
    dateUpdated: new Date(contributionData.dateupdated).getTime(),
  };
}
