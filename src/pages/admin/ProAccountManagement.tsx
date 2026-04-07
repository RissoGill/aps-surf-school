import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import SponsorBanner from "@/components/shared/SponsorBanner";
import ProAccountTab from "@/components/admin/ProAccountTab";
import { useLanguage } from "@/i18n/LanguageContext";

const ProAccountManagement = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title={t("proAccount.title")} showBack backTo="/dashboard/administration" />
      <main className="mobile-container py-6">
        <ProAccountTab />
      </main>
      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default ProAccountManagement;
