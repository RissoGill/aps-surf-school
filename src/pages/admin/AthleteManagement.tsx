import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, User, Trophy, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/shared/AppHeader";
import SponsorBanner from "@/components/shared/SponsorBanner";
import AppFooter from "@/components/shared/AppFooter";

// Mock athlete data
const mockAthletes = [
  {
    id: 1,
    name: "Emma Johnson",
    dateOfBirth: "2010-03-15",
    healthNumber: "APS-2024-058",
    address: "123 Ocean View Drive, Beach City",
    phone: "(555) 123-4567",
    level: "Intermediate",
    joinDate: "2024-03-01",
    weeklyTrainings: 3,
    motherName: "Sarah Johnson",
    motherPhone: "(555) 123-4567",
    motherEmail: "sarah.johnson@email.com",
    fatherName: "Mike Johnson",
    fatherPhone: "(555) 987-6543",
    fatherEmail: "mike.johnson@email.com"
  },
  {
    id: 2,
    name: "Liam Smith",
    dateOfBirth: "2012-07-22",
    healthNumber: "APS-2024-059",
    address: "456 Surf Street, Beach City",
    phone: "(555) 234-5678",
    level: "Beginner",
    joinDate: "2024-06-15",
    weeklyTrainings: 2,
    motherName: "Lisa Smith",
    motherPhone: "(555) 234-5678",
    motherEmail: "lisa.smith@email.com",
    fatherName: "David Smith",
    fatherPhone: "(555) 345-6789",
    fatherEmail: "david.smith@email.com"
  }
];

const AthleteManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [athletes, setAthletes] = useState(mockAthletes);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         athlete.healthNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === "All" || athlete.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-warning/10 text-warning";
      case "Intermediate": return "bg-primary/10 text-primary";
      case "Advanced": return "bg-success/10 text-success";
      default: return "bg-secondary/10 text-secondary-foreground";
    }
  };

  const handleDeleteAthlete = (athleteId: number) => {
    setAthletes(athletes.filter(athlete => athlete.id !== athleteId));
    toast({
      title: "Athlete Removed",
      description: "Athlete has been successfully removed from the system.",
    });
  };

  const handleEditAthlete = (athlete: any) => {
    setSelectedAthlete(athlete);
    setIsEditDialogOpen(true);
  };

  const levelOptions = ["Beginner", "Intermediate", "Advanced"];

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title="Athlete Management" showBack backTo="/dashboard/administration" />
      
      <main className="mobile-container py-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Athletes</h2>
            <p className="text-sm text-muted-foreground">{filteredAthletes.length} total athletes</p>
          </div>
          
          <Button className="touch-friendly" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Athlete
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or health number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 touch-friendly"
            />
          </div>
          
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Levels</SelectItem>
              {levelOptions.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <User className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">{athletes.length}</p>
              <p className="text-xs text-muted-foreground">Total Athletes</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">
                {athletes.filter(a => a.level === "Advanced").length}
              </p>
              <p className="text-xs text-muted-foreground">Advanced</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-soft">
            <CardContent className="p-4 text-center">
              <Calendar className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-xl font-bold text-foreground">
                {athletes.filter(a => a.joinDate >= "2024-09-01").length}
              </p>
              <p className="text-xs text-muted-foreground">New This Month</p>
            </CardContent>
          </Card>
        </div>

        {/* Athletes List */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>All Athletes</CardTitle>
            <CardDescription>Manage athlete profiles and information</CardDescription>
          </CardHeader>
          
          <CardContent className="p-0">
            {filteredAthletes.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">No athletes found</p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredAthletes.map((athlete) => (
                  <div key={athlete.id} className="p-4 border-b border-border last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">{athlete.name}</h3>
                        <p className="text-sm text-muted-foreground">{athlete.healthNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {athlete.weeklyTrainings} sessions/week • Joined: {athlete.joinDate}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getLevelColor(athlete.level)}>
                          {athlete.level}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 touch-friendly"
                        onClick={() => handleEditAthlete(athlete)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 touch-friendly text-destructive hover:text-destructive"
                        onClick={() => handleDeleteAthlete(athlete.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Athlete Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Athlete</DialogTitle>
              <DialogDescription>
                Update athlete information and parent contacts.
              </DialogDescription>
            </DialogHeader>
            
            {selectedAthlete && (
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="parents">Parents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" defaultValue={selectedAthlete.name} />
                    </div>
                    <div>
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input id="dob" type="date" defaultValue={selectedAthlete.dateOfBirth} />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="health">Health Number</Label>
                    <Input id="health" defaultValue={selectedAthlete.healthNumber} />
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" defaultValue={selectedAthlete.address} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" defaultValue={selectedAthlete.phone} />
                    </div>
                    <div>
                      <Label htmlFor="level">Level</Label>
                      <Select defaultValue={selectedAthlete.level}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {levelOptions.map(level => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="parents" className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Mother</h4>
                    <Input placeholder="Mother's name" defaultValue={selectedAthlete.motherName} />
                    <Input placeholder="Mother's phone" defaultValue={selectedAthlete.motherPhone} />
                    <Input placeholder="Mother's email" defaultValue={selectedAthlete.motherEmail} />
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Father</h4>
                    <Input placeholder="Father's name" defaultValue={selectedAthlete.fatherName} />
                    <Input placeholder="Father's phone" defaultValue={selectedAthlete.fatherPhone} />
                    <Input placeholder="Father's email" defaultValue={selectedAthlete.fatherEmail} />
                  </div>
                </TabsContent>
              </Tabs>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                setIsEditDialogOpen(false);
                toast({
                  title: "Athlete Updated",
                  description: "Athlete information has been successfully updated.",
                });
              }}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <SponsorBanner />
      <AppFooter />
    </div>
  );
};

export default AthleteManagement;