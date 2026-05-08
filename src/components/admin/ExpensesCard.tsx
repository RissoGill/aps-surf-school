import { useState, useMemo, useRef, useCallback } from "react";
import jsPDF from "jspdf";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Plus, Trash2, FileText, Calendar as CalendarIcon, Euro, ExternalLink, Camera, Upload, Pencil, ChevronDown, RefreshCw, Settings, Download } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  isIOSDevice,
  loadInvoiceFile,
  revokeInvoiceBlobUrl,
  shareInvoiceFile,
  triggerInvoiceDownload,
} from "@/utils/invoiceFile";

interface Expense {
  id: string;
  name: string;
  category: string | null;
  subcategory: string | null;
  sub_subcategory: string | null;
  expense_date: string;
  amount: number;
  invoice_url: string | null;
  created_at: string;
  created_by: string | null;
}

const EXPENSE_CATEGORIES = [
  "Despesas Bancárias", "Salários", "Portagens", "Carrinhas",
  "Impostos", "Comunicações", "Contabilidade", "Compras Fornecedores",
  "Material Técnico", "Seguros", "Despesas Legais", "Licenças",
  "Devolução Sócios", "Custos Campeonatos", "Outros"
];

const VAN_PLATES = ["85-QD-72", "85-QD-73", "21-XA-53", "21-XA-61", "26-DB-02"];

const SUBCATEGORIES: Record<string, string[]> = {
  "Despesas Bancárias": ["Manutenção", "Imposto de Selo", "Avales e Garantias", "Juros"],
  "Salários": ["Nuno Telmo", "David", "Danilo", "Gustavo", "Aaron", "Zé Pinho", "Outro"],
  "Carrinhas": VAN_PLATES,
  "Impostos": ["IVA", "IRS", "IRC", "IUC"],
  "Seguros": ["Cascos Marítimos", "Acidentes Pessoais"],
  "Licenças": ["CMC", "Capitania", "Federação", "RNNAT"],
};

const FREETEXT_SUBCATEGORIES = ["Custos Campeonatos"];

// Sub-subcategorias indexadas por categoria. Para casos onde dependem da subcategoria
// (ex.: Impostos > IUC > matrícula), usar SUB_SUBCATEGORIES_BY_SUB.
const SUB_SUBCATEGORIES: Record<string, string[]> = {
  "Carrinhas": ["Gasóleo", "Oficinas", "AdBlue", "Leasing", "IUC", "Seguros", "Multas"],
};

// Sub-subcategorias dependentes da combinação categoria + subcategoria.
const SUB_SUBCATEGORIES_BY_SUB: Record<string, Record<string, string[]>> = {
  "Impostos": {
    "IUC": VAN_PLATES,
  },
};

const getSubSubcategories = (category: string, subcategory: string): string[] | null => {
  const bySub = SUB_SUBCATEGORIES_BY_SUB[category]?.[subcategory];
  if (bySub) return bySub;
  return SUB_SUBCATEGORIES[category] || null;
};

