import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Video, Calendar } from "lucide-react";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  date: string | null;
  status: string | null;
  coach: string | null;
  beach_location: string | null;
  notes: string | null;
  athlete_id: string | null;
  photos?: string[];
  videos?: string[];
}

interface AttendanceMediaGalleryProps {
  attendance: AttendanceRecord[];
}

export const AttendanceMediaGallery = ({ attendance }: AttendanceMediaGalleryProps) => {
  // Filter attendance records that have media
  const recordsWithMedia = attendance.filter(
    (record) => (record.photos && record.photos.length > 0) || (record.videos && record.videos.length > 0)
  );

  if (recordsWithMedia.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            Media Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No media uploaded yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Media Gallery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recordsWithMedia.map((record) => (
          <div key={record.id} className="space-y-3 pb-4 border-b last:border-b-0 last:pb-0">
            {/* Date Header */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {record.date ? format(new Date(record.date), 'MMM d, yyyy') : 'No date'}
              </span>
              {record.beach_location && (
                <Badge variant="outline" className="text-xs">
                  {record.beach_location}
                </Badge>
              )}
            </div>

            {/* Photos Grid */}
            {record.photos && record.photos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {record.photos.length} {record.photos.length === 1 ? 'Photo' : 'Photos'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {record.photos.map((photoUrl, idx) => (
                    <a
                      key={idx}
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-md overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photoUrl}
                        alt={`Photo from ${record.date}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Videos Grid */}
            {record.videos && record.videos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {record.videos.length} {record.videos.length === 1 ? 'Video' : 'Videos'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {record.videos.map((videoUrl, idx) => (
                    <a
                      key={idx}
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-video rounded-md overflow-hidden bg-muted hover:opacity-90 transition-opacity"
                    >
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
