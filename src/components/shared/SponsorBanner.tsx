import sponsorsBanner from "@/assets/sponsors-banner.png";
import joaquimChavesLogo from "@/assets/joaquim-chaves-logo.png";
import hurleyLogo from "@/assets/hurley-logo.png";
import oceanEarthLogo from "@/assets/ocean-earth-logo.png";
import surfersLogo from "@/assets/surfers-logo.png";
import eqLogo from "@/assets/eq-logo.png";
import quintaMarinhaLogo from "@/assets/quinta-marinha-logo.png";
import cultoImagemLogo from "@/assets/culto-imagem-logo.png";

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
              src={hurleyLogo} 
              alt="Hurley" 
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
            <img 
              src={oceanEarthLogo} 
              alt="Ocean & Earth" 
              className="h-12 w-auto object-contain mx-auto"
            />
            <img 
              src={surfersLogo} 
              alt="Surfers" 
              className="h-12 w-auto object-contain mx-auto"
            />
            <img 
              src={eqLogo} 
              alt="EQ" 
              className="h-12 w-auto object-contain mx-auto"
            />
            <img 
              src={quintaMarinhaLogo} 
              alt="Quinta da Marinha Health Club" 
              className="h-12 w-auto object-contain mx-auto"
            />
            <img 
              src={cultoImagemLogo} 
              alt="Culto da Imagem" 
              className="h-12 w-auto object-contain mx-auto"
            />
            <div className="h-12 w-full bg-muted rounded-lg flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Partner 6</span>
            </div>
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