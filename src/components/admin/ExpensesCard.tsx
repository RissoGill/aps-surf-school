import { useState, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Plus, Trash2, FileText, Calendar as CalendarIcon, Euro, ExternalLink, Camera, Upload } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Expense {
  id: string;
  name: string;
  expense_date: string;
  amount: number;
  invoice_url: string | null;
  created_at: string;
  created_by: string | null;
}

export const ExpensesCard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const convertImageToPdf = useCallback(async (imageFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const orientation = img.width > img.height ? "landscape" : "portrait";
          const pdf = new jsPDF({ orientation, unit: "px", format: [img.width, img.height] });
          pdf.addImage(e.target?.result as string, "JPEG", 0, 0, img.width, img.height);
          const blob = pdf.output("blob");
          const pdfFile = new File([blob], "scan.pdf", { type: "application/pdf" });
          resolve(pdfFile);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });
  }, []);

  const handleScanChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const captured = e.target.files?.[0];
    if (!captured) return;
    try {
      const pdfFile = await convertImageToPdf(captured);
      setFile(pdfFile);
    } catch {
      toast({ title: t("expenses.error"), variant: "destructive" });
    }
  };

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data as Expense[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (expense: { name: string; expense_date: string; amount: number; invoice_url: string | null }) => {
      const { error } = await supabase.from("expenses").insert(expense);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: t("expenses.created") });
      resetForm();
    },
    onError: () => {
      toast({ title: t("expenses.error"), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: t("expenses.deleted") });
    },
  });

  const resetForm = () => {
    setName("");
    setDate(new Date());
    setAmount("");
    setFile(null);
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !date || !amount) return;

    setUploading(true);
    let invoiceUrl: string | null = null;

    if (file) {
      const fileExt = file.name.split(".").pop();
      const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("expense-invoices")
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: t("expenses.uploadError"), variant: "destructive" });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("expense-invoices")
        .getPublicUrl(filePath);
      invoiceUrl = urlData.publicUrl;
    }

    createMutation.mutate({
      name: name.trim(),
      expense_date: format(date, "yyyy-MM-dd"),
      amount: parseFloat(amount),
      invoice_url: invoiceUrl,
    });
    setUploading(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="text-lg">{t("expenses.title")}</CardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t("expenses.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("expenses.new")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t("expenses.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("expenses.namePlaceholder")} />
              </div>
              <div>
                <Label>{t("expenses.date")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : t("expenses.pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>{t("expenses.amount")}</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-9" placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>{t("expenses.invoice")}</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    ref={scanInputRef}
                    onChange={handleFileChange}
                  />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => scanInputRef.current?.click()}>
                    <Camera className="h-4 w-4 mr-1" />
                    {t("expenses.scanInvoice")}
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4 mr-1" />
                    {t("expenses.uploadFile")}
                  </Button>
                </div>
                {file && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t("expenses.fileSelected")}: {file.name}
                  </p>
                )}
              </div>
              <Button onClick={handleSubmit} disabled={!name.trim() || !date || !amount || uploading || createMutation.isPending} className="w-full">
                {uploading ? t("expenses.uploading") : t("expenses.register")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("expenses.loading")}</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("expenses.empty")}</p>
        ) : (
          <>
            <div className="mb-3 text-sm font-medium">
              {t("expenses.total")}: <span className="text-primary">€{totalExpenses.toFixed(2)}</span>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("expenses.name")}</TableHead>
                    <TableHead>{t("expenses.date")}</TableHead>
                    <TableHead>{t("expenses.amount")}</TableHead>
                    <TableHead>{t("expenses.invoice")}</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.name}</TableCell>
                      <TableCell>{format(new Date(expense.expense_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>€{Number(expense.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {expense.invoice_url ? (
                          <a href={expense.invoice_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            {t("expenses.viewInvoice")}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(expense.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
