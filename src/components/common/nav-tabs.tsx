import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button asChild key={tab.key} size="sm" variant={activeKey === tab.key ? "default" : "outline"}>
          <Link href={tab.href}>{tab.label}</Link>
        </Button>
      ))}
    </nav>
  );
}
