import { BlocksApi } from "@stacks/blockchain-api-client";
import { BLOCKCHAIN_API_CONFIG } from "../../utils/stacks-api";
import { useEffect, useState } from "react";

const blocksApi = new BlocksApi(BLOCKCHAIN_API_CONFIG);

export default function useCurrentChainTip() {
  const [chainTip, setChainTip] = useState<number | null>(null);

  useEffect(() => {
    const fetchChainTip = async () => {
      const { results: blocks } = await blocksApi.getBlocks({ limit: 1 });
      setChainTip(blocks[0].height);
    };
    fetchChainTip();
  }, []);

  return chainTip;
}
