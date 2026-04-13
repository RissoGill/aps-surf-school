import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageContext";
import apsLogoImage from "@/assets/aps-logo.png";
import html2pdf from "html2pdf.js";
import { escapeHtml } from "@/utils/htmlSanitize";

const EXPENSE_CATEGORIES = [
  "Despesas Bancárias", "Salários", "Portagens", "Carrinhas",
  "Impostos", "Comunicações", "Contabilidade", "Compras Fornecedores",
  "Material Técnico", "Seguros", "Despesas Legais", "Licenças",
  "Devolução Sócios", "Custos Campeonatos", "Outros"
];

const SUBCATEGORIES: Record<string, string[]> = {
  "Despesas Bancárias": ["Manutenção", "Imposto de Selo", "Avales e Garantias", "Juros"],
  "Salários": ["Nuno Telmo", "David", "Danilo", "Gustavo", "Aaron", "Zé Pinho", "Outro"],
  "Carrinhas": ["85-QD-72", "85-QD-73", "21-XA-53", "21-XA-61", "26-DB-02"],
  "Impostos": ["IVA", "IRS", "IRC"],
  "Seguros": ["Cascos Marítimos", "Acidentes Pessoais"],
  "Licenças": ["CMC", "Capitania", "Federação", "RNNAT"],
};

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const ExpenseReportsCard = () => {
  const { t } = useLanguage();
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [reportType, setReportType] = useState<"expenses" | "complete">("expenses");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportHtml, setReportHtml] = useState<string | null>(null);

  const subcategories = useMemo(() => {
    if (selectedCategory === "all") return [];
    return SUBCATEGORIES[selectedCategory] || [];
  }, [selectedCategory]);

  const generateExpenseReport = async () => {
    const startDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(viewYear, viewMonth, 0).getDate();
    const endDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${lastDay}`;

    let query = supabase.from('expenses').select('*')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: true });

    if (selectedCategory !== "all") {
      query = query.eq('category', selectedCategory);
    }
    if (selectedSubcategory !== "all") {
      query = query.eq('subcategory', selectedSubcategory);
    }

    const { data, error } = await query;
    if (error) throw error;

    const expenses = data || [];
    const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const categoryBreakdown: Record<string, { count: number; total: number }> = {};
    expenses.forEach((e) => {
      const cat = e.category || "Sem Categoria";
      if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { count: 0, total: 0 };
      categoryBreakdown[cat].count++;
      categoryBreakdown[cat].total += Number(e.amount || 0);
    });

    const monthLabel = MONTH_NAMES_PT[viewMonth - 1];
    const title = selectedCategory !== "all"
      ? `Relatório de Despesas - ${selectedCategory} - ${monthLabel} ${viewYear}`
      : `Relatório de Despesas - ${monthLabel} ${viewYear}`;

    const tableRows = expenses.map(e => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.expense_date)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.name)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.category || '-')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.subcategory || '-')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.sub_subcategory || '-')}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${Number(e.amount).toFixed(2)}</td>
      </tr>
    `).join("");

    const totalRow = `
      <tr style="background-color: #f0f0f0; font-weight: bold;">
        <td colspan="5" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${totalAmount.toFixed(2)}</td>
      </tr>
    `;

    const summarySection = `
      <div style="background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <h2 style="color: #31A896; margin-top: 0;">Resumo</h2>
        <p><strong>Total de Despesas:</strong> €${totalAmount.toFixed(2)}</p>
        <p><strong>Número de Registos:</strong> ${expenses.length}</p>
        <div style="margin-top: 10px;">
          <strong>Por Categoria:</strong>
          <ul style="margin: 5px 0;">
            ${Object.entries(categoryBreakdown).map(([cat, stats]) => `
              <li>${escapeHtml(cat)}: ${stats.count} registos, €${stats.total.toFixed(2)}</li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    return buildHtmlWrapper(title, monthLabel, summarySection + `
      <table>
        <tr><th>Data</th><th>Fornecedor</th><th>Categoria</th><th>Subcategoria</th><th>Sub-subcategoria</th><th>Valor</th></tr>
        ${tableRows}
        ${totalRow}
      </table>
    `);
  };

  const generateCompleteReport = async () => {
    const startDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(viewYear, viewMonth, 0).getDate();
    const endDate = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${lastDay}`;

    const monthNameEn = MONTH_NAMES_EN[viewMonth - 1];

    const [expensesRes, paymentsRes, athletesRes, coachPaymentsRes, coachesRes] = await Promise.all([
      supabase.from('expenses').select('*')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate)
        .order('expense_date', { ascending: true }),
      supabase.from('payments').select('*')
        .eq('month', monthNameEn)
        .eq('year', viewYear)
        .limit(10000)
        .in('status', ['Paid', 'Partial', 'paid', 'partial']),
      supabase.from('atletas').select('athlete_id, first_name, last_name'),
      supabase.from('coach_payments').select('*')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .order('payment_date', { ascending: true }),
      supabase.from('coach').select('coach_id, first_name, last_name'),
    ]);

    if (expensesRes.error) throw expensesRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    const expenses = expensesRes.data || [];
    const payments = paymentsRes.data || [];
    const athletes = athletesRes.data || [];
    const coachPayments = coachPaymentsRes.data || [];
    const coaches = coachesRes.data || [];

    const athleteMap: Record<string, string> = {};
    athletes.forEach(a => {
      athleteMap[a.athlete_id] = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.athlete_id;
    });

    const coachMap: Record<string, string> = {};
    coaches.forEach(c => {
      coachMap[c.coach_id] = `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.coach_id;
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalCoachPayments = coachPayments.reduce((sum, cp) => sum + Number(cp.amount || 0), 0);
    const totalAllExpenses = totalExpenses + totalCoachPayments;
    const totalIncome = payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    const balance = totalIncome - totalAllExpenses;

    const monthLabel = MONTH_NAMES_PT[viewMonth - 1];
    const title = `Relatório Mensal Completo - ${monthLabel} ${viewYear}`;

    const balanceColor = balance >= 0 ? '#27ae60' : '#e74c3c';

    const summarySection = `
      <div style="background-color: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
        <h2 style="color: #31A896; margin-top: 0;">Resumo</h2>
        <div style="display: flex; gap: 30px; flex-wrap: wrap;">
          <div>
            <p style="margin: 5px 0;"><strong>Total Receitas:</strong> <span style="color: #27ae60;">€${totalIncome.toFixed(2)}</span></p>
            <p style="margin: 5px 0;"><strong>Nº Pagamentos:</strong> ${payments.length}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Despesas Operacionais:</strong> <span style="color: #e74c3c;">€${totalExpenses.toFixed(2)}</span></p>
            <p style="margin: 5px 0;"><strong>Salários (Treinadores):</strong> <span style="color: #e74c3c;">€${totalCoachPayments.toFixed(2)}</span></p>
            <p style="margin: 5px 0;"><strong>Total Despesas + Salários:</strong> <span style="color: #e74c3c; font-weight: bold;">€${totalAllExpenses.toFixed(2)}</span></p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Balanço:</strong> <span style="color: ${balanceColor}; font-size: 18px; font-weight: bold;">€${balance.toFixed(2)}</span></p>
          </div>
        </div>
      </div>
    `;

    const incomeRows = payments.map(p => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(athleteMap[p.athlete_id || ''] || p.athlete_id || '-')}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(p.payment_date || '-')}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${Number(p.amount_paid || 0).toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(p.status || '-')}</td>
      </tr>
    `).join("");

    const incomeTotalRow = `
      <tr style="background-color: #f0f0f0; font-weight: bold;">
        <td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${totalIncome.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;"></td>
      </tr>
    `;

    const expenseRows = expenses.map(e => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.expense_date)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.name)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(e.category || '-')}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${Number(e.amount).toFixed(2)}</td>
      </tr>
    `).join("");

    const expenseTotalRow = `
      <tr style="background-color: #f0f0f0; font-weight: bold;">
        <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${totalExpenses.toFixed(2)}</td>
      </tr>
    `;

    const coachPaymentRows = coachPayments.map(cp => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(coachMap[cp.coach_id] || cp.coach_id)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(cp.payment_date)}</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${Number(cp.amount).toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${escapeHtml(cp.notes || '-')}</td>
      </tr>
    `).join("");

    const coachPaymentTotalRow = `
      <tr style="background-color: #f0f0f0; font-weight: bold;">
        <td colspan="2" style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total:</td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">€${totalCoachPayments.toFixed(2)}</td>
        <td style="border: 1px solid #ddd; padding: 8px;"></td>
      </tr>
    `;

    const body = `
      ${summarySection}
      <h2 style="color: #31A896; margin-top: 30px;">Receitas</h2>
      <table>
        <tr><th>Atleta</th><th>Data Pagamento</th><th>Valor Pago</th><th>Estado</th></tr>
        ${incomeRows}
        ${incomeTotalRow}
      </table>
      <h2 style="color: #31A896; margin-top: 30px;">Despesas Operacionais</h2>
      <table>
        <tr><th>Data</th><th>Fornecedor</th><th>Categoria</th><th>Valor</th></tr>
        ${expenseRows}
        ${expenseTotalRow}
      </table>
      ${coachPayments.length > 0 ? `
        <h2 style="color: #31A896; margin-top: 30px;">Salários (Treinadores)</h2>
        <table>
          <tr><th>Treinador</th><th>Data</th><th>Valor</th><th>Notas</th></tr>
          ${coachPaymentRows}
          ${coachPaymentTotalRow}
        </table>
      ` : ''}
    `;

    return buildHtmlWrapper(title, monthLabel, body);
  };

  const buildHtmlWrapper = (title: string, monthLabel: string, bodyContent: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #31A896; padding-bottom: 20px; }
          .logo { max-width: 200px; margin-bottom: 20px; }
          h1 { color: #31A896; margin: 0; font-size: 22px; }
          .meta { color: #666; font-size: 14px; margin-top: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #31A896; color: white; padding: 12px; text-align: left; border: 1px solid #ddd; }
          td { padding: 8px; border: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${apsLogoImage}" alt="APS Logo" class="logo" />
          <h1>${escapeHtml(title)}</h1>
          <div class="meta">
            <p>Período: ${monthLabel} ${viewYear}</p>
            <p>Gerado em: ${format(new Date(), "PPP 'às' p")}</p>
          </div>
        </div>
        ${bodyContent}
        <div class="footer">
          <p>© ${new Date().getFullYear()} Surf School Management System</p>
          <p>Relatório gerado automaticamente</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      const html = reportType === "complete"
        ? await generateCompleteReport()
        : await generateExpenseReport();
      setReportHtml(html);
      toast.success(t('shared.reports.success'));
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error(t('shared.reports.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const viewReport = () => {
    if (!reportHtml) return;
    const viewer = window.open('', '_blank');
    if (!viewer) {
      toast.error(t('shared.reports.popupBlocked'));
      return;
    }
    viewer.document.open();
    viewer.document.write(reportHtml);
    viewer.document.close();
  };

  const downloadReport = async () => {
    if (!reportHtml) return;
    const element = document.createElement('div');
    element.innerHTML = reportHtml;
    const monthLabel = MONTH_NAMES_PT[viewMonth - 1];
    const prefix = reportType === "complete" ? "relatorio_mensal" : "despesas";
    const opt = {
      margin: 10,
      filename: `${prefix}_${monthLabel}_${viewYear}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    try {
      await html2pdf().from(element).set(opt).save();
      toast.success(t('shared.reports.pdfDownloaded'));
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(t('shared.reports.failedToDownload'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-1">{t('expenses.reports.title')}</h4>
            <p className="text-sm text-muted-foreground">{t('expenses.reports.description')}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report type selector */}
        <div className="space-y-1">
          <label className="text-sm font-medium">{t('expenses.reports.reportType')}</label>
          <Select value={reportType} onValueChange={(v) => { setReportType(v as "expenses" | "complete"); setReportHtml(null); }}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="expenses">{t('expenses.reports.expensesByCategory')}</SelectItem>
              <SelectItem value="complete">{t('expenses.reports.completeMonthly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Month/Year selectors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('expenses.selectMonth')}</label>
            <Select value={String(viewMonth)} onValueChange={(v) => { setViewMonth(Number(v)); setReportHtml(null); }}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50 max-h-[300px]">
                {MONTH_NAMES_PT.map((name, idx) => (
                  <SelectItem key={idx} value={String(idx + 1)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t('expenses.selectYear')}</label>
            <Select value={String(viewYear)} onValueChange={(v) => { setViewYear(Number(v)); setReportHtml(null); }}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category filter - only for expenses report */}
        {reportType === "expenses" && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t('expenses.reports.category')}</label>
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSelectedSubcategory("all"); setReportHtml(null); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  <SelectItem value="all">{t('expenses.reports.allCategories')}</SelectItem>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subcategories.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium">{t('expenses.reports.subcategory')}</label>
                <Select value={selectedSubcategory} onValueChange={(v) => { setSelectedSubcategory(v); setReportHtml(null); }}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50 max-h-[300px]">
                    <SelectItem value="all">{t('expenses.reports.allSubcategories')}</SelectItem>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}

        <Button
          onClick={generateReport}
          disabled={isGenerating}
          variant="default"
          className="w-full"
        >
          {isGenerating ? t('shared.reports.generating') : t('expenses.reports.generate')}
        </Button>

        {reportHtml && (
          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button onClick={downloadReport} variant="default" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              {t('shared.reports.downloadPDF')}
            </Button>
            <Button onClick={viewReport} variant="outline" className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              {t('shared.reports.viewPDF')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
