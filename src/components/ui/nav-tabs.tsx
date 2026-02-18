import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type NavTab = {
  key: string;
  href: string;
  label: string;
};

type NavTabsProps = {
  tabs: NavTab[];
  activeKey: string;
};

export function NavTabs({ tabs, activeKey }: NavTabsProps) {
  return (
    <Tabs value={activeKey}>
      <TabsList variant="line">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} asChild>
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
