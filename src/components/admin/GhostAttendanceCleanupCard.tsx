import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Download, Wrench, RefreshCw, Ghost, AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

interface GhostAttendanceCleanupCardProps {
  userRole: string | null;
}

const GhostAttendanceCleanupCard = ({ userRole }: GhostAttendanceCleanupCardProps) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  // Get session info for API calls
  const getSessionInfo = () => {
    try {
      const sessionStr = localStorage.getItem('adminSession');
      if (!sessionStr) return { userId: null, role: null };
      const session = JSON.parse(sessionStr);
      return { userId: session.id || session.email, role: session.role };
    } catch {
      return { userId: null, role: null };
    }
  };

  // Fetch ghost and legacy counts
  const { data: counts, isLoading, refetch } = useQuery({
    queryKey: ['ghost-attendance-counts'],
    queryFn: async () => {
      const { userId, role } = getSessionInfo();
      
      const { data, error } = await supabase.functions.invoke('cleanup-ghost-attendance', {
        body: { action: 'count', userId, role }
      });

      if (error) throw error;
      return data as { ghostCount: number; legacyCount: number };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Export ghost records as CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { userId, role } = getSessionInfo();
      
      const { data, error } = await supabase.functions.invoke('cleanup-ghost-attendance', {
        body: { action: 'export', userId, role }
      });

      if (error) throw error;

      const records = data.records || [];
      if (records.length === 0) {
        toast({
          title: t('admin.ghostCleanup.noRecords'),
          description: t('admin.ghostCleanup.noGhostsFound'),
        });
        return;
      }

      // Create CSV content
      const csvHeader = 'id,athlete_id,date\n';
      const csvRows = records.map((r: { id: string; athlete_id: string; date: string }) => 
        `${r.id},${r.athlete_id || ''},${r.date || ''}`
      ).join('\n');
      const csvContent = csvHeader + csvRows;

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ghost-attendance-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t('admin.ghostCleanup.exportSuccess'),
        description: t('admin.ghostCleanup.exportedRecords').replace('{count}', records.length.toString()),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('admin.ghostCleanup.exportError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Delete ghost records
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { userId, role } = getSessionInfo();
      
      const { data, error } = await supabase.functions.invoke('cleanup-ghost-attendance', {
        body: { action: 'delete', userId, role }
      });

      if (error) throw error;

      toast({
        title: t('admin.ghostCleanup.deleteSuccess'),
        description: t('admin.ghostCleanup.deletedRecords').replace('{count}', (data.deletedCount || 0).toString()),
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['ghost-attendance-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t('admin.ghostCleanup.deleteError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Fix legacy records (set shift to Morning)
  const handleFixShift = async () => {
    setIsFixing(true);
    try {
      const { userId, role } = getSessionInfo();
      
      const { data, error } = await supabase.functions.invoke('cleanup-ghost-attendance', {
        body: { action: 'fix-shift', userId, role }
      });

      if (error) throw error;

      toast({
        title: t('admin.ghostCleanup.fixSuccess'),
        description: t('admin.ghostCleanup.fixedRecords').replace('{count}', (data.updatedCount || 0).toString()),
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['ghost-attendance-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-athletes-attendance'] });
    } catch (error) {
      console.error('Fix shift error:', error);
      toast({
        title: t('admin.ghostCleanup.fixError'),
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Only show for admin or super_admin
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    return null;
  }

  const hasGhosts = (counts?.ghostCount || 0) > 0;
  const hasLegacy = (counts?.legacyCount || 0) > 0;

  return (
    <Card className="shadow-medium border-warning/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ghost className="h-5 w-5 text-warning" />
            <CardTitle className="text-lg">{t('admin.ghostCleanup.title')}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{t('admin.ghostCleanup.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-destructive">
                  {counts?.ghostCount?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('admin.ghostCleanup.ghostRecords')}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-warning">
                  {counts?.legacyCount?.toLocaleString() || 0}
                </p>
                <p className="text-xs text-muted-foreground">{t('admin.ghostCleanup.legacyRecords')}</p>
              </div>
            </div>

            {/* Warning if ghosts exist */}
            {hasGhosts && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('admin.ghostCleanup.warningMessage')}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || !hasGhosts}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? t('admin.ghostCleanup.exporting') : t('admin.ghostCleanup.exportCsv')}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting || !hasGhosts}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? t('admin.ghostCleanup.deleting') : t('admin.ghostCleanup.deleteGhosts')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('admin.ghostCleanup.confirmDeleteTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('admin.ghostCleanup.confirmDeleteMessage').replace('{count}', (counts?.ghostCount || 0).toLocaleString())}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t('admin.ghostCleanup.confirmDelete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                variant="warning"
                size="sm"
                onClick={handleFixShift}
                disabled={isFixing || !hasLegacy}
              >
                <Wrench className="h-4 w-4 mr-2" />
                {isFixing ? t('admin.ghostCleanup.fixing') : t('admin.ghostCleanup.fixShift')}
              </Button>
            </div>

            {/* No issues badge */}
            {!hasGhosts && !hasLegacy && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                {t('admin.ghostCleanup.allClear')}
              </Badge>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GhostAttendanceCleanupCard;
