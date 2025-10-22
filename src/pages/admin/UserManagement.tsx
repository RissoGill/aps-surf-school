import { useState, useEffect } from "react";
import { Search, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const userEditSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(20).nullable().optional(),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
});

type UserData = {
  coach_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: number | null;
  auth_uid: string;
  role?: 'admin' | 'moderator' | 'user';
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch coaches
      const { data: coachesData, error: coachError } = await supabase
        .from('coach')
        .select('*');

      if (coachError) throw coachError;

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine coach data with roles
      const usersWithRoles = coachesData?.map(coach => {
        const userRole = rolesData?.find(r => r.user_id === coach.auth_uid);
        return {
          ...coach,
          role: userRole?.role as 'admin' | 'moderator' | 'user' | undefined
        };
      }) || [];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    return fullName.includes(search) || user.email.toLowerCase().includes(search);
  });

  const handleUserSelect = (user: UserData) => {
    setSelectedUser(user);
    setEditForm(user);
    setDropdownOpen(false);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      // Validate the form data
      const validatedData = userEditSchema.parse(editForm);
      setIsSaving(true);

      // Update coach table
      const { error: coachError } = await supabase
        .from('coach')
        .update({
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          email: validatedData.email,
          phone: validatedData.phone ? parseInt(validatedData.phone) : null,
        })
        .eq('coach_id', selectedUser.coach_id);

      if (coachError) throw coachError;

      // Update user role if changed
      if (validatedData.role && validatedData.role !== selectedUser.role) {
        // First delete existing role
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.auth_uid);

        // Then insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.auth_uid,
            role: validatedData.role
          });

        if (roleError) throw roleError;
      }

      toast.success("User updated successfully");
      
      // Refresh the user list
      await fetchUsers();
      
      // Update selected user
      const updatedUser = { ...selectedUser, ...editForm };
      setSelectedUser(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Error updating user:', error);
        toast.error("Failed to update user");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(selectedUser || {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface">
        <AppHeader title="User Management" showBack backTo="/dashboard/administration" />
        <main className="mobile-container py-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Loading users...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="User Management" showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Search Dropdown */}
        <div className="mb-6">
          <Label className="mb-2 block">Search User</Label>
          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between"
              >
                {selectedUser 
                  ? `${selectedUser.first_name} ${selectedUser.last_name}` 
                  : "Select a user..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search users..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {filteredUsers.map((user) => (
                      <CommandItem
                        key={user.coach_id}
                        value={`${user.first_name} ${user.last_name}`}
                        onSelect={() => handleUserSelect(user)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.first_name} {user.last_name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* User Details */}
        {selectedUser && (
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>User Details</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="account">Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={editForm.first_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={editForm.last_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editForm.phone?.toString() || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value ? parseInt(e.target.value) : null })}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="account" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={editForm.role || ''} 
                      onValueChange={(value) => setEditForm({ ...editForm, role: value as 'admin' | 'moderator' | 'user' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input value={selectedUser.coach_id} disabled />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Auth UID</Label>
                    <Input value={selectedUser.auth_uid || 'Not linked'} disabled />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {!selectedUser && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Select a user to view and edit details</p>
            </CardContent>
          </Card>
        )}
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default UserManagement;