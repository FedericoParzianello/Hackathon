import { companies } from "@/data/mock-data";
import { MarketOverview } from "@/components/market-overview";

export default function MarketPage() {
  return <MarketOverview companies={companies} />;
}
