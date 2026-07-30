import { companies } from "@/data/mock-data";
import { MorningBriefing } from "@/components/morning-briefing";

export default function MorningBriefingPage() {
  return <MorningBriefing companies={companies} />;
}
