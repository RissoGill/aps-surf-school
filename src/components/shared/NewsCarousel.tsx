import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";

interface NewsItem {
  id: string;
  title: string;
  news_date: string;
  image_url: string;
  link_url: string | null;
}

const NewsCarousel = () => {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    (supabase.from("news" as any) as any)
      .select("id,title,news_date,image_url,link_url,expires_at,is_active,sort_order")
      .eq("is_active", true)
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order("news_date", { ascending: false })
      .order("sort_order", { ascending: true })
      .limit(10000)
      .then(({ data, error }: any) => {
        if (!error && Array.isArray(data)) setItems(data as NewsItem[]);
        setLoaded(true);
      });
  }, []);

  if (!loaded || items.length === 0) return null;

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(
      language === "pt" ? "pt-PT" : "en-GB",
      { day: "2-digit", month: "long", year: "numeric" }
    );

  return (
    <section className="mb-6" aria-label={t("news.title")}>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        {t("news.title")}
      </h2>
      <Carousel opts={{ align: "start", loop: items.length > 1 }} className="w-full">
        <CarouselContent>
          {items.map((item) => {
            const inner = (
              <Card className="overflow-hidden">
                <div className="aspect-video w-full bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardContent className="p-3">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(item.news_date)}
                  </p>
                </CardContent>
              </Card>
            );
            return (
              <CarouselItem key={item.id} className="basis-full sm:basis-1/2 lg:basis-1/3">
                {item.link_url ? (
                  <a
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:opacity-95 transition-opacity"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {items.length > 1 && (
          <>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </>
        )}
      </Carousel>
    </section>
  );
};

export default NewsCarousel;
