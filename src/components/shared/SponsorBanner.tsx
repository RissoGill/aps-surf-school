import sponsorsBanner from "@/assets/sponsors-banner.png";
import joaquimChavesLogo from "@/assets/joaquim-chaves-logo.jpg";
import swappieLogo from "@/assets/swappie-logo.png";

const SponsorBanner = () => {
  return (
    <div className="bg-card border-t py-6 mt-8">
      <div className="mobile-container space-y-8">
        {/* Main Sponsors */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Main Sponsors
          </h3>
          <div className="flex justify-center items-center gap-8">
            <img 
              src={joaquimChavesLogo} 
              alt="Joaquim Chaves Saúde" 
              className="h-20 w-auto object-contain"
            />
            <img 
              src={swappieLogo} 
              alt="Swappie" 
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>

        {/* Our Partners */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            Our Partners
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-12 w-full bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Partner {i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* School Verified By */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
            School Verified By
          </h3>
          <div className="flex justify-center items-center gap-8">
            <div className="h-12 w-24 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Cert 1</span>
            </div>
            <div className="h-12 w-24 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Cert 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorBanner;