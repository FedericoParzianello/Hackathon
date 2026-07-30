import { companies } from "@/data/mock-data";
import { CompaniesExplorer } from "@/components/companies-explorer";

export default function Home() {
  return <CompaniesExplorer companies={companies} />;
}
