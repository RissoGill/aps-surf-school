import { BookOpen } from "lucide-react";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/i18n/LanguageContext";

const UserManual = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader title={t('userManual.title')} showBack backTo="/" />
      
      <main className="flex-1 py-6">
        <div className="mobile-container">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('userManual.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('userManual.subtitle')}</p>
            </div>
          </div>

          <Tabs defaultValue="coach" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="coach">{t('userManual.tabs.coach')}</TabsTrigger>
              <TabsTrigger value="athlete">{t('userManual.tabs.athlete')}</TabsTrigger>
              <TabsTrigger value="guardian">{t('userManual.tabs.guardian')}</TabsTrigger>
            </TabsList>

            {/* Coach Manual */}
            <TabsContent value="coach" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.login.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>{t('userManual.coach.login.step1')}</li>
                    <li>{t('userManual.coach.login.step2')}</li>
                    <li>{t('userManual.coach.login.step3')}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.dashboard.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.coach.dashboard.feature1')}</p>
                  <p>• {t('userManual.coach.dashboard.feature2')}</p>
                  <p>• {t('userManual.coach.dashboard.feature3')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.attendance.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>{t('userManual.coach.attendance.step1')}</li>
                    <li>{t('userManual.coach.attendance.step2')}</li>
                    <li>{t('userManual.coach.attendance.step3')}</li>
                    <li>{t('userManual.coach.attendance.step4')}</li>
                    <li>{t('userManual.coach.attendance.step5')}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.bulk.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>{t('userManual.coach.bulk.step1')}</li>
                    <li>{t('userManual.coach.bulk.step2')}</li>
                    <li>{t('userManual.coach.bulk.step3')}</li>
                    <li>{t('userManual.coach.bulk.step4')}</li>
                    <li>{t('userManual.coach.bulk.step5')}</li>
                    <li>{t('userManual.coach.bulk.step6')}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.profile.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.coach.profile.feature1')}</p>
                  <p>• {t('userManual.coach.profile.feature2')}</p>
                  <p>• {t('userManual.coach.profile.feature3')}</p>
                  <p>• {t('userManual.coach.profile.feature4')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.championships.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.coach.championships.feature1')}</p>
                  <p>• {t('userManual.coach.championships.feature2')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.internships.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.coach.internships.feature1')}</p>
                  <p>• {t('userManual.coach.internships.feature2')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.history.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.coach.history.feature1')}</p>
                  <p>• {t('userManual.coach.history.feature2')}</p>
                  <p>• {t('userManual.coach.history.feature3')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.payments.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.coach.payments.feature1')}</p>
                  <p>• {t('userManual.coach.payments.feature2')}</p>
                  <p>• {t('userManual.coach.payments.feature3')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.coach.logout.title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{t('userManual.coach.logout.description')}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Athlete Manual */}
            <TabsContent value="athlete" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.login.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>{t('userManual.athlete.login.step1')}</li>
                    <li>{t('userManual.athlete.login.step2')}</li>
                    <li>{t('userManual.athlete.login.step3')}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.tabs.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.athlete.tabs.personal')}</p>
                  <p>• {t('userManual.athlete.tabs.training')}</p>
                  <p>• {t('userManual.athlete.tabs.attendance')}</p>
                  <p>• {t('userManual.athlete.tabs.championships')}</p>
                  <p>• {t('userManual.athlete.tabs.media')}</p>
                  <p>• {t('userManual.athlete.tabs.internships')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.personal.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.athlete.personal.feature1')}</p>
                  <p>• {t('userManual.athlete.personal.feature2')}</p>
                  <p>• {t('userManual.athlete.personal.feature3')}</p>
                  <p>• {t('userManual.athlete.personal.feature4')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.training.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.athlete.training.feature1')}</p>
                  <p>• {t('userManual.athlete.training.feature2')}</p>
                  <p>• {t('userManual.athlete.training.feature3')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.attendance.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.athlete.attendance.feature1')}</p>
                  <p>• {t('userManual.athlete.attendance.feature2')}</p>
                  <p>• {t('userManual.athlete.attendance.feature3')}</p>
                  <p>• {t('userManual.athlete.attendance.feature4')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.championships.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.athlete.championships.feature1')}</p>
                  <p>• {t('userManual.athlete.championships.feature2')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.media.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.athlete.media.feature1')}</p>
                  <p>• {t('userManual.athlete.media.feature2')}</p>
                  <p>• {t('userManual.athlete.media.feature3')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.internships.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.athlete.internships.feature1')}</p>
                  <p>• {t('userManual.athlete.internships.feature2')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.refresh.title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{t('userManual.athlete.refresh.description')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.athlete.logout.title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{t('userManual.athlete.logout.description')}</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guardian Manual */}
            <TabsContent value="guardian" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.login.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>{t('userManual.guardian.login.step1')}</li>
                    <li>{t('userManual.guardian.login.step2')}</li>
                    <li>{t('userManual.guardian.login.step3')}</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.family.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.family.feature1')}</p>
                  <p>• {t('userManual.guardian.family.feature2')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.tabs.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.tabs.overview')}</p>
                  <p>• {t('userManual.guardian.tabs.payments')}</p>
                  <p>• {t('userManual.guardian.tabs.media')}</p>
                  <p>• {t('userManual.guardian.tabs.championships')}</p>
                  <p>• {t('userManual.guardian.tabs.internships')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.overview.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.overview.feature1')}</p>
                  <p>• {t('userManual.guardian.overview.feature2')}</p>
                  <p>• {t('userManual.guardian.overview.feature3')}</p>
                  <p>• {t('userManual.guardian.overview.feature4')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.pack.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.pack.feature1')}</p>
                  <p>• {t('userManual.guardian.pack.feature2')}</p>
                  <p>• {t('userManual.guardian.pack.feature3')}</p>
                  <p>• {t('userManual.guardian.pack.feature4')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.payments.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.payments.feature1')}</p>
                  <p>• {t('userManual.guardian.payments.feature2')}</p>
                  <p>• {t('userManual.guardian.payments.feature3')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.media.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.media.feature1')}</p>
                  <p>• {t('userManual.guardian.media.feature2')}</p>
                  <p>• {t('userManual.guardian.media.feature3')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.championships.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.championships.feature1')}</p>
                  <p>• {t('userManual.guardian.championships.feature2')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.internships.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>• {t('userManual.guardian.internships.feature1')}</p>
                  <p>• {t('userManual.guardian.internships.feature2')}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('userManual.guardian.logout.title')}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{t('userManual.guardian.logout.description')}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <AppFooter />
    </div>
  );
};

export default UserManual;
