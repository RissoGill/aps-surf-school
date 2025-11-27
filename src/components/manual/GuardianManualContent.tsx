import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, LogIn, Layout, Users, Eye, Package, CreditCard, Image, Trophy, Plane, LogOut } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import html2pdf from "html2pdf.js";

export const GuardianManualContent = () => {
  const { t } = useLanguage();

  const downloadPDF = async () => {
    const element = document.getElementById('guardian-manual-content');
    const opt = {
      margin: 10,
      filename: 'manual-encarregado.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    await html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-normal">{t('userManual.guardian.title')}</h2>
        <Button onClick={downloadPDF} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('userManual.downloadPDF')}
        </Button>
      </div>

      <div id="guardian-manual-content" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogIn className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.login.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.login.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.guardian.login.step1')}</p>
            <p className="font-normal">2. {t('userManual.guardian.login.step2')}</p>
            <p className="font-normal">3. {t('userManual.guardian.login.step3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.family.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.family.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.guardian.family.step1')}</p>
            <p className="font-normal">2. {t('userManual.guardian.family.step2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Layout className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.tabs.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.tabs.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.guardian.tabs.tab1')}</p>
            <p className="font-normal">• {t('userManual.guardian.tabs.tab2')}</p>
            <p className="font-normal">• {t('userManual.guardian.tabs.tab3')}</p>
            <p className="font-normal">• {t('userManual.guardian.tabs.tab4')}</p>
            <p className="font-normal">• {t('userManual.guardian.tabs.tab5')}</p>
            <p className="font-normal">• {t('userManual.guardian.tabs.tab6')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.overview.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.overview.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.guardian.overview.info1')}</p>
            <p className="font-normal">• {t('userManual.guardian.overview.info2')}</p>
            <p className="font-normal">• {t('userManual.guardian.overview.info3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.packSummary.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.packSummary.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.guardian.packSummary.info1')}</p>
            <p className="font-normal">• {t('userManual.guardian.packSummary.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.payments.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.payments.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.guardian.payments.info1')}</p>
            <p className="font-normal">• {t('userManual.guardian.payments.info2')}</p>
            <p className="font-normal">• {t('userManual.guardian.payments.info3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Image className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.media.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.media.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.guardian.media.info1')}</p>
            <p className="font-normal">• {t('userManual.guardian.media.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.championships.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.championships.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.guardian.championships.info1')}</p>
            <p className="font-normal">• {t('userManual.guardian.championships.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.estagios.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.estagios.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.guardian.estagios.info1')}</p>
            <p className="font-normal">• {t('userManual.guardian.estagios.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogOut className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.guardian.logout.title')}</CardTitle>
                <CardDescription>{t('userManual.guardian.logout.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.guardian.logout.step1')}</p>
            <p className="font-normal">2. {t('userManual.guardian.logout.step2')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