export const ExpensesCard = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getInvoiceViewerUrl = useCallback((url: string) => {
    const viewerUrl = new URL("/invoice-viewer", window.location.origin);
    viewerUrl.searchParams.set("src", url);
    viewerUrl.searchParams.set("v", "20260415-pdfjs");

    return viewerUrl.toString();
  }, []);

  const handleViewInvoice = (url: string) => {
    window.open(getInvoiceViewerUrl(url), "_blank", "noopener,noreferrer");
  };

  const handleDownloadInvoice = useCallback(async (url: string) => {
    try {
      const file = await loadInvoiceFile(url);

      if (!isIOSDevice()) {
        triggerInvoiceDownload(file.blobUrl, file.downloadName);
        window.setTimeout(() => revokeInvoiceBlobUrl(file.blobUrl), 3000);
        return;
      }

      const shared = await shareInvoiceFile(file.blob, file.downloadName, file.contentType);

      if (shared) {
        revokeInvoiceBlobUrl(file.blobUrl);
        return;
      }

      window.open(file.blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => revokeInvoiceBlobUrl(file.blobUrl), 60000);
      toast({
        title: "Abra o ficheiro para guardar manualmente",
        description: "Se o browser não descarregar automaticamente, use a opção Guardar do dispositivo.",
      });
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
      toast({
        variant: "destructive",
        title: "Não foi possível descarregar a fatura",
        description: "A fatura foi aberta para que a possa guardar manualmente.",
      });
    }
  }, [toast]);

  // Create dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [subSubcategory, setSubSubcategory] = useState("");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>(new Date());
  const [editCategory, setEditCategory] = useState("");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editCustomSubcategory, setEditCustomSubcategory] = useState("");
  const [editSubSubcategory, setEditSubSubcategory] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editUploading, setEditUploading] = useState(false);
  const editScanInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFile(e.target.files?.[0] || null);
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

  const handleEditScanChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const captured = e.target.files?.[0];
    if (!captured) return;
    try {
      const pdfFile = await convertImageToPdf(captured);
      setEditFile(pdfFile);
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
        .order("expense_date", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return data as Expense[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (expense: { name: string; category: string | null; subcategory: string | null; sub_subcategory: string | null; expense_date: string; amount: number; invoice_url: string | null }) => {
      const { error } = await supabase.from("expenses").insert(expense);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-stats"] });
      toast({ title: t("expenses.created") });
      resetForm();
    },
    onError: () => {
      toast({ title: t("expenses.error"), variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (expense: { id: string; name: string; category: string | null; subcategory: string | null; sub_subcategory: string | null; expense_date: string; amount: number; invoice_url: string | null }) => {
      const { id, ...rest } = expense;
      const { error } = await supabase.from("expenses").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-stats"] });
      toast({ title: t("expenses.updated") });
      resetEditForm();
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
      queryClient.invalidateQueries({ queryKey: ["accounting-stats"] });
      toast({ title: t("expenses.deleted") });
    },
  });

  const resetForm = () => {
    setName("");
    setDate(new Date());
    setCategory("");
    setSubcategory("");
    setCustomSubcategory("");
    setSubSubcategory("");
    setAmount("");
    setFile(null);
    setDialogOpen(false);
  };

  const resetEditForm = () => {
    setEditingExpense(null);
    setEditName("");
    setEditDate(new Date());
    setEditCategory("");
    setEditSubcategory("");
    setEditCustomSubcategory("");
    setEditSubSubcategory("");
    setEditAmount("");
    setEditFile(null);
    setEditDialogOpen(false);
  };

  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setEditName(expense.name);
    setEditDate(new Date(expense.expense_date));
    setEditCategory(expense.category || "");
    const sub = expense.subcategory || "";
    const categorySubs = SUBCATEGORIES[expense.category || ""] || [];
    if (sub && !categorySubs.includes(sub) && categorySubs.length > 0) {
      setEditSubcategory("Outro");
      setEditCustomSubcategory(sub);
    } else {
      setEditSubcategory(sub);
      setEditCustomSubcategory("");
    }
    setEditSubSubcategory(expense.sub_subcategory || "");
    setEditAmount(String(expense.amount));
    setEditFile(null);
    setEditDialogOpen(true);
  };

  const uploadFile = async (fileToUpload: File): Promise<string | null> => {
    const fileExt = fileToUpload.name.split(".").pop();
    const filePath = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("expense-invoices")
      .upload(filePath, fileToUpload, { contentType: fileToUpload.type });

    if (uploadError) {
      toast({ title: t("expenses.uploadError"), variant: "destructive" });
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("expense-invoices")
      .getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!name.trim() || !date || !amount) return;

    setUploading(true);
    let invoiceUrl: string | null = null;

    if (file) {
      invoiceUrl = await uploadFile(file);
      if (file && !invoiceUrl) {
        setUploading(false);
        return;
      }
    }

    const resolvedSubcategory = subcategory === "Outro" ? customSubcategory.trim() : subcategory;
    createMutation.mutate({
      name: name.trim(),
      category: category || null,
      subcategory: resolvedSubcategory || null,
      sub_subcategory: subSubcategory || null,
      expense_date: format(date, "yyyy-MM-dd"),
      amount: parseFloat(amount),
      invoice_url: invoiceUrl,
    });
    setUploading(false);
  };

  const handleEditSubmit = async () => {
    if (!editingExpense || !editName.trim() || !editDate || !editAmount) return;

    setEditUploading(true);
    let invoiceUrl: string | null = editingExpense.invoice_url;

    if (editFile) {
      const uploaded = await uploadFile(editFile);
      if (!uploaded) {
        setEditUploading(false);
        return;
      }
      invoiceUrl = uploaded;
    }

    const resolvedEditSubcategory = editSubcategory === "Outro" ? editCustomSubcategory.trim() : editSubcategory;
    updateMutation.mutate({
      id: editingExpense.id,
      name: editName.trim(),
      category: editCategory || null,
      subcategory: resolvedEditSubcategory || null,
      sub_subcategory: editSubSubcategory || null,
      expense_date: format(editDate, "yyyy-MM-dd"),
      amount: parseFloat(editAmount),
      invoice_url: invoiceUrl,
    });
    setEditUploading(false);
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const [expensesOpen, setExpensesOpen] = useState(false);

  // Month/year filter for viewing expenses
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const filteredExpenses = useMemo(() =>
    expenses.filter((e) => {
      const d = new Date(e.expense_date);
      return d.getFullYear() === viewYear && d.getMonth() + 1 === viewMonth;
    }), [expenses, viewMonth, viewYear]);

  const totalSelectedMonth = useMemo(() =>
    filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [filteredExpenses]);

  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Recurring expenses state
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [recName, setRecName] = useState("");
  const [recCategory, setRecCategory] = useState("");
  const [recSubcategory, setRecSubcategory] = useState("");
  const [recCustomSubcategory, setRecCustomSubcategory] = useState("");
  const [recSubSubcategory, setRecSubSubcategory] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recStartDate, setRecStartDate] = useState<Date>(new Date(2025, 8, 1));
  const [recEndDate, setRecEndDate] = useState<Date | null>(null);
  const [recHasEndDate, setRecHasEndDate] = useState(false);
  const [generatingRecurring, setGeneratingRecurring] = useState(false);
  const [editingRecurringId, setEditingRecurringId] = useState<string | null>(null);

  const { data: recurringExpenses = [] } = useQuery({
    queryKey: ["recurring_expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .order("name")
        .limit(10000);
      if (error) throw error;
      return data;
    },
  });

  const createRecurringMutation = useMutation({
    mutationFn: async (rec: { name: string; category: string | null; subcategory: string | null; sub_subcategory: string | null; amount: number; start_date: string; end_date: string | null }) => {
      const { error } = await supabase.from("recurring_expenses").insert(rec);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_expenses"] });
      toast({ title: t("expenses.recurringCreated") });
      resetRecurringForm();
    },
    onError: () => toast({ title: t("expenses.error"), variant: "destructive" }),
  });

  const toggleRecurringMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("recurring_expenses").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_expenses"] });
      toast({ title: t("expenses.recurringUpdated") });
    },
  });

  const deleteRecurringMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_expenses"] });
      toast({ title: t("expenses.recurringDeleted") });
    },
  });

  const updateRecurringMutation = useMutation({
    mutationFn: async (rec: { id: string; name: string; category: string | null; subcategory: string | null; sub_subcategory: string | null; amount: number; start_date: string; end_date: string | null }) => {
      const { id, ...rest } = rec;
      const { error } = await supabase.from("recurring_expenses").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring_expenses"] });
      toast({ title: t("expenses.recurringUpdated") });
      resetRecurringForm();
    },
    onError: () => toast({ title: t("expenses.error"), variant: "destructive" }),
  });

  const resetRecurringForm = () => {
    setRecName(""); setRecCategory(""); setRecSubcategory(""); setRecCustomSubcategory(""); setRecSubSubcategory(""); setRecAmount("");
    setRecStartDate(new Date(2025, 8, 1));
    setRecEndDate(null);
    setRecHasEndDate(false);
    setEditingRecurringId(null);
  };

  const handleEditRecurring = (rec: any) => {
    setEditingRecurringId(rec.id);
    setRecName(rec.name);
    setRecCategory(rec.category || "");
    setRecSubcategory(rec.subcategory || "");
    setRecSubSubcategory(rec.sub_subcategory || "");
    setRecAmount(String(rec.amount));
    setRecStartDate(rec.start_date ? new Date(rec.start_date + "T00:00:00") : new Date(2025, 8, 1));
    if (rec.end_date) {
      setRecHasEndDate(true);
      setRecEndDate(new Date(rec.end_date + "T00:00:00"));
    } else {
      setRecHasEndDate(false);
      setRecEndDate(null);
    }
  };

  const handleGenerateRecurring = async () => {
    setGeneratingRecurring(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-recurring-expenses", {
        method: "POST",
        body: {},
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["accounting-stats"] });
      toast({ title: `${t("expenses.recurringGenerated")} (${data?.created || 0})` });
    } catch {
      toast({ title: t("expenses.recurringGenerateError"), variant: "destructive" });
    } finally {
      setGeneratingRecurring(false);
    }
  };

  const handleAddRecurring = () => {
    if (!recName.trim() || !recAmount) return;
    const resolvedSub = recSubcategory === "Outro" ? recCustomSubcategory.trim() : recSubcategory;
    const startDateStr = format(recStartDate, "yyyy-MM-dd");
    const endDateStr = recHasEndDate && recEndDate ? format(recEndDate, "yyyy-MM-dd") : null;
    if (editingRecurringId) {
      updateRecurringMutation.mutate({
        id: editingRecurringId,
        name: recName.trim(),
        category: recCategory || null,
        subcategory: resolvedSub || null,
        sub_subcategory: recSubSubcategory || null,
        amount: parseFloat(recAmount),
        start_date: startDateStr,
        end_date: endDateStr,
      });
    } else {
      createRecurringMutation.mutate({
        name: recName.trim(),
        category: recCategory || null,
        subcategory: resolvedSub || null,
        sub_subcategory: recSubSubcategory || null,
        amount: parseFloat(recAmount),
        start_date: startDateStr,
        end_date: endDateStr,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle className="text-lg">{t("expenses.title")}</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setRecurringDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-1" />
            {t("expenses.manageRecurring")}
          </Button>
          <Button size="sm" variant="outline" onClick={handleGenerateRecurring} disabled={generatingRecurring}>
            <RefreshCw className={cn("h-4 w-4 mr-1", generatingRecurring && "animate-spin")} />
            {t("expenses.generateNow")}
          </Button>
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
                <Label>{t("expenses.category")}</Label>
                <Select value={category} onValueChange={(val) => { setCategory(val); setSubcategory(""); setCustomSubcategory(""); setSubSubcategory(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("expenses.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {FREETEXT_SUBCATEGORIES.includes(category) ? (
                <div>
                  <Label>{t("expenses.subcategory")}</Label>
                  <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder={t("expenses.championshipDescriptionPlaceholder")} />
                </div>
              ) : SUBCATEGORIES[category] ? (
                <div>
                  <Label>{t("expenses.subcategory")}</Label>
                  <Select value={subcategory} onValueChange={(val) => { setSubcategory(val); if (val !== "Outro") setCustomSubcategory(""); setSubSubcategory(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("expenses.subcategoryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBCATEGORIES[category].map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {subcategory === "Outro" && (
                    <Input className="mt-2" value={customSubcategory} onChange={(e) => setCustomSubcategory(e.target.value)} placeholder={t("expenses.customName")} />
                  )}
                </div>
              ) : null}
              {(() => {
                const subSubs = getSubSubcategories(category, subcategory);
                return subSubs && subcategory && subcategory !== "Outro" && (
                  <div>
                    <Label>{t("expenses.subSubcategory")}</Label>
                    <Select value={subSubcategory} onValueChange={setSubSubcategory}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("expenses.subSubcategoryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {subSubs.map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}
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
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={scanInputRef} onChange={handleScanChange} />
                  <input type="file" accept="image/*,.pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("expenses.loading")}</p>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("expenses.empty")}</p>
        ) : (
          <>
             <div className="flex flex-wrap items-center gap-2 mb-3">
               <Select value={String(viewMonth)} onValueChange={(v) => setViewMonth(Number(v))}>
                 <SelectTrigger className="w-[140px]">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {MONTH_NAMES.map((m, i) => (
                     <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Select value={String(viewYear)} onValueChange={(v) => setViewYear(Number(v))}>
                 <SelectTrigger className="w-[100px]">
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   {[2025, 2026, 2027].map((y) => (
                     <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <span className="text-sm font-medium ml-auto">
                 Total: <span className="text-primary">€{totalSelectedMonth.toFixed(2)}</span>
               </span>
             </div>
             <Collapsible open={expensesOpen} onOpenChange={setExpensesOpen}>
               <CollapsibleTrigger asChild>
                 <Button variant="ghost" size="sm" className="w-full flex items-center justify-between mb-2">
                   <span>{t("expenses.viewExpenses")} ({filteredExpenses.length})</span>
                   <ChevronDown className={cn("h-4 w-4 transition-transform", expensesOpen && "rotate-180")} />
                 </Button>
               </CollapsibleTrigger>
               <CollapsibleContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                         <TableHead>{t("expenses.name")}</TableHead>
                        <TableHead>{t("expenses.category")}</TableHead>
                        <TableHead>{t("expenses.subcategory")}</TableHead>
                        <TableHead>{t("expenses.subSubcategory")}</TableHead>
                        <TableHead>{t("expenses.date")}</TableHead>
                        <TableHead>{t("expenses.amount")}</TableHead>
                        <TableHead>{t("expenses.invoice")}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.name}</TableCell>
                          <TableCell>{expense.category || "—"}</TableCell>
                          <TableCell>{expense.subcategory || "—"}</TableCell>
                          <TableCell>{expense.sub_subcategory || "—"}</TableCell>
                          <TableCell>{format(new Date(expense.expense_date), "dd/MM/yyyy")}</TableCell>
                          <TableCell>€{Number(expense.amount).toFixed(2)}</TableCell>
                          <TableCell>
                            {expense.invoice_url ? (
                              <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                                <button onClick={() => handleViewInvoice(expense.invoice_url!)} className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                                  <ExternalLink className="h-3 w-3" />
                                  {t("expenses.viewInvoice")}
                                </button>
                                <button onClick={() => handleDownloadInvoice(expense.invoice_url!)} className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                                  <Download className="h-3 w-3" />
                                  Download
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(expense.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { if (!open) resetEditForm(); else setEditDialogOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("expenses.edit")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("expenses.name")}</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={t("expenses.namePlaceholder")} />
            </div>
            <div>
              <Label>{t("expenses.date")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !editDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editDate ? format(editDate, "PPP") : t("expenses.pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={editDate} onSelect={setEditDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>{t("expenses.category")}</Label>
              <Select value={editCategory} onValueChange={(val) => { setEditCategory(val); setEditSubcategory(""); setEditCustomSubcategory(""); setEditSubSubcategory(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder={t("expenses.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {FREETEXT_SUBCATEGORIES.includes(editCategory) ? (
              <div>
                <Label>{t("expenses.subcategory")}</Label>
                <Input value={editSubcategory} onChange={(e) => setEditSubcategory(e.target.value)} placeholder={t("expenses.championshipDescriptionPlaceholder")} />
              </div>
            ) : SUBCATEGORIES[editCategory] ? (
              <div>
                <Label>{t("expenses.subcategory")}</Label>
                <Select value={editSubcategory} onValueChange={(val) => { setEditSubcategory(val); if (val !== "Outro") setEditCustomSubcategory(""); setEditSubSubcategory(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("expenses.subcategoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBCATEGORIES[editCategory].map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editSubcategory === "Outro" && (
                  <Input className="mt-2" value={editCustomSubcategory} onChange={(e) => setEditCustomSubcategory(e.target.value)} placeholder={t("expenses.customName")} />
                )}
              </div>
            ) : null}
            {(() => {
              const subSubs = getSubSubcategories(editCategory, editSubcategory);
              return subSubs && editSubcategory && editSubcategory !== "Outro" && (
                <div>
                  <Label>{t("expenses.subSubcategory")}</Label>
                  <Select value={editSubSubcategory} onValueChange={setEditSubSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("expenses.subSubcategoryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {subSubs.map((sub) => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}
            <div>
              <Label>{t("expenses.amount")}</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="number" step="0.01" min="0" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="pl-9" placeholder="0.00" />
              </div>
            </div>
            <div>
              <Label>{t("expenses.invoice")}</Label>
              {editingExpense?.invoice_url && !editFile && (
                <p className="text-xs text-muted-foreground mt-1 mb-1">
                  {t("expenses.currentInvoice")}:{" "}
                  <span className="inline-flex flex-wrap items-center gap-3 align-middle">
                    <button onClick={() => handleViewInvoice(editingExpense.invoice_url!)} className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                      <ExternalLink className="h-3 w-3" />
                      {t("expenses.viewInvoice")}
                    </button>
                    <button onClick={() => handleDownloadInvoice(editingExpense.invoice_url!)} className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                      <Download className="h-3 w-3" />
                      Download
                    </button>
                  </span>
                </p>
              )}
              <div className="flex gap-2 mt-1">
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={editScanInputRef} onChange={handleEditScanChange} />
                <input type="file" accept="image/*,.pdf" className="hidden" ref={editFileInputRef} onChange={handleEditFileChange} />
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => editScanInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-1" />
                  {t("expenses.scanInvoice")}
                </Button>
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => editFileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" />
                  {t("expenses.uploadFile")}
                </Button>
              </div>
              {editFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("expenses.fileSelected")}: {editFile.name}
                </p>
              )}
            </div>
            <Button onClick={handleEditSubmit} disabled={!editName.trim() || !editDate || !editAmount || editUploading || updateMutation.isPending} className="w-full">
              {editUploading ? t("expenses.uploading") : t("expenses.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recurring Expenses Dialog */}
      <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("expenses.recurring")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new recurring */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{editingRecurringId ? t("expenses.editRecurring") : t("expenses.addRecurring")}</h4>
                {editingRecurringId && (
                  <Button variant="ghost" size="sm" onClick={resetRecurringForm}>
                    {t("expenses.cancelEdit")}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>{t("expenses.name")}</Label>
                  <Input value={recName} onChange={(e) => setRecName(e.target.value)} placeholder={t("expenses.namePlaceholder")} />
                </div>
                <div>
                  <Label>{t("expenses.amount")}</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="number" step="0.01" min="0" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} className="pl-9" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <Label>{t("expenses.category")}</Label>
                  <Select value={recCategory} onValueChange={(val) => { setRecCategory(val); setRecSubcategory(""); setRecCustomSubcategory(""); setRecSubSubcategory(""); }}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("expenses.categoryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {FREETEXT_SUBCATEGORIES.includes(recCategory) ? (
                  <div>
                    <Label>{t("expenses.subcategory")}</Label>
                    <Input value={recSubcategory} onChange={(e) => setRecSubcategory(e.target.value)} placeholder={t("expenses.championshipDescriptionPlaceholder")} />
                  </div>
                ) : SUBCATEGORIES[recCategory] ? (
                  <div>
                    <Label>{t("expenses.subcategory")}</Label>
                    <Select value={recSubcategory} onValueChange={(val) => { setRecSubcategory(val); if (val !== "Outro") setRecCustomSubcategory(""); setRecSubSubcategory(""); }}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("expenses.subcategoryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {SUBCATEGORIES[recCategory].map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {recSubcategory === "Outro" && (
                      <Input className="mt-2" value={recCustomSubcategory} onChange={(e) => setRecCustomSubcategory(e.target.value)} placeholder={t("expenses.customName")} />
                    )}
                  </div>
                ) : null}
                {SUB_SUBCATEGORIES[recCategory] && recSubcategory && recSubcategory !== "Outro" && (
                  <div>
                    <Label>{t("expenses.subSubcategory")}</Label>
                    <Select value={recSubSubcategory} onValueChange={setRecSubSubcategory}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("expenses.subSubcategoryPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {SUB_SUBCATEGORIES[recCategory].map((sub) => (
                          <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div>
                <Label>{t("expenses.startDate")}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(recStartDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={recStartDate} onSelect={(d) => d && setRecStartDate(d)} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={recHasEndDate} onCheckedChange={(checked) => { setRecHasEndDate(checked); if (!checked) setRecEndDate(null); }} />
                <Label className="text-sm">{t("expenses.setEndDate")}</Label>
              </div>
              {recHasEndDate && (
                <div>
                  <Label>{t("expenses.endDate")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !recEndDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recEndDate ? format(recEndDate, "dd/MM/yyyy") : t("expenses.endDate")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={recEndDate || undefined} onSelect={(d) => d && setRecEndDate(d)} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              <Button size="sm" onClick={handleAddRecurring} disabled={!recName.trim() || !recAmount || createRecurringMutation.isPending || updateRecurringMutation.isPending}>
                {editingRecurringId ? null : <Plus className="h-4 w-4 mr-1" />}
                {editingRecurringId ? t("expenses.saveRecurring") : t("expenses.addRecurring")}
              </Button>
            </div>

            {/* List of recurring expenses */}
            {recurringExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("expenses.noRecurring")}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>{t("expenses.name")}</TableHead>
                    <TableHead>{t("expenses.category")}</TableHead>
                    <TableHead>{t("expenses.amount")}</TableHead>
                    <TableHead>{t("expenses.period")}</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringExpenses.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">{rec.name}</TableCell>
                      <TableCell>{[rec.category, rec.subcategory, rec.sub_subcategory].filter(Boolean).join(" → ") || "—"}</TableCell>
                      <TableCell>€{Number(rec.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        {rec.start_date ? format(new Date(rec.start_date + "T00:00:00"), "MMM yyyy") : "Set 2025"}
                        {" → "}
                        {rec.end_date ? format(new Date(rec.end_date + "T00:00:00"), "MMM yyyy") : "∞"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rec.is_active}
                            onCheckedChange={(checked) => toggleRecurringMutation.mutate({ id: rec.id, is_active: checked })}
                          />
                          <span className="text-xs">{rec.is_active ? t("expenses.recurringActive") : t("expenses.recurringInactive")}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditRecurring(rec)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteRecurringMutation.mutate(rec.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
