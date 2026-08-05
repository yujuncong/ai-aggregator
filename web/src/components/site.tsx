import type { CrawlItem } from "@/lib/items";
import { ArchiveNav } from "./archive-nav";
import { Hero } from "./hero";
import { SiteFooter, SourcesSection } from "./sections";
import { SiteNav } from "./site-nav";

export function Site({
  items,
  generatedAt,
  today,
  dates,
}: {
  items: CrawlItem[];
  generatedAt: string;
  today: string;
  dates: string[];
}) {
  return (
    <>
      <SiteNav />

      <main className="flex-1">
        <Hero
          items={items}
          generatedAt={generatedAt}
          archiveDays={dates.length + 1}
        />

        {/* 情报流 */}
        <section id="feed" className="container py-14 lg:py-20">
          <ArchiveNav today={today} dates={dates} todayItems={items} />
        </section>

        <SourcesSection />
      </main>

      <SiteFooter />
    </>
  );
}
