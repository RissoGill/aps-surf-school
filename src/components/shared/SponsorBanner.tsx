import sponsorsBanner from "@/assets/sponsors-banner.png";

const SponsorBanner = () => {
  return (
    <div className="bg-card border-t py-4 mt-8">
      <div className="mobile-container">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 text-center">
          Our Partners
        </h3>
        <div className="overflow-x-auto">
          <img 
            src={sponsorsBanner} 
            alt="Sponsor Partners" 
            className="h-12 w-auto mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default SponsorBanner;