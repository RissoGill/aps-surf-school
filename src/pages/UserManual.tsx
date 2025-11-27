import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import { Download, LogIn, LayoutDashboard, CheckSquare, Users, Trophy, Plane, History, CreditCard, User, Calendar, Camera, RefreshCw, LogOut } from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { useState } from "react";

const UserManual = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("coach");
  
  const downloadPDF = async () => {
    try {
      const element = document.getElementById('manual-content');
      if (!element) return;
      
      const opt = {
        margin: 10,
        filename: `manual-utilizador-${activeTab}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().from(element).set(opt).save();
      toast.success(t('userManual.downloadSuccess'));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('userManual.downloadError'));
    }
  };
  
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        
        <main className="flex-1 mobile-container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-normal mb-4">{t('userManual.title')}</h1>
              <p className="text-muted-foreground mb-4">{t('userManual.subtitle')}</p>
              <Button onClick={downloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                {t('userManual.downloadPdf')}
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="coach">{t('userManual.coach.title')}</TabsTrigger>
                <TabsTrigger value="athlete">{t('userManual.athlete.title')}</TabsTrigger>
                <TabsTrigger value="guardian">{t('userManual.guardian.title')}</TabsTrigger>
              </TabsList>

              {/* Coach Manual */}
              <TabsContent value="coach" className="space-y-6" id="manual-content">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LogIn className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.login.title')}</h3>
                    <CardDescription>{t('userManual.coach.login.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.login.step1')}</li>
                      <li>{t('userManual.coach.login.step2')}</li>
                      <li>{t('userManual.coach.login.step3')}</li>
                      <li>{t('userManual.coach.login.step4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LayoutDashboard className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.dashboard.title')}</h3>
                    <CardDescription>{t('userManual.coach.dashboard.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.dashboard.feature1')}</li>
                      <li>{t('userManual.coach.dashboard.feature2')}</li>
                      <li>{t('userManual.coach.dashboard.feature3')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <CheckSquare className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.attendance.title')}</h3>
                    <CardDescription>{t('userManual.coach.attendance.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.attendance.step1')}</li>
                      <li>{t('userManual.coach.attendance.step2')}</li>
                      <li>{t('userManual.coach.attendance.step3')}</li>
                      <li>{t('userManual.coach.attendance.step4')}</li>
                      <li>{t('userManual.coach.attendance.step5')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Users className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.bulkAttendance.title')}</h3>
                    <CardDescription>{t('userManual.coach.bulkAttendance.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.bulkAttendance.step1')}</li>
                      <li>{t('userManual.coach.bulkAttendance.step2')}</li>
                      <li>{t('userManual.coach.bulkAttendance.step3')}</li>
                      <li>{t('userManual.coach.bulkAttendance.step4')}</li>
                      <li>{t('userManual.coach.bulkAttendance.step5')}</li>
                      <li>{t('userManual.coach.bulkAttendance.step6')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.profile.title')}</h3>
                    <CardDescription>{t('userManual.coach.profile.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.profile.info1')}</li>
                      <li>{t('userManual.coach.profile.info2')}</li>
                      <li>{t('userManual.coach.profile.info3')}</li>
                      <li>{t('userManual.coach.profile.info4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Trophy className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.championships.title')}</h3>
                    <CardDescription>{t('userManual.coach.championships.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.championships.action1')}</li>
                      <li>{t('userManual.coach.championships.action2')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Plane className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.internships.title')}</h3>
                    <CardDescription>{t('userManual.coach.internships.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.internships.action1')}</li>
                      <li>{t('userManual.coach.internships.action2')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <History className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.history.title')}</h3>
                    <CardDescription>{t('userManual.coach.history.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.history.feature1')}</li>
                      <li>{t('userManual.coach.history.feature2')}</li>
                      <li>{t('userManual.coach.history.feature3')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <CreditCard className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.payments.title')}</h3>
                    <CardDescription>{t('userManual.coach.payments.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.payments.feature1')}</li>
                      <li>{t('userManual.coach.payments.feature2')}</li>
                      <li>{t('userManual.coach.payments.feature3')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LogOut className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.coach.logout.title')}</h3>
                    <CardDescription>{t('userManual.coach.logout.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.coach.logout.step1')}</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Athlete Manual */}
              <TabsContent value="athlete" className="space-y-6" id="manual-content">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LogIn className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.login.title')}</h3>
                    <CardDescription>{t('userManual.athlete.login.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.login.step1')}</li>
                      <li>{t('userManual.athlete.login.step2')}</li>
                      <li>{t('userManual.athlete.login.step3')}</li>
                      <li>{t('userManual.athlete.login.step4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LayoutDashboard className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.tabs.title')}</h3>
                    <CardDescription>{t('userManual.athlete.tabs.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.tabs.tab1')}</li>
                      <li>{t('userManual.athlete.tabs.tab2')}</li>
                      <li>{t('userManual.athlete.tabs.tab3')}</li>
                      <li>{t('userManual.athlete.tabs.tab4')}</li>
                      <li>{t('userManual.athlete.tabs.tab5')}</li>
                      <li>{t('userManual.athlete.tabs.tab6')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <User className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.personalData.title')}</h3>
                    <CardDescription>{t('userManual.athlete.personalData.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.personalData.info1')}</li>
                      <li>{t('userManual.athlete.personalData.info2')}</li>
                      <li>{t('userManual.athlete.personalData.info3')}</li>
                      <li>{t('userManual.athlete.personalData.info4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Calendar className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.training.title')}</h3>
                    <CardDescription>{t('userManual.athlete.training.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.training.info1')}</li>
                      <li>{t('userManual.athlete.training.info2')}</li>
                      <li>{t('userManual.athlete.training.info3')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <CheckSquare className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.attendance.title')}</h3>
                    <CardDescription>{t('userManual.athlete.attendance.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.attendance.feature1')}</li>
                      <li>{t('userManual.athlete.attendance.feature2')}</li>
                      <li>{t('userManual.athlete.attendance.feature3')}</li>
                      <li>{t('userManual.athlete.attendance.feature4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Trophy className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.championships.title')}</h3>
                    <CardDescription>{t('userManual.athlete.championships.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.championships.info1')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Camera className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.media.title')}</h3>
                    <CardDescription>{t('userManual.athlete.media.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.media.feature1')}</li>
                      <li>{t('userManual.athlete.media.feature2')}</li>
                      <li>{t('userManual.athlete.media.feature3')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Plane className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.internships.title')}</h3>
                    <CardDescription>{t('userManual.athlete.internships.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.internships.info1')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <RefreshCw className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.refresh.title')}</h3>
                    <CardDescription>{t('userManual.athlete.refresh.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.refresh.step1')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LogOut className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.athlete.logout.title')}</h3>
                    <CardDescription>{t('userManual.athlete.logout.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.athlete.logout.step1')}</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Guardian Manual */}
              <TabsContent value="guardian" className="space-y-6" id="manual-content">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LogIn className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.login.title')}</h3>
                    <CardDescription>{t('userManual.guardian.login.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.login.step1')}</li>
                      <li>{t('userManual.guardian.login.step2')}</li>
                      <li>{t('userManual.guardian.login.step3')}</li>
                      <li>{t('userManual.guardian.login.step4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Users className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.familyArea.title')}</h3>
                    <CardDescription>{t('userManual.guardian.familyArea.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.familyArea.feature1')}</li>
                      <li>{t('userManual.guardian.familyArea.feature2')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LayoutDashboard className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.tabs.title')}</h3>
                    <CardDescription>{t('userManual.guardian.tabs.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.tabs.tab1')}</li>
                      <li>{t('userManual.guardian.tabs.tab2')}</li>
                      <li>{t('userManual.guardian.tabs.tab3')}</li>
                      <li>{t('userManual.guardian.tabs.tab4')}</li>
                      <li>{t('userManual.guardian.tabs.tab5')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LayoutDashboard className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.overview.title')}</h3>
                    <CardDescription>{t('userManual.guardian.overview.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.overview.feature1')}</li>
                      <li>{t('userManual.guardian.overview.feature2')}</li>
                      <li>{t('userManual.guardian.overview.feature3')}</li>
                      <li>{t('userManual.guardian.overview.feature4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <CheckSquare className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.pack.title')}</h3>
                    <CardDescription>{t('userManual.guardian.pack.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.pack.info1')}</li>
                      <li>{t('userManual.guardian.pack.info2')}</li>
                      <li>{t('userManual.guardian.pack.info3')}</li>
                      <li>{t('userManual.guardian.pack.info4')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <CreditCard className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.payments.title')}</h3>
                    <CardDescription>{t('userManual.guardian.payments.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.payments.feature1')}</li>
                      <li>{t('userManual.guardian.payments.feature2')}</li>
                      <li>{t('userManual.guardian.payments.feature3')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Camera className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.media.title')}</h3>
                    <CardDescription>{t('userManual.guardian.media.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.media.feature1')}</li>
                      <li>{t('userManual.guardian.media.feature2')}</li>
                      <li>{t('userManual.guardian.media.feature3')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Trophy className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.championships.title')}</h3>
                    <CardDescription>{t('userManual.guardian.championships.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.championships.info1')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <Plane className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.internships.title')}</h3>
                    <CardDescription>{t('userManual.guardian.internships.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.internships.info1')}</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                        <LogOut className="h-16 w-16 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-normal mb-2">{t('userManual.guardian.logout.title')}</h3>
                    <CardDescription>{t('userManual.guardian.logout.description')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="list-disc pl-6 space-y-2">
                      <li>{t('userManual.guardian.logout.step1')}</li>
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>

        <AppFooter />
      </div>
    </>
  );
};

export default UserManual;
