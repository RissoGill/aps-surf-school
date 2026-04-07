import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, TrendingUp, TrendingDown, Wallet, Save, History } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { format } from "date-fns";

const CATEGORIES_PRIZE = ["prize"] as const;
const CATEGORIES_EXPENSE = ["coaching", "accommodation", "flights", "monthly_fee", "other"] as const;

const ProAccountTab = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [priorBalanceInput, setPriorBalanceInput] = useState<string>("");
  const [priorBalanceDateInput, setPriorBalanceDateInput] = useState<string>("");

  // Form state
  const [formType, setFormType] = useState<string>("prize_money");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formCategory, setFormCategory] = useState<string>("prize");
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formInvoice, setFormInvoice] = useState("");

  const categoryLabels: Record<string, string> = {
    prize: t("proAccount.categories.prize"),
    coaching: t("proAccount.categories.coaching"),
    accommodation: t("proAccount.categories.accommodation"),
    flights: t("proAccount.categories.flights"),
    monthly_fee: t("proAccount.categories.monthlyFee"),
    other: t("proAccount.categories.other"),
  };

  // Fetch competition athletes
  const { data: athletes } = useQuery({
    queryKey: ["pro-account-athletes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("atletas")
        .select("athlete_id, first_name, last_name, surf_level, is_active, pro_prior_balance, pro_prior_balance_date")
        .ilike("surf_level", "competition");
      if (error) throw error;
      return data || [];
    },
  });

  const selectedAthlete = useMemo(
    () => athletes?.find((a) => a.athlete_id === selectedAthleteId),
    [athletes, selectedAthleteId]
  );

  // Sync prior balance input when athlete changes
  const handleAthleteChange = (id: string) => {
    setSelectedAthleteId(id);
    const athlete = athletes?.find((a) => a.athlete_id === id);
    setPriorBalanceInput(String(athlete?.pro_prior_balance ?? 0));
    setPriorBalanceDateInput((athlete as any)?.pro_prior_balance_date ?? "");
  };

  // Fetch entries for selected athlete
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["pro-account-entries", selectedAthleteId],
    enabled: !!selectedAthleteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_account_entries")
        .select("*")
        .eq("athlete_id", selectedAthleteId)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Save prior balance mutation
  const savePriorBalance = useMutation({
    mutationFn: async ({ amount, date }: { amount: number; date: string }) => {
      const { error } = await supabase
        .from("atletas")
        .update({ pro_prior_balance: amount, pro_prior_balance_date: date || null } as any)
        .eq("athlete_id", selectedAthleteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-account-athletes"] });
      toast({ title: t("proAccount.priorBalanceSaved") });
    },
    onError: (err: any) => {
      toast({ title: t("proAccount.errorAdding"), description: err.message, variant: "destructive" });
    },
  });

  // Add entry mutation
  const addEntry = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pro_account_entries").insert({
        athlete_id: selectedAthleteId,
        entry_date: formDate,
        type: formType,
        category: formCategory,
        description: formDescription || null,
        amount: parseFloat(formAmount),
        invoice_number: formInvoice || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-account-entries", selectedAthleteId] });
      toast({ title: t("proAccount.entryAdded") });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: t("proAccount.errorAdding"), description: err.message, variant: "destructive" });
    },
  });

  // Delete entry mutation
  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pro_account_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pro-account-entries", selectedAthleteId] });
      toast({ title: t("proAccount.entryDeleted") });
    },
  });

  const resetForm = () => {
    setFormType("prize_money");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setFormCategory("prize");
    setFormDescription("");
    setFormAmount("");
    setFormInvoice("");
    setShowForm(false);
  };

  // Summary calculations
  const priorBalance = Number(selectedAthlete?.pro_prior_balance ?? 0);
  const summary = useMemo(() => {
    if (!entries) return { totalPrize: 0, totalExpense: 0, balance: 0 };
    const totalPrize = entries.filter((e) => e.type === "prize_money").reduce((s, e) => s + Number(e.amount), 0);
    const totalExpense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0);
    const totalOther = entries.filter((e) => e.type === "other").reduce((s, e) => s + Number(e.amount), 0);
    return { totalPrize, totalExpense, totalOther, balance: priorBalance + totalPrize + totalOther - totalExpense };
  }, [entries, priorBalance]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || parseFloat(formAmount) <= 0) {
      toast({ title: t("proAccount.invalidAmount"), variant: "destructive" });
      return;
    }
    addEntry.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Athlete selector */}
      <Card>
        <CardHeader>
          <CardTitle>{t("proAccount.selectAthlete")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAthleteId} onValueChange={handleAthleteChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("proAccount.chooseAthlete")} />
            </SelectTrigger>
            <SelectContent>
              {(athletes || []).map((a) => (
                <SelectItem key={a.athlete_id} value={a.athlete_id}>
                  {a.athlete_id} - {a.first_name} {a.last_name}
                  {a.is_active === false && " (Inativo)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAthleteId && (
        <>
          {/* Prior Balance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                   <Label className="flex items-center gap-2">
                     <History className="h-4 w-4" />
                     {t("proAccount.priorBalance")}
                   </Label>
                   <Input
                     type="number"
                     step="0.01"
                     value={priorBalanceInput}
                     onChange={(e) => setPriorBalanceInput(e.target.value)}
                     placeholder="0.00"
                   />
                 </div>
                 <div className="flex-1 space-y-2">
                   <Label>{t("proAccount.priorBalanceDate")}</Label>
                   <Input
                     type="date"
                     value={priorBalanceDateInput}
                     onChange={(e) => setPriorBalanceDateInput(e.target.value)}
                   />
                 </div>
                 <Button
                   onClick={() => savePriorBalance.mutate({ amount: parseFloat(priorBalanceInput) || 0, date: priorBalanceDateInput })}
                   disabled={savePriorBalance.isPending}
                   size="sm"
                 >
                   <Save className="h-4 w-4 mr-1" />
                   {t("proAccount.savePriorBalance")}
                 </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="overflow-hidden">
              <CardContent className="p-4 pt-4 text-center">
                <History className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-base sm:text-lg font-bold">€{priorBalance.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground leading-tight">{t("proAccount.priorBalance")}</p>
                {(selectedAthlete as any)?.pro_prior_balance_date && (
                  <p className="text-[11px] text-muted-foreground mt-1 whitespace-nowrap">{(selectedAthlete as any).pro_prior_balance_date}</p>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4 pt-4 text-center">
                <TrendingUp className="h-5 w-5 text-success mx-auto mb-1" />
                <p className="text-base sm:text-lg font-bold text-success">€{summary.totalPrize.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground leading-tight">{t("proAccount.totalPrize")}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4 pt-4 text-center">
                <TrendingDown className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-base sm:text-lg font-bold text-destructive">€{summary.totalExpense.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground leading-tight">{t("proAccount.totalExpenses")}</p>
              </CardContent>
            </Card>
            <Card className="overflow-hidden">
              <CardContent className="p-4 pt-4 text-center">
                <Wallet className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className={`text-base sm:text-lg font-bold ${summary.balance >= 0 ? "text-success" : "text-destructive"}`}>
                  €{summary.balance.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">{t("proAccount.balance")}</p>
              </CardContent>
            </Card>
          </div>

          {/* Add entry button / form */}
          {!showForm ? (
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {t("proAccount.addEntry")}
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("proAccount.newEntry")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("proAccount.type")}</Label>
                      <Select
                        value={formType}
                        onValueChange={(v) => {
          setFormType(v);
                          setFormCategory(v === "prize_money" ? "prize" : v === "other" ? "other" : "coaching");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="prize_money">Prize Money</SelectItem>
                          <SelectItem value="expense">{t("proAccount.expense")}</SelectItem>
                          <SelectItem value="other">{t("proAccount.other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("proAccount.date")}</Label>
                      <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("proAccount.category")}</Label>
                      <Select value={formCategory} onValueChange={setFormCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {formType === "prize_money"
                            ? CATEGORIES_PRIZE.map((c) => (
                                <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                              ))
                            : formType === "other"
                            ? <SelectItem value="other">{categoryLabels["other"]}</SelectItem>
                            : CATEGORIES_EXPENSE.map((c) => (
                                <SelectItem key={c} value={c}>{categoryLabels[c]}</SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("proAccount.amount")} (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("proAccount.description")}</Label>
                    <Input
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder={formType === "prize_money" ? t("proAccount.stagePlaceholder") : t("proAccount.descriptionPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("proAccount.invoice")}</Label>
                    <Input value={formInvoice} onChange={(e) => setFormInvoice(e.target.value)} placeholder={t("proAccount.invoicePlaceholder")} />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={addEntry.isPending} className="flex-1">
                      {addEntry.isPending ? "..." : t("proAccount.save")}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {t("proAccount.cancel")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Entries table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("proAccount.movements")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {entriesLoading ? (
                <p className="p-4 text-muted-foreground">{t("proAccount.loading")}</p>
              ) : !entries?.length ? (
                <p className="p-4 text-muted-foreground">{t("proAccount.noEntries")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("proAccount.date")}</TableHead>
                        <TableHead>{t("proAccount.type")}</TableHead>
                        <TableHead>{t("proAccount.category")}</TableHead>
                        <TableHead>{t("proAccount.description")}</TableHead>
                        <TableHead className="text-right">{t("proAccount.amount")}</TableHead>
                        <TableHead>{t("proAccount.invoice")}</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="whitespace-nowrap">{entry.entry_date}</TableCell>
                          <TableCell>
                            <Badge variant={entry.type === "expense" ? "destructive" : entry.type === "other" ? "secondary" : "default"}>
                              {entry.type === "prize_money" ? "Prize Money" : entry.type === "other" ? t("proAccount.other") : t("proAccount.expense")}
                            </Badge>
                          </TableCell>
                          <TableCell>{categoryLabels[entry.category] || entry.category}</TableCell>
                          <TableCell>{entry.description || "-"}</TableCell>
                          <TableCell className={`text-right font-medium ${entry.type === "expense" ? "text-destructive" : "text-success"}`}>
                            {entry.type === "expense" ? "-" : "+"}€{Number(entry.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{entry.invoice_number || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteEntry.mutate(entry.id)}
                              disabled={deleteEntry.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProAccountTab;
