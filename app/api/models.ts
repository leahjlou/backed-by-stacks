import { z } from 'zod';

export const ContributionSchema = z.object({
  id: z.number().int(),
  description: z.string().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  dateCreated: z.number(),
  dateUpdated: z.number(),
});

export interface Contribution {
  id: number;
  description?: string;
  url?: string;
  image?: string;
  dateCreated: number; // Ms timestamp
  dateUpdated: number; // Ms timestamp
}

