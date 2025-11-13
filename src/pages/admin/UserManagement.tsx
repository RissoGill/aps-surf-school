import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  email: z.string().email("Invalid email").max(255).nullable().optional(),
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("coaches");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

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

  const filteredCoaches = coaches.filter(coach => {
    const fullName = `${coach.first_name || ''} ${coach.last_name || ''}`.toLowerCase();
    const email = coach.email?.toLowerCase() || '';
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const filteredAthletes = athletes.filter(athlete => {
    const fullName = `${athlete.first_name || ''} ${athlete.last_name || ''}`.toLowerCase();
    const email = athlete.email?.toLowerCase() || '';
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const filteredGuardians = guardians.filter(guardian => {
    const fullName = `${guardian.first_name || ''} ${guardian.last_name || ''}`.toLowerCase();
    const email = guardian.email?.toLowerCase() || '';
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  const renderFormFields = () => {
    if (activeTab === "coaches") {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coach_id">Coach ID</Label>
              <Input id="coach_id" value={formData.coach_id || ""} onChange={(e) => setFormData({ ...formData, coach_id: e.target.value })} disabled={!!selectedUser} />
            </div>
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={formData.first_name || ""} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={formData.last_name || ""} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Switch id="status" checked={formData.status || false} onCheckedChange={(checked) => setFormData({ ...formData, status: checked })} />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="coach_user_id">Coach User ID</Label>
            <Input id="coach_user_id" value={formData.coach_user_id || ""} onChange={(e) => setFormData({ ...formData, coach_user_id: e.target.value })} />
          </div>
          <div className="mt-4">
            <Label htmlFor="coach_password">Coach Password</Label>
            <Input id="coach_password" type="password" value={formData.coach_password || ""} onChange={(e) => setFormData({ ...formData, coach_password: e.target.value })} />
          </div>
        </>
      );
    } else if (activeTab === "athletes") {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="athlete_id">Athlete ID</Label>
              <Input id="athlete_id" value={formData.athlete_id || ""} onChange={(e) => setFormData({ ...formData, athlete_id: e.target.value })} disabled={!!selectedUser} />
            </div>
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={formData.first_name || ""} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={formData.last_name || ""} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" type="date" value={formData.date_of_birth || ""} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="mother_name">Mother's Name</Label>
              <Input id="mother_name" value={formData.mother_name || ""} onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="mother_email">Mother's Email</Label>
              <Input id="mother_email" type="email" value={formData.mother_email || ""} onChange={(e) => setFormData({ ...formData, mother_email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="mother_phone">Mother's Phone</Label>
              <Input id="mother_phone" value={formData.mother_phone || ""} onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="father_name">Father's Name</Label>
              <Input id="father_name" value={formData.father_name || ""} onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="father_email">Father's Email</Label>
              <Input id="father_email" type="email" value={formData.father_email || ""} onChange={(e) => setFormData({ ...formData, father_email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="father_phone">Father's Phone</Label>
              <Input id="father_phone" value={formData.father_phone || ""} onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="plan_type">Plan Type</Label>
              <Input id="plan_type" value={formData.plan_type || ""} onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="surf_level">Surf Level</Label>
              <Input id="surf_level" value={formData.surf_level || ""} onChange={(e) => setFormData({ ...formData, surf_level: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="training_days">Training Days</Label>
              <Input id="training_days" value={formData.training_days || ""} onChange={(e) => setFormData({ ...formData, training_days: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="trainings_per_week">Trainings per Week</Label>
              <Input id="trainings_per_week" type="number" value={formData.trainings_per_week || ""} onChange={(e) => setFormData({ ...formData, trainings_per_week: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="transport">Transport</Label>
              <Switch id="transport" checked={formData.transport || false} onCheckedChange={(checked) => setFormData({ ...formData, transport: checked })} />
            </div>
            <div>
              <Label htmlFor="pickup_address">Pickup Address</Label>
              <Input id="pickup_address" value={formData.pickup_address || ""} onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="dropoff_address">Dropoff Address</Label>
              <Input id="dropoff_address" value={formData.dropoff_address || ""} onChange={(e) => setFormData({ ...formData, dropoff_address: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="is_active">Is Active</Label>
              <Switch id="is_active" checked={formData.is_active || false} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
            </div>
            <div>
              <Label htmlFor="guardian_id">Guardian ID</Label>
              <Input id="guardian_id" value={formData.guardian_id || ""} onChange={(e) => setFormData({ ...formData, guardian_id: e.target.value })} />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="sql_line">SQL Line</Label>
            <Textarea id="sql_line" value={formData.sql_line || ""} onChange={(e) => setFormData({ ...formData, sql_line: e.target.value })} />
          </div>
        </>
      );
    } else if (activeTab === "guardians") {
      return (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={formData.first_name || ""} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={formData.last_name || ""} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone || ""} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="User Management" showBack backTo="/admin" />
      <SponsorBanner />
      <main className="mobile-container py-6">
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><CardTitle>Manage Users</CardTitle><CardDescription>Add, edit coaches, athletes, and guardians</CardDescription></div>
              <Button onClick={handleAdd} className="touch-friendly"><UserPlus className="h-4 w-4 mr-2" />Add New</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-6" />
            <Tabs defaultValue="coaches" className="space-y-4" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="coaches">Coaches</TabsTrigger>
                <TabsTrigger value="athletes">Athletes</TabsTrigger>
                <TabsTrigger value="guardians">Guardians</TabsTrigger>
              </TabsList>
              <TabsContent value="coaches">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredCoaches.map(coach => (
                      <div key={coach.coach_id} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{coach.first_name} {coach.last_name}</p>
                          <p className="text-sm text-muted-foreground">{coach.email}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(coach)}>Edit</Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="athletes">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredAthletes.map(athlete => (
                      <div key={athlete.athlete_id} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{athlete.first_name} {athlete.last_name}</p>
                          <p className="text-sm text-muted-foreground">{athlete.email}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(athlete)}>Edit</Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="guardians">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredGuardians.map(guardian => (
                      <div key={guardian.id} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{guardian.first_name} {guardian.last_name}</p>
                          <p className="text-sm text-muted-foreground">{guardian.email}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(guardian)}>Edit</Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <AppFooter />

      {/* Add / Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedUser ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}</DialogTitle>
            <DialogDescription>
              {`Make changes to your ${activeTab} here. Click save when you're done.`}
            </DialogDescription>
          </DialogHeader>

          {renderFormFields()}

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => { setIsAddDialogOpen(false); setIsEditDialogOpen(false); }}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
