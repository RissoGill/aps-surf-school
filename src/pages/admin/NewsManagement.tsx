import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Pencil, Trash2, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import AppHeader from "@/components/shared/AppHeader";
import AppFooter from "@/components/shared/AppFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NewsItem {
  id: string;
  title: string;
  news_date: string;
  image_url: string;
  link_url: string | null;
  expires_at: string | null;
  is_active: boolean;
  sort_order: number;
}

const newsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  news_date: z.string().min(1),
  expires_at: z.string().optional().nullable(),
  link_url: z.string().trim().url().optional().or(z.literal("")).nullable(),
  image_url: z.string().trim().url(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
});

const emptyForm = (): Partial<NewsItem> => ({
  title: "",
  news_date: new Date().toISOString().slice(0, 10),
  expires_at: "",
  link_url: "",
  image_url: "",
  is_active: true,
  sort_order: 0,
});

const NewsManagement = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [sessionValid, setSessionValid] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<Partial<NewsItem>>(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("adminSession");
    if (!s) {
      navigate("/login/administration");
      return;
    }
    try {
      JSON.parse(s);
      setSessionValid(true);
    } catch {
      navigate("/login/administration");
    }
  }, [navigate]);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin-news"],
    enabled: sessionValid,
    queryFn: async () => {
      const { data, error } = await (supabase.from("news" as any) as any)
        .select("*")
        .order("news_date", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(10000);
      if (error) throw error;
      return (data || []) as NewsItem[];
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (item: NewsItem) => {
    setEditing(item);
    setForm({
      ...item,
      expires_at: item.expires_at || "",
      link_url: item.link_url || "",
    });
    setDialogOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("news-flyers")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("news-flyers").getPublicUrl(path);
      setForm((f) => ({ ...f, image_url: data.publicUrl }));
      toast.success("OK");
    } catch (e: any) {
      console.error(e);
      toast.error(t("news.manage.toast.uploadError"));
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: (form.title || "").trim(),
        news_date: form.news_date!,
        expires_at: form.expires_at ? form.expires_at : null,
        link_url: form.link_url ? form.link_url : null,
        image_url: (form.image_url || "").trim(),
        is_active: !!form.is_active,
        sort_order: Number(form.sort_order ?? 0),
      };
      const parsed = newsSchema.parse(payload);
      if (editing) {
        const { error } = await (supabase.from("news" as any) as any)
          .update(parsed)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from("news" as any) as any).insert(parsed);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        editing ? t("news.manage.toast.updated") : t("news.manage.toast.created")
      );
      setDialogOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-news"] });
    },
    onError: (e: any) => {
      console.error(e);
      toast.error(e?.message || t("news.manage.toast.saveError"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("news" as any) as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("news.manage.toast.deleted"));
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ["admin-news"] });
    },
    onError: (e: any) => {
      console.error(e);
      toast.error(t("news.manage.toast.deleteError"));
    },
  });

  if (!sessionValid) return null;

  return (
    <div className="min-h-screen bg-gradient-surface">
      <AppHeader title={t("news.manage.title")} showBack backTo="/dashboard/administration" />
      <main className="mobile-container py-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t("news.manage.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("news.manage.subtitle")}</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            {t("news.manage.newButton")}
          </Button>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !items?.length ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {t("news.manage.noNews")}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-16 w-24 flex-shrink-0 bg-muted rounded overflow-hidden">
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.news_date}
                      {!item.is_active && " · inactive"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("news.manage.editTitle") : t("news.manage.createTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{t("news.manage.fields.title")}</Label>
              <Input
                value={form.title || ""}
                maxLength={200}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("news.manage.fields.newsDate")}</Label>
                <Input
                  type="date"
                  value={form.news_date || ""}
                  onChange={(e) => setForm({ ...form, news_date: e.target.value })}
                />
              </div>
              <div>
                <Label>{t("news.manage.fields.expiresAt")}</Label>
                <Input
                  type="date"
                  value={form.expires_at || ""}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>{t("news.manage.fields.linkUrl")}</Label>
              <Input
                type="url"
                value={form.link_url || ""}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                placeholder="https://"
              />
            </div>
            <div>
              <Label>{t("news.manage.fields.imageUrl")}</Label>
              <Input
                type="url"
                value={form.image_url || ""}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://"
              />
              <div className="mt-2 flex items-center gap-2">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "..." : t("news.manage.fields.uploadFlyer")}
                    </span>
                  </Button>
                </label>
                {form.image_url && (
                  <img
                    src={form.image_url}
                    alt=""
                    className="h-12 w-20 object-cover rounded border"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <Label>{t("news.manage.fields.sortOrder")}</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.sort_order ?? 0}
                  onChange={(e) =>
                    setForm({ ...form, sort_order: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch
                  checked={!!form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>{t("news.manage.fields.isActive")}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t("news.manage.cancelButton")}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {t("news.manage.saveButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("news.manage.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("news.manage.deleteConfirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("news.manage.cancelButton")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {t("news.manage.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppFooter />
    </div>
  );
};

export default NewsManagement;
