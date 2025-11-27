import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, LogIn, Layout, User, Dumbbell, Calendar, Trophy, Image, Plane, RefreshCw, LogOut } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import html2pdf from "html2pdf.js";

export const AthleteManualContent = () => {
  const { t } = useLanguage();

  const downloadPDF = async () => {
    const element = document.getElementById('athlete-manual-content');
    const opt = {
      margin: 10,
      filename: 'manual-atleta.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    await html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-normal">{t('userManual.athlete.title')}</h2>
        <Button onClick={downloadPDF} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('userManual.downloadPDF')}
        </Button>
      </div>

      <div id="athlete-manual-content" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogIn className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.login.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.login.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.athlete.login.step1')}</p>
            <p className="font-normal">2. {t('userManual.athlete.login.step2')}</p>
            <p className="font-normal">3. {t('userManual.athlete.login.step3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Layout className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.tabs.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.tabs.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.athlete.tabs.tab1')}</p>
            <p className="font-normal">• {t('userManual.athlete.tabs.tab2')}</p>
            <p className="font-normal">• {t('userManual.athlete.tabs.tab3')}</p>
            <p className="font-normal">• {t('userManual.athlete.tabs.tab4')}</p>
            <p className="font-normal">• {t('userManual.athlete.tabs.tab5')}</p>
            <p className="font-normal">• {t('userManual.athlete.tabs.tab6')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.personal.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.personal.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.athlete.personal.info1')}</p>
            <p className="font-normal">• {t('userManual.athlete.personal.info2')}</p>
            <p className="font-normal">• {t('userManual.athlete.personal.info3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Dumbbell className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.training.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.training.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.athlete.training.info1')}</p>
            <p className="font-normal">• {t('userManual.athlete.training.info2')}</p>
            <p className="font-normal">• {t('userManual.athlete.training.info3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.attendance.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.attendance.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.athlete.attendance.info1')}</p>
            <p className="font-normal">• {t('userManual.athlete.attendance.info2')}</p>
            <p className="font-normal">• {t('userManual.athlete.attendance.info3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.championships.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.championships.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.athlete.championships.info1')}</p>
            <p className="font-normal">• {t('userManual.athlete.championships.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Image className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.media.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.media.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.athlete.media.info1')}</p>
            <p className="font-normal">• {t('userManual.athlete.media.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.estagios.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.estagios.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.athlete.estagios.info1')}</p>
            <p className="font-normal">• {t('userManual.athlete.estagios.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.refresh.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.refresh.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.athlete.refresh.step1')}</p>
            <p className="font-normal">2. {t('userManual.athlete.refresh.step2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogOut className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.athlete.logout.title')}</CardTitle>
                <CardDescription>{t('userManual.athlete.logout.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.athlete.logout.step1')}</p>
            <p className="font-normal">2. {t('userManual.athlete.logout.step2')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
