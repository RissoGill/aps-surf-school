import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";

const coachSchema = z.object({
  coach_id: z.string().min(1, "Coach ID is required"),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(20).nullable().optional(),
  coach_user_id: z.string().max(100).nullable().optional(),
  coach_password: z.string().max(100).nullable().optional(),
  status: z.boolean().optional(),
});

const athleteSchema = z.object({
  athlete_id: z.string().min(1, "Athlete ID is required"),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255).nullable().optional().or(z.literal("")),
  phone: z.string().max(20).nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  mother_name: z.string().max(100).nullable().optional(),
  mother_email: z.string().email("Invalid email").max(255).nullable().optional().or(z.literal("")),
  mother_phone: z.string().max(20).nullable().optional(),
  father_name: z.string().max(100).nullable().optional(),
  father_email: z.string().email("Invalid email").max(255).nullable().optional().or(z.literal("")),
  father_phone: z.string().max(20).nullable().optional(),
  plan_type: z.string().max(50).nullable().optional(),
  surf_level: z.string().max(50).nullable().optional(),
  training_days: z.string().max(200).nullable().optional(),
  trainings_per_week: z.number().int().min(0).max(7).nullable().optional(),
  transport: z.boolean().nullable().optional(),
  pickup_address: z.string().max(500).nullable().optional(),
  dropoff_address: z.string().max(500).nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  guardian_id: z.string().max(100).nullable().optional(),
  sql_line: z.string().max(1000).nullable().optional(),
});

const guardianSchema = z.object({
  email: z.string().email("Invalid email").max(255),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  phone: z.string().max(20).nullable().optional(),
});

type Coach = z.infer<typeof coachSchema> & { auth_uid?: string };
type Athlete = z.infer<typeof athleteSchema>;
type Guardian = z.infer<typeof guardianSchema> & { id?: string; auth_uid?: string; created_at?: string };

