import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Edit2, Save, X, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { z } from "zod";
import { useLanguage } from "@/i18n/LanguageContext";

interface Athlete {
  athlete_id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  mother_name: string | null;
  mother_email: string | null;
  mother_phone: number | null;
  father_name: string | null;
  father_email: string | null;
  father_phone: string | null;
  surf_level: string | null;
  trainings_per_week: number | null;
  training_days: string | null;
  transport: boolean | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  guardian_id: string | null;
  plan_type: string | null;
  is_active: boolean | null;
  prior_balance: number | null;
  daily_rate: number | null;
}

// Validation schema for athlete edits
const athleteEditSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  date_of_birth: z.string().nullable(),
  address: z.string().trim().max(255).nullable(),
  email: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim();
      return s === "" ? null : s;
    },
    z.string().email("Invalid email").max(255).nullable()
  ),
  phone: z.string().trim().max(20).nullable(),
  mother_name: z.string().trim().max(100).nullable(),
  mother_email: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim();
      return s === "" ? null : s;
    },
    z.string().email("Invalid email").max(255).nullable()
  ),
  mother_phone: z.number().nullable(),
  father_name: z.string().trim().max(100).nullable(),
  father_email: z.preprocess(
    (val) => {
      if (val === null || val === undefined) return null;
      const s = String(val).trim();
      return s === "" ? null : s;
    },
    z.string().email("Invalid email").max(255).nullable()
  ),
  father_phone: z.string().trim().max(20).nullable(),
  surf_level: z.enum(["learning", "pre-competition", "competition"]).nullable(),
  trainings_per_week: z.number().min(0).max(7).nullable(),
  training_days: z.string().trim().max(100).nullable(),
  transport: z.boolean().nullable(),
  pickup_address: z.string().trim().max(255).nullable(),
  dropoff_address: z.string().trim().max(255).nullable(),
  prior_balance: z.number().min(0).nullable(),
  plan_type: z.string().nullable(),
  daily_rate: z.number().min(0).nullable()
});

const AthleteManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Athlete>>({});
  const [userRole, setUserRole] = useState<string>('admin');

  // Session validation on mount - using legacy localStorage auth
  useEffect(() => {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) {
      toast({ title: t('login.sessionExpired'), variant: "destructive" });
      navigate("/login/administration");
      return;
    }

    try {
      const adminSession = JSON.parse(adminSessionStr);
      setUserRole(adminSession.role || 'admin');
    } catch (error) {
      console.error('Error parsing admin session:', error);
      toast({ title: t('login.sessionExpired'), variant: "destructive" });
      navigate("/login/administration");
    }
  }, [navigate, t, toast]);

  // Fetch all athletes for search
  const { data: athletes } = useQuery({
    queryKey: ['athletes-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atletas')
        .select('*')
        .order('first_name');
      
      if (error) throw error;
      return data as Athlete[];
    }
  });

  // Filter athletes based on search
  const filteredAthletes = athletes?.filter(athlete => 
    `${athlete.first_name} ${athlete.last_name}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    athlete.athlete_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAthleteSelect = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setSearchTerm(`${athlete.first_name} ${athlete.last_name}`);
    setEditForm(athlete);
    setIsEditing(false);
  };

  const handleEditStart = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    if (selectedAthlete) {
      setEditForm(selectedAthlete);
    }
    setIsEditing(false);
  };

  const handleToggleActive = async () => {
    if (!selectedAthlete) return;

    const newActiveStatus = !selectedAthlete.is_active;

    try {
      const { data: updatedAthlete, error } = await supabase
        .from('atletas')
        .update({ is_active: newActiveStatus })
        .eq('athlete_id', selectedAthlete.athlete_id)
        .select()
        .single();

      if (error) throw error;

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['athletes-all'] });
      setSelectedAthlete(updatedAthlete as Athlete);

      toast({
        title: t('admin.athleteManagement.success'),
        description: newActiveStatus ? t('admin.athleteManagement.athleteActivated') : t('admin.athleteManagement.athleteDeactivated')
      });
    } catch (error) {
      toast({
        title: t('admin.athleteManagement.error'),
        description: newActiveStatus ? t('admin.athleteManagement.failedToActivate') : t('admin.athleteManagement.failedToDeactivate'),
        variant: "destructive"
      });
    }
  };

  const handleEditSave = async () => {
    if (!selectedAthlete) return;

    try {
      // Convert empty strings to null for email fields
      const formToValidate = {
        ...editForm,
        email: editForm.email === "" ? null : editForm.email,
        mother_email: editForm.mother_email === "" ? null : editForm.mother_email,
        father_email: editForm.father_email === "" ? null : editForm.father_email
      };

      // Validate input
      const validated = athleteEditSchema.parse(formToValidate);

      // Update in Supabase and return the updated row
      const { data: updatedAthlete, error: updateError } = await supabase
        .from('atletas')
        .update(validated)
        .eq('athlete_id', selectedAthlete.athlete_id)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updatedAthlete) {
        console.warn('Update returned no row. Possible RLS or no match for athlete_id.', {
          athlete_id: selectedAthlete.athlete_id,
        });
        toast({
          title: t('admin.athleteManagement.updateNotApplied'),
          description: t('admin.athleteManagement.updateDescription'),
          variant: 'destructive',
        });
        return;
      }

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['athletes-all'] });

      // Update selected athlete with value returned by DB
      setSelectedAthlete(updatedAthlete as Athlete);

      toast({
        title: t('admin.athleteManagement.success'),
        description: t('admin.athleteManagement.athleteUpdated')
      });

      setIsEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: t('admin.athleteManagement.validationError'),
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: t('admin.athleteManagement.error'),
          description: t('admin.athleteManagement.failedToUpdate'),
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title={t('admin.athleteManagement.title')} showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-title">{t('admin.athleteManagement.title')}</h2>
          <p className="text-muted-foreground">{t('admin.athleteManagement.subtitle')}</p>
        </div>

        {/* Search Bar */}
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="text-title text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              {t('admin.athleteManagement.athleteSearch')}
            </CardTitle>
            <CardDescription>{t('admin.athleteManagement.searchDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('admin.athleteManagement.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 touch-friendly"
              />
              
              {/* Search Results Dropdown */}
              {searchTerm && !selectedAthlete && filteredAthletes.length > 0 && (
                <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-card border shadow-lg">
                  <CardContent className="p-2">
                    {filteredAthletes.map((athlete) => (
                      <Button
                        key={athlete.athlete_id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleAthleteSelect(athlete)}
                      >
                        {athlete.first_name} {athlete.last_name} - {athlete.athlete_id}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Clear Selection */}
            {selectedAthlete && (
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium">{t('admin.athleteManagement.selectedAthlete')}</p>
                      {selectedAthlete.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          <UserCheck className="h-3 w-3" />
                          {t('admin.athleteManagement.active')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          <UserX className="h-3 w-3" />
                          {t('admin.athleteManagement.inactive')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedAthlete.first_name} {selectedAthlete.last_name} ({selectedAthlete.athlete_id})
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAthlete(null);
                      setSearchTerm("");
                      setIsEditing(false);
                    }}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {!isEditing && userRole !== 'reports_viewer' && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditStart}
                      className="flex-1 sm:flex-none"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      {t('admin.athleteManagement.editProfile')}
                    </Button>
                    <Button
                      variant={selectedAthlete.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={handleToggleActive}
                      className="flex-1 sm:flex-none"
                    >
                      {selectedAthlete.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          {t('admin.athleteManagement.deactivate')}
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          {t('admin.athleteManagement.activate')}
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Athlete Details - Only show when athlete selected */}
        {selectedAthlete && (
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-title">{t('admin.athleteManagement.athleteProfile')}</CardTitle>
                  <CardDescription>
                    {isEditing ? t('admin.athleteManagement.editInfo') : t('admin.athleteManagement.viewInfo')}
                  </CardDescription>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="default" onClick={handleEditSave}>
                      <Save className="h-4 w-4 mr-1" />
                      {t('admin.athleteManagement.save')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleEditCancel}>
                      <X className="h-4 w-4 mr-1" />
                      {t('admin.athleteManagement.cancel')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">{t('admin.athleteManagement.personal')}</TabsTrigger>
                  <TabsTrigger value="parents">{t('admin.athleteManagement.parents')}</TabsTrigger>
                  <TabsTrigger value="training">{t('admin.athleteManagement.training')}</TabsTrigger>
                </TabsList>
                
                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name" className="text-title">{t('admin.athleteManagement.firstName')} *</Label>
                      {isEditing ? (
                        <Input
                          id="first_name"
                          value={editForm.first_name || ""}
                          onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.first_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="last_name" className="text-title">{t('admin.athleteManagement.lastName')} *</Label>
                      {isEditing ? (
                        <Input
                          id="last_name"
                          value={editForm.last_name || ""}
                          onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.last_name || "-"}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="date_of_birth" className="text-title">{t('admin.athleteManagement.dateOfBirth')}</Label>
                      {isEditing ? (
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={editForm.date_of_birth || ""}
                          onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.date_of_birth || "-"}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-title">{t('admin.athleteManagement.phone')}</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          value={editForm.phone || ""}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.phone || "-"}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email" className="text-title">{t('admin.athleteManagement.email')}</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          type="email"
                          value={editForm.email || ""}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.email || "-"}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="address" className="text-title">{t('admin.athleteManagement.address')}</Label>
                      {isEditing ? (
                        <Input
                          id="address"
                          value={editForm.address || ""}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.address || "-"}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Parents Information Tab */}
                <TabsContent value="parents" className="space-y-6 mt-4">
                  <div className="space-y-4">
                    <h4 className="font-medium text-title">{t('admin.athleteManagement.motherName')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="mother_name" className="text-title">{t('admin.athleteManagement.motherName')}</Label>
                        {isEditing ? (
                          <Input
                            id="mother_name"
                            value={editForm.mother_name || ""}
                            onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1 break-words">{selectedAthlete.mother_name || "-"}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Label htmlFor="mother_phone" className="text-title">{t('admin.athleteManagement.motherPhone')}</Label>
                        {isEditing ? (
                          <Input
                            id="mother_phone"
                            type="number"
                            value={editForm.mother_phone || ""}
                            onChange={(e) => setEditForm({ ...editForm, mother_phone: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1 break-words">{selectedAthlete.mother_phone ? `+${selectedAthlete.mother_phone}` : "-"}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Label htmlFor="mother_email" className="text-title">{t('admin.athleteManagement.motherEmail')}</Label>
                        {isEditing ? (
                          <Input
                            id="mother_email"
                            type="email"
                            value={editForm.mother_email || ""}
                            onChange={(e) => setEditForm({ ...editForm, mother_email: e.target.value })}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1 break-all">{selectedAthlete.mother_email || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-title">{t('admin.athleteManagement.fatherName')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="father_name" className="text-title">{t('admin.athleteManagement.fatherName')}</Label>
                        {isEditing ? (
                          <Input
                            id="father_name"
                            value={editForm.father_name || ""}
                            onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1 break-words">{selectedAthlete.father_name || "-"}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Label htmlFor="father_phone" className="text-title">{t('admin.athleteManagement.fatherPhone')}</Label>
                        {isEditing ? (
                          <Input
                            id="father_phone"
                            value={editForm.father_phone || ""}
                            onChange={(e) => setEditForm({ ...editForm, father_phone: e.target.value })}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1 break-words">{selectedAthlete.father_phone || "-"}</p>
                        )}
                      </div>

                      <div className="min-w-0">
                        <Label htmlFor="father_email" className="text-title">{t('admin.athleteManagement.fatherEmail')}</Label>
                        {isEditing ? (
                          <Input
                            id="father_email"
                            type="email"
                            value={editForm.father_email || ""}
                            onChange={(e) => setEditForm({ ...editForm, father_email: e.target.value })}
                            className="w-full"
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1 break-all">{selectedAthlete.father_email || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Training Information Tab */}
                <TabsContent value="training" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plan_type" className="text-title">{t('admin.athleteManagement.planType')}</Label>
                      {isEditing ? (
                        <Select
                          value={editForm.plan_type || ""}
                          onValueChange={(value) => setEditForm({ ...editForm, plan_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.athleteManagement.selectPlanType')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="month">{t('admin.athleteManagement.planMonth')}</SelectItem>
                            <SelectItem value="pack1">{t('admin.athleteManagement.planPack1')}</SelectItem>
                            <SelectItem value="pack5">{t('admin.athleteManagement.planPack5')}</SelectItem>
                            <SelectItem value="pack10">{t('admin.athleteManagement.planPack10')}</SelectItem>
                            <SelectItem value="daily">{t('admin.athleteManagement.planDaily')}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.plan_type || "-"}</p>
                      )}
                    </div>

                    {/* Daily Rate - only show when plan_type is daily */}
                    {(isEditing ? editForm.plan_type : selectedAthlete.plan_type) === 'daily' && (
                      <div>
                        <Label htmlFor="daily_rate" className="text-title">{t('admin.athleteManagement.dailyRate')}</Label>
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">€</span>
                            <Input
                              id="daily_rate"
                              type="number"
                              min="0"
                              step="0.01"
                              value={(editForm as any).daily_rate ?? 35}
                              onChange={(e) => setEditForm({ ...editForm, daily_rate: e.target.value ? parseFloat(e.target.value) : 35 } as any)}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">€{((selectedAthlete as any).daily_rate || 35).toFixed(2)}</p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="surf_level" className="text-title">{t('admin.athleteManagement.surfLevel')}</Label>
                      {isEditing ? (
                        <Select
                          value={editForm.surf_level || ""}
                          onValueChange={(value) => setEditForm({ ...editForm, surf_level: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin.athleteManagement.surfLevel')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="learning">{t('admin.athleteManagement.learning')}</SelectItem>
                            <SelectItem value="pre-competition">{t('admin.athleteManagement.preCompetition')}</SelectItem>
                            <SelectItem value="competition">{t('admin.athleteManagement.competition')}</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.surf_level || "-"}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="trainings_per_week">{t('admin.athleteManagement.trainingsPerWeek')}</Label>
                      {isEditing ? (
                        <Input
                          id="trainings_per_week"
                          type="number"
                          min="0"
                          max="7"
                          value={editForm.trainings_per_week || ""}
                          onChange={(e) => setEditForm({ ...editForm, trainings_per_week: e.target.value ? parseInt(e.target.value) : null })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.trainings_per_week || "-"}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="training_days">{t('admin.athleteManagement.trainingDays')}</Label>
                      {isEditing ? (
                        <Input
                          id="training_days"
                          placeholder={t('admin.athleteManagement.trainingDaysPlaceholder')}
                          value={editForm.training_days || ""}
                          onChange={(e) => setEditForm({ ...editForm, training_days: e.target.value })}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.training_days || "-"}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="transport" className="flex items-center gap-2">
                        <input
                          id="transport"
                          type="checkbox"
                          checked={isEditing ? (editForm.transport || false) : (selectedAthlete.transport || false)}
                          onChange={(e) => isEditing && setEditForm({ ...editForm, transport: e.target.checked })}
                          disabled={!isEditing}
                          className="h-4 w-4"
                        />
                        {t('admin.athleteManagement.requiresTransport')}
                      </Label>
                    </div>

                    {(isEditing ? editForm.transport : selectedAthlete.transport) && (
                      <>
                        <div className="md:col-span-2">
                          <Label htmlFor="pickup_address">{t('admin.athleteManagement.pickupAddress')}</Label>
                          {isEditing ? (
                            <Input
                              id="pickup_address"
                              value={editForm.pickup_address || ""}
                              onChange={(e) => setEditForm({ ...editForm, pickup_address: e.target.value })}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.pickup_address || "-"}</p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="dropoff_address">{t('admin.athleteManagement.dropoffAddress')}</Label>
                          {isEditing ? (
                            <Input
                              id="dropoff_address"
                              value={editForm.dropoff_address || ""}
                              onChange={(e) => setEditForm({ ...editForm, dropoff_address: e.target.value })}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.dropoff_address || "-"}</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Prior Balance Field */}
                    <div className="md:col-span-2 pt-4 border-t border-border">
                      <Label htmlFor="prior_balance" className="text-title">{t('admin.athleteManagement.priorBalance')}</Label>
                      <p className="text-xs text-muted-foreground mb-2">{t('admin.athleteManagement.priorBalanceDescription')}</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">€</span>
                          <Input
                            id="prior_balance"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.prior_balance ?? ""}
                            onChange={(e) => setEditForm({ ...editForm, prior_balance: e.target.value ? parseFloat(e.target.value) : null })}
                            className="w-32"
                          />
                        </div>
                      ) : (
                        <p className={`text-sm mt-1 ${(selectedAthlete.prior_balance || 0) > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          €{(selectedAthlete.prior_balance || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AthleteManagement;
