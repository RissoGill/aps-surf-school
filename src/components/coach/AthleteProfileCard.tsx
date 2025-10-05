import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, User, Phone, Mail, MapPin, Car } from "lucide-react";

interface AthleteProfileCardProps {
  athlete: {
    first_name: string | null;
    last_name: string | null;
    photo_url: string | null;
    date_of_birth: string | null;
    surf_level: string | null;
    trainings_per_week: number | null;
    training_days: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    mother_name: string | null;
    mother_phone: number | null;
    mother_email: string | null;
    father_name: string | null;
    father_phone: string | null;
    father_email: string | null;
    transport: boolean | null;
    pickup_address: string | null;
    dropoff_address: string | null;
  };
  getLevelColor: (level: string) => string;
}

export const AthleteProfileCard = ({ athlete, getLevelColor }: AthleteProfileCardProps) => {
  const getInitials = () => {
    const first = athlete.first_name?.[0] || '';
    const last = athlete.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Header with Photo and Basic Info */}
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={athlete.photo_url || undefined} alt={`${athlete.first_name} ${athlete.last_name}`} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-lg mb-2">
            {athlete.first_name} {athlete.last_name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {athlete.surf_level && (
              <Badge className={`${getLevelColor(athlete.surf_level)}`}>
                {athlete.surf_level}
              </Badge>
            )}
            {athlete.date_of_birth && (
              <span className="text-xs text-muted-foreground">
                Born: {new Date(athlete.date_of_birth).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Training Information */}
      {(athlete.training_days || athlete.trainings_per_week) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Training Schedule
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm pl-6">
            {athlete.training_days && (
              <div className="text-muted-foreground">
                <span className="font-medium">Days:</span> {athlete.training_days}
              </div>
            )}
            {athlete.trainings_per_week && (
              <div className="text-muted-foreground">
                <span className="font-medium">Per Week:</span> {athlete.trainings_per_week}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Information */}
      {(athlete.phone || athlete.email || athlete.address) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Contact Information
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm pl-6">
            {athlete.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{athlete.phone}</span>
              </div>
            )}
            {athlete.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{athlete.email}</span>
              </div>
            )}
            {athlete.address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{athlete.address}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Guardian Information */}
      {(athlete.mother_name || athlete.father_name) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Guardian Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
            {athlete.mother_name && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Mother</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{athlete.mother_name}</p>
                  {athlete.mother_phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {athlete.mother_phone}
                    </p>
                  )}
                  {athlete.mother_email && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {athlete.mother_email}
                    </p>
                  )}
                </div>
              </div>
            )}
            {athlete.father_name && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Father</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{athlete.father_name}</p>
                  {athlete.father_phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {athlete.father_phone}
                    </p>
                  )}
                  {athlete.father_email && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {athlete.father_email}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transport Information */}
      {athlete.transport && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Transport Information
          </h4>
          <div className="grid grid-cols-1 gap-2 text-sm pl-6">
            {athlete.pickup_address && (
              <div className="text-muted-foreground">
                <span className="font-medium">Pickup:</span> {athlete.pickup_address}
              </div>
            )}
            {athlete.dropoff_address && (
              <div className="text-muted-foreground">
                <span className="font-medium">Drop-off:</span> {athlete.dropoff_address}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
