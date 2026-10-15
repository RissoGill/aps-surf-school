import { useState, useRef } from "react";
import { FileText, Plus, Pencil, Trash2, Upload, Eye, Download, FolderOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  uploaded_by: string | null;
  created_at: string;
}

interface Coach {
  coach_id: string;
  first_name: string | null;
  last_name: string | null;
}

const BUCKET = "coach-documents";
const ALL_COACHES = "__all__";

const CATEGORIES = ["Licença", "Seguro", "Regulamento", "Outro"];

const sanitizeFileName = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

export const CoachDocumentsManagementCard = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<CoachDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<CoachDocument | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Licença");
  const [coachTarget, setCoachTarget] = useState(ALL_COACHES);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: coaches } = useQuery({
    queryKey: ['admin-coaches-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach')
        .select('coach_id, first_name, last_name')
        .order('first_name')
        .limit(10000);
      if (error) throw error;
      return data as Coach[];
    }
  });

  const { data: documents, isLoading } = useQuery({
    queryKey: ['admin-coach-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coach_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000);
      if (error) throw error;
      return data as CoachDocument[];
    }
  });

  const getCoachName = (coachId: string | null) => {
    if (!coachId) return t('admin.documents.allCoaches');
    const coach = coaches?.find(c => c.coach_id === coachId);
    return coach ? `${coach.first_name || ''} ${coach.last_name || ''}`.trim() || coachId : coachId;
  };

  const resetForm = () => {
    setTitle("");
    setCategory("Licença");
    setCoachTarget(ALL_COACHES);
    setSelectedFile(null);
    setEditingDoc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEdit = (doc: CoachDocument) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setCategory(doc.category);
    setCoachTarget(doc.coach_id || ALL_COACHES);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (title.trim().length < 3) {
      toast({ title: t('common.error'), description: t('admin.documents.titleRequired'), variant: "destructive" });
      return;
    }
    if (!editingDoc && !selectedFile) {
      toast({ title: t('common.error'), description: t('admin.documents.fileRequired'), variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      let fileUrl = editingDoc?.file_url || "";
      let fileName = editingDoc?.file_name || "";

      if (selectedFile) {
        const path = `${Date.now()}_${sanitizeFileName(selectedFile.name)}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, selectedFile, { contentType: selectedFile.type, upsert: false });
        if (uploadError) throw uploadError;
        fileUrl = path;
        fileName = selectedFile.name;

        // Remove old file when replacing
        if (editingDoc?.file_url) {
          await supabase.storage.from(BUCKET).remove([editingDoc.file_url]);
        }
      }

      const payload = {
        title: title.trim(),
        category,
        coach_id: coachTarget === ALL_COACHES ? null : coachTarget,
        file_url: fileUrl,
        file_name: fileName,
        uploaded_by: 'admin'
      };

      if (editingDoc) {
        const { error } = await supabase
          .from('coach_documents')
          .update(payload)
          .eq('id', editingDoc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('coach_documents')
          .insert(payload);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['admin-coach-documents'] });
      queryClient.invalidateQueries({ queryKey: ['coach-documents'] });
      toast({ title: t('admin.documents.saved') });
      setIsDialogOpen(false);
      resetForm();
    } catch {
      toast({ title: t('common.error'), description: t('admin.documents.saveError'), variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDoc) return;
    try {
      const { error } = await supabase
        .from('coach_documents')
        .delete()
        .eq('id', deletingDoc.id);
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([deletingDoc.file_url]);
      queryClient.invalidateQueries({ queryKey: ['admin-coach-documents'] });
      queryClient.invalidateQueries({ queryKey: ['coach-documents'] });
      toast({ title: t('admin.documents.deleted') });
    } catch {
      toast({ title: t('common.error'), variant: "destructive" });
    } finally {
      setDeletingDoc(null);
    }
  };

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
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-start gap-4">
          <FolderOpen className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl">{t('admin.documents.title')}</CardTitle>
            <CardDescription className="mt-1">{t('admin.documents.description')}</CardDescription>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm" className="w-full sm:w-auto gap-1" onClick={openNew}>
            <Plus className="h-4 w-4" />
            {t('admin.documents.add')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">{t('common.loading')}</div>
        ) : !documents?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t('admin.documents.empty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 border rounded-lg p-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{escapeHtml(doc.title)}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{escapeHtml(doc.category)}</Badge>
                    <Badge variant={doc.coach_id ? "outline" : "default"} className="text-xs">
                      {escapeHtml(getCoachName(doc.coach_id))}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => handleView(doc)} title={t('coach.documents.view')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDownload(doc)} title={t('coach.documents.download')}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(doc)} title={t('admin.documents.edit')}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeletingDoc(doc)} title={t('admin.documents.delete')}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDoc ? t('admin.documents.edit') : t('admin.documents.add')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">{t('admin.documents.docTitle')}</Label>
              <Input
                id="doc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('admin.documents.docTitlePlaceholder')}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('admin.documents.category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('admin.documents.coach')}</Label>
              <Select value={coachTarget} onValueChange={setCoachTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_COACHES}>{t('admin.documents.allCoaches')}</SelectItem>
                  {coaches?.map((c) => (
                    <SelectItem key={c.coach_id} value={c.coach_id}>
                      {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.coach_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-file">{t('admin.documents.file')}</Label>
              <Input
                id="doc-file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {editingDoc && !selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {t('admin.documents.keepFile')}: {escapeHtml(editingDoc.file_name)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              {t('coach.messages.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Upload className="h-4 w-4 mr-2" />
              {isSaving ? t('common.loading') : t('admin.documents.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDoc} onOpenChange={(open) => !open && setDeletingDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.documents.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.documents.deleteConfirm')} "{deletingDoc ? escapeHtml(deletingDoc.title) : ''}"
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('coach.messages.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('admin.documents.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default CoachDocumentsManagementCard;
