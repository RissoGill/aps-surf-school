import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, Edit2, Save, X } from "lucide-react";
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
}

// Validation schema for athlete edits
const athleteEditSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(100),
  last_name: z.string().trim().min(1, "Last name is required").max(100),
  date_of_birth: z.string().nullable(),
  address: z.string().trim().max(255).nullable(),
  email: z.string().trim().email("Invalid email").max(255).nullable().or(z.literal("")),
  phone: z.string().trim().max(20).nullable(),
  mother_name: z.string().trim().max(100).nullable(),
  mother_email: z.string().trim().email("Invalid email").max(255).nullable().or(z.literal("")),
  mother_phone: z.number().nullable(),
  father_name: z.string().trim().max(100).nullable(),
  father_email: z.string().trim().email("Invalid email").max(255).nullable().or(z.literal("")),
  father_phone: z.string().trim().max(20).nullable(),
  surf_level: z.string().nullable(),
  trainings_per_week: z.number().min(0).max(7).nullable(),
  training_days: z.string().trim().max(100).nullable(),
  transport: z.boolean().nullable(),
  pickup_address: z.string().trim().max(255).nullable(),
  dropoff_address: z.string().trim().max(255).nullable()
});

const AthleteManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Athlete>>({});

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

      // Update in Supabase
      const { error } = await supabase
        .from('atletas')
        .update(validated)
        .eq('athlete_id', selectedAthlete.athlete_id);

      if (error) throw error;

      // Refresh data
      await queryClient.invalidateQueries({ queryKey: ['athletes-all'] });

      // Update selected athlete
      setSelectedAthlete({ ...selectedAthlete, ...validated });

      toast({
        title: "Success",
        description: "Athlete information updated successfully"
      });

      setIsEditing(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update athlete information",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Athlete Management" showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Athlete Management</h2>
          <p className="text-muted-foreground">Search for an athlete to view and edit their information</p>
        </div>

        {/* Search Bar */}
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              Athlete Search
            </CardTitle>
            <CardDescription>Search for an athlete to view and manage their profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search athlete by name or ID..."
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
              <div className="flex items-center justify-between bg-muted p-3 rounded-lg">
                <div>
                  <p className="font-medium">Selected Athlete:</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedAthlete.first_name} {selectedAthlete.last_name} ({selectedAthlete.athlete_id})
                  </p>
                </div>
                <div className="flex gap-2">
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditStart}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedAthlete(null);
                      setSearchTerm("");
                      setIsEditing(false);
                    }}
                  >
                    Clear
                  </Button>
                </div>
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
                  <CardTitle>Athlete Profile</CardTitle>
                  <CardDescription>
                    {isEditing ? "Edit athlete information" : "View athlete information"}
                  </CardDescription>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEditSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleEditCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="parents">Parents</TabsTrigger>
                  <TabsTrigger value="training">Training</TabsTrigger>
                </TabsList>
                
                {/* Personal Information Tab */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">First Name *</Label>
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
                      <Label htmlFor="last_name">Last Name *</Label>
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
                      <Label htmlFor="date_of_birth">Date of Birth</Label>
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
                      <Label htmlFor="phone">Phone</Label>
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
                      <Label htmlFor="email">Email</Label>
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
                      <Label htmlFor="address">Address</Label>
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
                    <h4 className="font-medium text-foreground">Mother Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="mother_name">Mother's Name</Label>
                        {isEditing ? (
                          <Input
                            id="mother_name"
                            value={editForm.mother_name || ""}
                            onChange={(e) => setEditForm({ ...editForm, mother_name: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.mother_name || "-"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="mother_phone">Mother's Phone</Label>
                        {isEditing ? (
                          <Input
                            id="mother_phone"
                            type="number"
                            value={editForm.mother_phone || ""}
                            onChange={(e) => setEditForm({ ...editForm, mother_phone: e.target.value ? parseInt(e.target.value) : null })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.mother_phone || "-"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="mother_email">Mother's Email</Label>
                        {isEditing ? (
                          <Input
                            id="mother_email"
                            type="email"
                            value={editForm.mother_email || ""}
                            onChange={(e) => setEditForm({ ...editForm, mother_email: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.mother_email || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Father Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="father_name">Father's Name</Label>
                        {isEditing ? (
                          <Input
                            id="father_name"
                            value={editForm.father_name || ""}
                            onChange={(e) => setEditForm({ ...editForm, father_name: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.father_name || "-"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="father_phone">Father's Phone</Label>
                        {isEditing ? (
                          <Input
                            id="father_phone"
                            value={editForm.father_phone || ""}
                            onChange={(e) => setEditForm({ ...editForm, father_phone: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.father_phone || "-"}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="father_email">Father's Email</Label>
                        {isEditing ? (
                          <Input
                            id="father_email"
                            type="email"
                            value={editForm.father_email || ""}
                            onChange={(e) => setEditForm({ ...editForm, father_email: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.father_email || "-"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Training Information Tab */}
                <TabsContent value="training" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="surf_level">Surf Level</Label>
                      {isEditing ? (
                        <Select
                          value={editForm.surf_level || ""}
                          onValueChange={(value) => setEditForm({ ...editForm, surf_level: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="learning">Learning</SelectItem>
                            <SelectItem value="pre-competition">Pre-Competition</SelectItem>
                            <SelectItem value="competition">Competition</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">{selectedAthlete.surf_level || "-"}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="trainings_per_week">Trainings per Week</Label>
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
                      <Label htmlFor="training_days">Training Days</Label>
                      {isEditing ? (
                        <Input
                          id="training_days"
                          placeholder="e.g., Monday, Wednesday, Friday"
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
                        Requires Transport
                      </Label>
                    </div>

                    {(isEditing ? editForm.transport : selectedAthlete.transport) && (
                      <>
                        <div className="md:col-span-2">
                          <Label htmlFor="pickup_address">Pickup Address</Label>
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
                          <Label htmlFor="dropoff_address">Dropoff Address</Label>
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
