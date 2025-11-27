import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, LogIn, Layout, UserCheck, Users, Trophy, Plane, History, CreditCard, LogOut } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import html2pdf from "html2pdf.js";

export const CoachManualContent = () => {
  const { t } = useLanguage();

  const downloadPDF = async () => {
    const element = document.getElementById('coach-manual-content');
    const opt = {
      margin: 10,
      filename: 'manual-treinador.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    await html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-normal">{t('userManual.coach.title')}</h2>
        <Button onClick={downloadPDF} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('userManual.downloadPDF')}
        </Button>
      </div>

      <div id="coach-manual-content" className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogIn className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.login.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.login.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.coach.login.step1')}</p>
            <p className="font-normal">2. {t('userManual.coach.login.step2')}</p>
            <p className="font-normal">3. {t('userManual.coach.login.step3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Layout className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.dashboard.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.dashboard.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.coach.dashboard.feature1')}</p>
            <p className="font-normal">• {t('userManual.coach.dashboard.feature2')}</p>
            <p className="font-normal">• {t('userManual.coach.dashboard.feature3')}</p>
            <p className="font-normal">• {t('userManual.coach.dashboard.feature4')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.attendance.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.attendance.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.coach.attendance.step1')}</p>
            <p className="font-normal">2. {t('userManual.coach.attendance.step2')}</p>
            <p className="font-normal">3. {t('userManual.coach.attendance.step3')}</p>
            <p className="font-normal">4. {t('userManual.coach.attendance.step4')}</p>
            <p className="font-normal">5. {t('userManual.coach.attendance.step5')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.bulk.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.bulk.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.coach.bulk.step1')}</p>
            <p className="font-normal">2. {t('userManual.coach.bulk.step2')}</p>
            <p className="font-normal">3. {t('userManual.coach.bulk.step3')}</p>
            <p className="font-normal">4. {t('userManual.coach.bulk.step4')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Layout className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.profile.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.profile.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.coach.profile.info1')}</p>
            <p className="font-normal">• {t('userManual.coach.profile.info2')}</p>
            <p className="font-normal">• {t('userManual.coach.profile.info3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.championships.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.championships.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.coach.championships.info1')}</p>
            <p className="font-normal">• {t('userManual.coach.championships.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plane className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.estagios.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.estagios.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.coach.estagios.info1')}</p>
            <p className="font-normal">• {t('userManual.coach.estagios.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.history.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.history.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.coach.history.step1')}</p>
            <p className="font-normal">2. {t('userManual.coach.history.step2')}</p>
            <p className="font-normal">3. {t('userManual.coach.history.step3')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.payments.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.payments.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">• {t('userManual.coach.payments.info1')}</p>
            <p className="font-normal">• {t('userManual.coach.payments.info2')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LogOut className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-normal">{t('userManual.coach.logout.title')}</CardTitle>
                <CardDescription>{t('userManual.coach.logout.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-normal">1. {t('userManual.coach.logout.step1')}</p>
            <p className="font-normal">2. {t('userManual.coach.logout.step2')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
