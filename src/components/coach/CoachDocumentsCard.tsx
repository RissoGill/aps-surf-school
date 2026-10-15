import { useState } from "react";
import { FileText, Download, Eye, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { escapeHtml } from "@/utils/htmlSanitize";

interface CoachDocument {
  id: string;
  coach_id: string | null;
  title: string;
  category: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

interface CoachDocumentsCardProps {
  coachId: string;
}

const BUCKET = "coach-documents";

export const CoachDocumentsCard = ({ coachId }: CoachDocumentsCardProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['coach-documents', coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_documents')
        .select('*')
        .or(`coach_id.is.null,coach_id.eq.${coachId}`)
        .order('created_at', { ascending: false })
        .limit(10000);

      if (error) throw error;
      return data as CoachDocument[];
    },
    enabled: !!coachId
  });

  const getSignedUrl = async (doc: CoachDocument) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_url, 300);
    if (error || !data?.signedUrl) throw error || new Error('no-url');
    return data.signedUrl;
  };

  const handleView = async (doc: CoachDocument) => {
    try {
      const url = await getSignedUrl(doc);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast({ title: t('common.error'), variant: "destructive" });
    }
  };

  const handleDownload = async (doc: CoachDocument) => {
    setDownloadingId(doc.id);
    try {
      const url = await getSignedUrl(doc);
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch-failed');
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
    } catch {
      toast({ title: t('common.error'), variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const generalDocs = documents?.filter(d => !d.coach_id) || [];
  const myDocs = documents?.filter(d => d.coach_id === coachId) || [];

  const renderDoc = (doc: CoachDocument) => (
    <div key={doc.id} className="flex items-center gap-3 border rounded-lg p-3">
      <FileText className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{escapeHtml(doc.title)}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <Badge variant="secondary" className="text-xs">{escapeHtml(doc.category)}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button size="icon" variant="ghost" onClick={() => handleView(doc)} title={t('coach.documents.view')}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => handleDownload(doc)}
          disabled={downloadingId === doc.id}
          title={t('coach.documents.download')}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start gap-4">
          <FolderOpen className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl">{t('coach.documents.title')}</CardTitle>
            <CardDescription className="mt-1">{t('coach.documents.description')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">{t('common.loading')}</div>
        ) : !documents?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('coach.documents.empty')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {generalDocs.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t('coach.documents.general')}</p>
                <div className="space-y-2">{generalDocs.map(renderDoc)}</div>
              </div>
            )}
            {myDocs.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">{t('coach.documents.mine')}</p>
                <div className="space-y-2">{myDocs.map(renderDoc)}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoachDocumentsCard;