const UserManagement = () => {
  const navigate = useNavigate();
  const [sessionValid, setSessionValid] = useState(false);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("coaches");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Session expired. Please log in again.");
        navigate("/auth/administration");
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error("Access denied. Super admin privileges required.");
        navigate("/auth/administration");
        return;
      }

      setSessionValid(true);
    };

    validateSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth/administration");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (sessionValid) {
      fetchAllUsers();
    }
  }, [sessionValid]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const { data: coachesData, error: coachError } = await supabase.from('coach').select('*').order('first_name');
      if (coachError) throw coachError;
      setCoaches(coachesData || []);

      const { data: athletesData, error: athleteError } = await supabase.from('atletas').select('*').order('first_name');
      if (athleteError) throw athleteError;
      setAthletes(athletesData || []);

      const { data: guardiansData, error: guardianError } = await supabase.from('guardians').select('*').order('first_name');
      if (guardianError) throw guardianError;
      setGuardians(guardiansData || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateId = (prefix: string) => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  const handleAdd = () => {
    setSelectedUser(null);
    if (activeTab === "coaches") {
      setFormData({ coach_id: generateId("C"), status: true });
    } else if (activeTab === "athletes") {
      setFormData({ athlete_id: generateId("A"), is_active: true, transport: false });
    } else {
      setFormData({});
    }
    setIsAddDialogOpen(true);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setFormData(user);
    setIsEditDialogOpen(true);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setOpen(false);
    let user = null;
    if (activeTab === "coaches") {
      user = coaches.find(c => c.coach_id === userId);
    } else if (activeTab === "athletes") {
      user = athletes.find(a => a.athlete_id === userId);
    } else if (activeTab === "guardians") {
      user = guardians.find(g => g.id === userId);
    }
    if (user) {
      handleEdit(user);
    }
  };

  const getSelectedUserLabel = () => {
    if (!selectedUserId) return "Select user...";
    let user = null;
    if (activeTab === "coaches") {
      user = coaches.find(c => c.coach_id === selectedUserId);
      if (user) return `${user.first_name} ${user.last_name} - ${user.email}`;
    } else if (activeTab === "athletes") {
      user = athletes.find(a => a.athlete_id === selectedUserId);
      if (user) return `${user.first_name} ${user.last_name} - ${user.email || user.athlete_id}`;
    } else if (activeTab === "guardians") {
      user = guardians.find(g => g.id === selectedUserId);
      if (user) return `${user.first_name} ${user.last_name} - ${user.email}`;
    }
    return "Select user...";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === "coaches") {
        const validatedData = coachSchema.parse(formData);
        if (selectedUser) {
          const { error } = await supabase.from('coach').update(validatedData).eq('coach_id', selectedUser.coach_id);
          if (error) throw error;
          toast.success("Coach updated successfully");
        } else {
          const { error } = await supabase.from('coach').insert([validatedData]);
          if (error) throw error;
          toast.success("Coach added successfully");
        }
      } else if (activeTab === "athletes") {
        const dataToValidate = { ...formData };
        if (dataToValidate.mother_phone) dataToValidate.mother_phone = dataToValidate.mother_phone.toString();
        if (dataToValidate.trainings_per_week) dataToValidate.trainings_per_week = parseInt(dataToValidate.trainings_per_week);
        
        const validatedData = athleteSchema.parse(dataToValidate);
        const supabaseData: any = { ...validatedData };
        if (supabaseData.mother_phone) supabaseData.mother_phone = parseInt(supabaseData.mother_phone);
        
        if (selectedUser) {
          const { error } = await supabase.from('atletas').update(supabaseData).eq('athlete_id', selectedUser.athlete_id);
          if (error) throw error;
          toast.success("Athlete updated successfully");
        } else {
          const { error } = await supabase.from('atletas').insert([supabaseData]);
          if (error) throw error;
          toast.success("Athlete added successfully");
        }
      } else if (activeTab === "guardians") {
        const validatedData = guardianSchema.parse(formData);
        if (selectedUser) {
          const { error } = await supabase.from('guardians').update(validatedData).eq('id', selectedUser.id);
          if (error) throw error;
          toast.success("Guardian updated successfully");
        } else {
          const { error } = await supabase.from('guardians').insert([validatedData]);
          if (error) throw error;
          toast.success("Guardian added successfully");
        }
      }
      
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedUserId("");
      fetchAllUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      if (error instanceof z.ZodError) {
        toast.error("Validation error: " + error.errors[0].message);
      } else {
        toast.error("Failed to save user: " + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };


  if (!sessionValid) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <AppHeader title="User Management" showBack backTo="/admin" />
        <main className="mobile-container py-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Skeleton className="h-8 w-48 mx-auto" />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="User Management" showBack backTo="/admin" />
      
      <main className="mobile-container py-6">
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>Add, edit coaches, athletes, and guardians</CardDescription>
              </div>
              <Button onClick={handleAdd} className="touch-friendly">
                <UserPlus className="h-4 w-4 mr-2" />
                Add New
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setSelectedUserId(""); setOpen(false); }}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="coaches">Coaches</TabsTrigger>
                <TabsTrigger value="athletes">Athletes</TabsTrigger>
                <TabsTrigger value="guardians">Guardians</TabsTrigger>
              </TabsList>

              <TabsContent value="coaches">
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Select Coach</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {getSelectedUserLabel()}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search coaches..." />
                            <CommandList>
                              <CommandEmpty>No coach found.</CommandEmpty>
                              <CommandGroup>
                                {coaches.map((coach) => (
                                  <CommandItem
                                    key={coach.coach_id}
                                    value={`${coach.first_name} ${coach.last_name} ${coach.email} ${coach.coach_id}`}
                                    onSelect={() => handleUserSelect(coach.coach_id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedUserId === coach.coach_id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {coach.first_name} {coach.last_name} - {coach.email}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="athletes">
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Select Athlete</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {getSelectedUserLabel()}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search athletes..." />
                            <CommandList>
                              <CommandEmpty>No athlete found.</CommandEmpty>
                              <CommandGroup>
                                {athletes.map((athlete) => (
                                  <CommandItem
                                    key={athlete.athlete_id}
                                    value={`${athlete.first_name} ${athlete.last_name} ${athlete.email} ${athlete.athlete_id}`}
                                    onSelect={() => handleUserSelect(athlete.athlete_id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedUserId === athlete.athlete_id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {athlete.first_name} {athlete.last_name} - {athlete.email || athlete.athlete_id}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="guardians">
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Select Guardian</Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {getSelectedUserLabel()}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search guardians..." />
                            <CommandList>
                              <CommandEmpty>No guardian found.</CommandEmpty>
                              <CommandGroup>
                                {guardians.map((guardian) => (
                                  <CommandItem
                                    key={guardian.id}
                                    value={`${guardian.first_name} ${guardian.last_name} ${guardian.email} ${guardian.id}`}
                                    onSelect={() => handleUserSelect(guardian.id || "")}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedUserId === guardian.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {guardian.first_name} {guardian.last_name} - {guardian.email}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New {activeTab === "coaches" ? "Coach" : activeTab === "athletes" ? "Athlete" : "Guardian"}</DialogTitle>
              <DialogDescription>Fill in all required fields</DialogDescription>
            </DialogHeader>
            
            {activeTab === "coaches" && <CoachForm formData={formData} setFormData={setFormData} isEdit={false} />}
            {activeTab === "athletes" && <AthleteForm formData={formData} setFormData={setFormData} isEdit={false} />}
            {activeTab === "guardians" && <GuardianForm formData={formData} setFormData={setFormData} isEdit={false} />}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {activeTab === "coaches" ? "Coach" : activeTab === "athletes" ? "Athlete" : "Guardian"}</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            
            {activeTab === "coaches" && <CoachForm formData={formData} setFormData={setFormData} isEdit={true} />}
            {activeTab === "athletes" && <AthleteForm formData={formData} setFormData={setFormData} isEdit={true} />}
            {activeTab === "guardians" && <GuardianForm formData={formData} setFormData={setFormData} isEdit={true} />}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
      
      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

const CoachForm = ({ formData, setFormData, isEdit }: any) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label htmlFor="coach_id">Coach ID *</Label><Input id="coach_id" value={formData.coach_id || ''} onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })} disabled={isEdit} /></div>
      <div><Label htmlFor="status">Status</Label><div className="flex items-center space-x-2 mt-2"><Switch id="status" checked={formData.status || false} onCheckedChange={(checked) => setFormData({ ...formData, status: checked })} /><span className="text-sm text-foreground">{formData.status ? 'Active' : 'Inactive'}</span></div></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label htmlFor="first_name">First Name *</Label><Input id="first_name" value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} /></div>
      <div><Label htmlFor="last_name">Last Name *</Label><Input id="last_name" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
      <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div><Label htmlFor="coach_user_id">User ID</Label><Input id="coach_user_id" value={formData.coach_user_id || ''} onChange={(e) => setFormData({ ...formData, coach_user_id: e.target.value })} /></div>
      <div><Label htmlFor="coach_password">Password</Label><Input id="coach_password" type="password" value={formData.coach_password || ''} onChange={(e) => setFormData({ ...formData, coach_password: e.target.value })} /></div>
    </div>
    {isEdit && formData.auth_uid && <div><Label htmlFor="auth_uid">Auth UID (read-only)</Label><Input id="auth_uid" value={formData.auth_uid} disabled className="bg-muted" /></div>}
  </div>
);

const AthleteForm = ({ formData, setFormData, isEdit }: any) => (
  <div className="space-y-6">
    <div><h4 className="text-sm font-semibold mb-3 text-foreground">Personal Information</h4><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="athlete_id">Athlete ID *</Label><Input id="athlete_id" value={formData.athlete_id || ''} onChange={(e) => setFormData({ ...formData, athlete_id: e.target.value })} disabled={isEdit} /></div><div><Label htmlFor="is_active">Status</Label><div className="flex items-center space-x-2 mt-2"><Switch id="is_active" checked={formData.is_active !== false} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} /><span className="text-sm text-foreground">{formData.is_active !== false ? 'Active' : 'Inactive'}</span></div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="first_name">First Name *</Label><Input id="first_name" value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} /></div><div><Label htmlFor="last_name">Last Name *</Label><Input id="last_name" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div><div><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="date_of_birth">Date of Birth</Label><Input id="date_of_birth" type="date" value={formData.date_of_birth || ''} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} /></div><div><Label htmlFor="guardian_id">Guardian ID</Label><Input id="guardian_id" value={formData.guardian_id || ''} onChange={(e) => setFormData({ ...formData, guardian_id: e.target.value })} /></div></div><div><Label htmlFor="address">Address</Label><Textarea id="address" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} rows={2} /></div></div></div>
    <div><h4 className="text-sm font-semibold mb-3 text-foreground">Training Information</h4><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="surf_level">Surf Level</Label><Select value={formData.surf_level || ''} onValueChange={(value) => setFormData({ ...formData, surf_level: value })}><SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger><SelectContent><SelectItem value="Learning">Learning</SelectItem><SelectItem value="Pre-Competition">Pre-Competition</SelectItem><SelectItem value="Competition">Competition</SelectItem></SelectContent></Select></div><div><Label htmlFor="plan_type">Plan Type</Label><Input id="plan_type" value={formData.plan_type || ''} onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} /></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="trainings_per_week">Trainings Per Week</Label><Input id="trainings_per_week" type="number" min="0" max="7" value={formData.trainings_per_week || ''} onChange={(e) => setFormData({ ...formData, trainings_per_week: parseInt(e.target.value) || null })} /></div><div><Label htmlFor="training_days">Training Days</Label><Input id="training_days" value={formData.training_days || ''} onChange={(e) => setFormData({ ...formData, training_days: e.target.value })} placeholder="e.g., Mon, Wed, Fri" /></div></div></div></div>
    <div><h4 className="text-sm font-semibold mb-3 text-foreground">Guardian Information</h4><div className="space-y-4"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><Label htmlFor="mother_name">Mother's Name</Label><Input id="mother_name" value={formData.mother_name || ''} onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} /></div><div><Label htmlFor="mother_email">Mother's Email</Label><Input id="mother_email" type="email" value={formData.mother_email || ''} onChange={(e) => setFormData({ ...formData, mother_email: e.target.value })} /></div><div><Label htmlFor="mother_phone">Mother's Phone</Label><Input id="mother_phone" value={formData.mother_phone || ''} onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })} /></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><Label htmlFor="father_name">Father's Name</Label><Input id="father_name" value={formData.father_name || ''} onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} /></div><div><Label htmlFor="father_email">Father's Email</Label><Input id="father_email" type="email" value={formData.father_email || ''} onChange={(e) => setFormData({ ...formData, father_email: e.target.value })} /></div><div><Label htmlFor="father_phone">Father's Phone</Label><Input id="father_phone" value={formData.father_phone || ''} onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })} /></div></div></div></div>
    <div><h4 className="text-sm font-semibold mb-3 text-foreground">Transport Information</h4><div className="space-y-4"><div><Label htmlFor="transport">Requires Transport</Label><div className="flex items-center space-x-2 mt-2"><Switch id="transport" checked={formData.transport || false} onCheckedChange={(checked) => setFormData({ ...formData, transport: checked })} /><span className="text-sm text-foreground">{formData.transport ? 'Yes' : 'No'}</span></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="pickup_address">Pickup Address</Label><Textarea id="pickup_address" value={formData.pickup_address || ''} onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })} rows={2} /></div><div><Label htmlFor="dropoff_address">Dropoff Address</Label><Textarea id="dropoff_address" value={formData.dropoff_address || ''} onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })} rows={2} /></div></div></div></div>
    <div><h4 className="text-sm font-semibold mb-3 text-foreground">Additional Information</h4><div><Label htmlFor="sql_line">SQL Line (Optional)</Label><Textarea id="sql_line" value={formData.sql_line || ''} onChange={(e) => setFormData({ ...formData, sql_line: e.target.value })} rows={2} /></div></div>
  </div>
);

const GuardianForm = ({ formData, setFormData, isEdit }: any) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="first_name">First Name *</Label><Input id="first_name" value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} /></div><div><Label htmlFor="last_name">Last Name *</Label><Input id="last_name" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} /></div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><Label htmlFor="email">Email *</Label><Input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div><div><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div></div>
    {isEdit && <div className="space-y-4 pt-4 border-t border-border"><div><Label htmlFor="id">Guardian ID (read-only)</Label><Input id="id" value={formData.id || ''} disabled className="bg-muted" /></div>{formData.auth_uid && <div><Label htmlFor="auth_uid">Auth UID (read-only)</Label><Input id="auth_uid" value={formData.auth_uid} disabled className="bg-muted" /></div>}{formData.created_at && <div><Label htmlFor="created_at">Created At (read-only)</Label><Input id="created_at" value={new Date(formData.created_at).toLocaleString()} disabled className="bg-muted" /></div>}</div>}
  </div>
);

export default UserManagement;
