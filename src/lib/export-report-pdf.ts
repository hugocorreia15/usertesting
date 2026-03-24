import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  TemplateWithRelations,
  TestSessionWithRelations,
  TaskResultWithRelations,
} from "@/types";
import { SUS_QUESTIONS, calculateSusScore, getSusLabel } from "@/lib/sus";

// ── Chart colors ──────────────────────────────────────
const C = {
  primary: [99, 102, 241] as RGB,     // indigo
  secondary: [20, 184, 166] as RGB,   // teal
  tertiary: [139, 92, 246] as RGB,    // purple
  warning: [245, 158, 11] as RGB,     // amber
  danger: [239, 68, 68] as RGB,       // red
  muted: [148, 163, 184] as RGB,      // slate
  success: [34, 197, 94] as RGB,      // green
};

type RGB = [number, number, number];

const PIE_PALETTE: RGB[] = [C.primary, C.secondary, C.danger, C.muted, C.tertiary];

// ── Chart drawing helpers ──────────────────────────────────────

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > doc.internal.pageSize.getHeight() - 15) {
    doc.addPage();
    return 15;
  }
  return y;
}

function drawBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; values: { value: number; color: RGB; name: string }[] }[],
  title: string,
  yAxisLabel?: string,
) {
  const margin = { left: 25, bottom: 35, top: 18, right: 10 };
  const chartW = w - margin.left - margin.right;
  const chartH = h - margin.top - margin.bottom;
  const chartX = x + margin.left;
  const chartY = y + margin.top;

  // Title
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(title, x + w / 2, y + 5, { align: "center" });

  // Y-axis label
  if (yAxisLabel) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(yAxisLabel, x + 2, chartY + chartH / 2, { angle: 90 });
  }

  // Find max value
  const maxVal = Math.max(1, ...data.flatMap((d) => d.values.map((v) => v.value)));

  // Grid lines
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.1);
  const gridSteps = 4;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 120, 120);
  for (let i = 0; i <= gridSteps; i++) {
    const gy = chartY + chartH - (i / gridSteps) * chartH;
    doc.line(chartX, gy, chartX + chartW, gy);
    const val = Math.round((maxVal / gridSteps) * i);
    doc.text(String(val), chartX - 2, gy + 1, { align: "right" });
  }
  doc.setTextColor(0, 0, 0);

  // Bars
  const groupCount = data.length;
  const barsPerGroup = data[0]?.values.length ?? 1;
  const groupWidth = chartW / groupCount;
  const barGap = 1;
  const barWidth = Math.min(12, (groupWidth - barGap * (barsPerGroup + 1)) / barsPerGroup);
  const groupBarWidth = barWidth * barsPerGroup + barGap * (barsPerGroup - 1);

  for (let gi = 0; gi < groupCount; gi++) {
    const group = data[gi];
    const groupX = chartX + gi * groupWidth + (groupWidth - groupBarWidth) / 2;

    for (let bi = 0; bi < group.values.length; bi++) {
      const val = group.values[bi];
      const barH = (val.value / maxVal) * chartH;
      const bx = groupX + bi * (barWidth + barGap);
      const by = chartY + chartH - barH;

      doc.setFillColor(...val.color);
      doc.roundedRect(bx, by, barWidth, barH, 1, 1, "F");

      // Value label on top
      if (val.value > 0) {
        doc.setFontSize(5);
        doc.setFont("helvetica", "normal");
        doc.text(String(Math.round(val.value * 10) / 10), bx + barWidth / 2, by - 1, { align: "center" });
      }
    }

    // X-axis label
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    const labelText = group.label.length > 12 ? group.label.substring(0, 11) + "..." : group.label;
    doc.text(labelText, chartX + gi * groupWidth + groupWidth / 2, chartY + chartH + 4, {
      align: "center",
      angle: -25,
    });
  }

  // Legend (centered)
  const legendY = chartY + chartH + 18;
  const legendNames = data[0]?.values.map((v) => v.name) ?? [];
  const legendColors = data[0]?.values.map((v) => v.color) ?? [];
  doc.setFontSize(6);
  // Calculate total legend width first
  const itemWidths = legendNames.map((name) => 4 + 3 + doc.getTextWidth(name)); // swatch + gap + text
  const legendGap = 8;
  const totalLegendW = itemWidths.reduce((sum, iw) => sum + iw, 0) + legendGap * (legendNames.length - 1);
  let legendX = x + w / 2 - totalLegendW / 2;
  for (let i = 0; i < legendNames.length; i++) {
    doc.setFillColor(...legendColors[i]);
    doc.roundedRect(legendX, legendY - 2, 4, 3, 0.5, 0.5, "F");
    doc.text(legendNames[i], legendX + 6, legendY, { align: "left" });
    legendX += itemWidths[i] + legendGap;
  }
}

function drawPieChart(
  doc: jsPDF,
  cx: number,
  cy: number,
  radius: number,
  data: { label: string; value: number; color: RGB }[],
  title: string,
) {
  // Title
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(title, cx, cy - radius - 8, { align: "center" });

  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  let startAngle = -Math.PI / 2;
  const segments = 60;

  for (const slice of data) {
    const sliceAngle = (slice.value / total) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // Draw filled arc using small triangles
    doc.setFillColor(...slice.color);
    for (let i = 0; i < segments; i++) {
      const a1 = startAngle + (sliceAngle * i) / segments;
      const a2 = startAngle + (sliceAngle * (i + 1)) / segments;
      const x1 = cx + radius * Math.cos(a1);
      const y1 = cy + radius * Math.sin(a1);
      const x2 = cx + radius * Math.cos(a2);
      const y2 = cy + radius * Math.sin(a2);
      doc.triangle(cx, cy, x1, y1, x2, y2, "F");
    }

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = radius + 8;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const pct = Math.round((slice.value / total) * 100);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(`${slice.label} (${pct}%)`, lx, ly, {
      align: midAngle > Math.PI / 2 && midAngle < (3 * Math.PI) / 2 ? "right" : "left",
    });

    startAngle = endAngle;
  }
}

function drawHorizontalBarChart(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  data: { label: string; value: number; color: RGB }[],
  title: string,
) {
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(title, x + w / 2, y + 5, { align: "center" });

  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const barAreaY = y + 12;
  const barAreaH = h - 16;
  const labelWidth = 50;
  const barAreaW = w - labelWidth - 10;
  const barH = Math.min(8, (barAreaH - 4) / data.length);
  const gap = 2;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const by = barAreaY + i * (barH + gap);
    const bw = (item.value / maxVal) * barAreaW;

    // Label
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const label = item.label.length > 20 ? item.label.substring(0, 19) + "..." : item.label;
    doc.text(label, x + labelWidth - 2, by + barH / 2 + 1, { align: "right" });

    // Bar
    doc.setFillColor(...item.color);
    doc.roundedRect(x + labelWidth, by, Math.max(1, bw), barH, 1, 1, "F");

    // Value
    doc.setFontSize(5);
    doc.text(String(Math.round(item.value * 10) / 10), x + labelWidth + bw + 2, by + barH / 2 + 1);
  }
}

// ── Main export function ──────────────────────────────────────

export function exportReportPdf(
  template: TemplateWithRelations,
  sessions: TestSessionWithRelations[],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 15;

  // --- Title Page / Header ---
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(template.name, pageWidth / 2, y, { align: "center" });
  y += 8;

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Usability Test Report", pageWidth / 2, y, { align: "center" });
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
  y += 8;

  if (template.description) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(template.description, pageWidth - margin * 2);
    doc.text(lines, pageWidth / 2, y, { align: "center" });
    y += lines.length * 4 + 4;
  }

  // --- Summary ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  y += 2;

  const completed = sessions.filter((s) => s.status === "completed").length;
  const inProgress = sessions.filter((s) => s.status === "in_progress").length;
  const planned = sessions.filter((s) => s.status === "planned").length;

  autoTable(doc, {
    startY: y,
    head: [],
    body: [
      ["Total Sessions", String(sessions.length)],
      ["Completed", String(completed)],
      ["In Progress", String(inProgress)],
      ["Planned", String(planned)],
    ],
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 }, 1: { cellWidth: 30 } },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // --- Per-session sections ---
  sessions.forEach((session, idx) => {
    if (idx > 0) { doc.addPage(); y = 15; }
    else { y = ensureSpace(doc, y, 60); }

    // Session header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Session ${idx + 1}: ${session.participants.name}`, margin, y);
    y += 6;

    const startedAt = session.started_at ? new Date(session.started_at).toLocaleString() : "—";
    const completedAt = session.completed_at ? new Date(session.completed_at).toLocaleString() : "—";

    autoTable(doc, {
      startY: y,
      head: [],
      body: [
        ["Participant", session.participants.name],
        ["Age", session.participants.age != null ? String(session.participants.age) : "—"],
        ["Gender", session.participants.gender || "—"],
        ["Tech Proficiency", session.participants.tech_proficiency || "—"],
        ["Evaluator", session.evaluator_name],
        ["Status", session.status],
        ["Started", startedAt],
        ["Completed", completedAt],
      ],
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 35 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Task results table
    const sortedResults = [...session.task_results].sort(
      (a, b) => a.template_tasks.sort_order - b.template_tasks.sort_order,
    );

    if (sortedResults.length > 0) {
      y = ensureSpace(doc, y, 40);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Task Results", margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [["Task", "Comp.", "Time (s)", "Actions", "Optimal", "Errors", "Hesit.", "SEQ"]],
        body: sortedResults.map((r) => [
          r.template_tasks.name,
          r.completion_status || "—",
          r.time_seconds != null ? String(Number(r.time_seconds).toFixed(1)) : "—",
          r.action_count != null ? String(r.action_count) : "—",
          r.template_tasks.optimal_actions != null ? String(r.template_tasks.optimal_actions) : "—",
          String(r.error_count),
          String(r.hesitation_count),
          r.seq_rating != null ? String(r.seq_rating) : "—",
        ]),
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: { 0: { cellWidth: 45 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      // ── Individual session charts ──
      renderSessionCharts(doc, sortedResults, margin, pageWidth);
      // Charts used their own page(s); start a fresh page for remaining content
      doc.addPage();
      y = 15;
    }

    // Error logs
    const allErrors = sortedResults.flatMap((r) =>
      r.error_logs.map((e) => ({
        task: r.template_tasks.name,
        time: e.timestamp_seconds != null ? String(e.timestamp_seconds) : "—",
        description: e.description || "—",
      })),
    );

    if (allErrors.length > 0) {
      y = ensureSpace(doc, y, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Error Log", margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [["Task", "Time (s)", "Description"]],
        body: allErrors.map((e) => [e.task, e.time, e.description]),
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 18 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Hesitation logs
    const allHesitations = sortedResults.flatMap((r) =>
      r.hesitation_logs.map((h) => ({
        task: r.template_tasks.name,
        time: h.timestamp_seconds != null ? String(h.timestamp_seconds) : "—",
        note: h.note || "—",
      })),
    );

    if (allHesitations.length > 0) {
      y = ensureSpace(doc, y, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Hesitation Notes", margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [["Task", "Time (s)", "Note"]],
        body: allHesitations.map((h) => [h.task, h.time, h.note]),
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 18 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Interview answers
    const answeredQuestions = session.interview_answers.filter((a) => a.answer_text);
    if (answeredQuestions.length > 0) {
      y = ensureSpace(doc, y, 30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Interview Answers", margin, y);
      y += 6;

      const questionMap = new Map(template.template_questions.map((q) => [q.id, q.question_text]));
      doc.setFontSize(9);
      for (const answer of answeredQuestions) {
        y = ensureSpace(doc, y, 25);
        const qText = questionMap.get(answer.question_id) || "Unknown question";
        doc.setFont("helvetica", "bold");
        doc.text(`Q: ${qText}`, margin, y, { maxWidth: pageWidth - margin * 2 });
        const qLines = doc.splitTextToSize(`Q: ${qText}`, pageWidth - margin * 2);
        y += qLines.length * 4 + 1;
        doc.setFont("helvetica", "normal");
        const aLines = doc.splitTextToSize(answer.answer_text!, pageWidth - margin * 2);
        doc.text(aLines, margin, y);
        y += aLines.length * 4 + 5;
      }
    }

    // SUS Questionnaire
    if (session.sus_answers && session.sus_answers.length > 0) {
      y = ensureSpace(doc, y, 40);
      const susScore = calculateSusScore(session.sus_answers);
      const susLabel = susScore != null ? getSusLabel(susScore) : null;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(
        `SUS Questionnaire${susScore != null ? ` — Score: ${susScore.toFixed(1)} (${susLabel})` : ""}`,
        margin,
        y,
      );
      y += 2;

      const sortedSus = [...session.sus_answers].sort((a, b) => a.question_number - b.question_number);
      autoTable(doc, {
        startY: y,
        head: [["#", "Question", "Score"]],
        body: sortedSus.map((a) => [
          String(a.question_number),
          SUS_QUESTIONS[a.question_number - 1],
          `${a.score}/5`,
        ]),
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: { 0: { cellWidth: 8 }, 2: { cellWidth: 15 } },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Session notes
    if (session.notes) {
      y = ensureSpace(doc, y, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Session Notes", margin, y);
      y += 5;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(session.notes, pageWidth - margin * 2);
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4 + 4;
    }
  });

  // ── Overall Summary Charts (across all sessions) ──
  const completedSessions = sessions.filter((s) => s.status === "completed");
  if (completedSessions.length > 0) {
    renderOverallCharts(doc, template, completedSessions, margin, pageWidth);
  }

  const safeName = template.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  doc.save(`${safeName}_report.pdf`);
}

// ── Per-session charts ──────────────────────────────────────

function renderSessionCharts(
  doc: jsPDF,
  taskResults: TaskResultWithRelations[],
  margin: number,
  pageWidth: number,
) {
  doc.addPage();
  let y = 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Session Performance Charts", margin, y);
  y += 4;

  const halfW = (pageWidth - margin * 2 - 6) / 2;
  const chartH = 70;

  // Chart 1: Time vs Optimal
  const timeData = taskResults.map((tr) => ({
    label: tr.template_tasks.name,
    values: [
      { value: tr.time_seconds != null ? Number(tr.time_seconds) : 0, color: C.primary, name: "Actual" },
      { value: tr.template_tasks.optimal_time_seconds ?? 0, color: C.secondary, name: "Optimal" },
    ],
  }));
  drawBarChart(doc, margin, y, halfW, chartH, timeData, "Time vs Optimal (seconds)");

  // Chart 2: Actions vs Optimal
  const actionData = taskResults.map((tr) => ({
    label: tr.template_tasks.name,
    values: [
      { value: tr.action_count ?? 0, color: C.tertiary, name: "Actual" },
      { value: tr.template_tasks.optimal_actions ?? 0, color: C.secondary, name: "Optimal" },
    ],
  }));
  drawBarChart(doc, margin + halfW + 6, y, halfW, chartH, actionData, "Actions vs Optimal");

  y += chartH + 10;

  // Chart 3: Errors & Hesitations
  const issuesData = taskResults.map((tr) => ({
    label: tr.template_tasks.name,
    values: [
      { value: tr.error_count, color: C.danger, name: "Errors" },
      { value: tr.hesitation_count, color: C.warning, name: "Hesitations" },
    ],
  }));
  drawBarChart(doc, margin, y, halfW, chartH, issuesData, "Errors & Hesitations per Task");

  // Chart 4: SEQ Ratings
  const seqData = taskResults
    .filter((tr) => tr.seq_rating != null)
    .map((tr) => ({
      label: tr.template_tasks.name,
      values: [
        { value: tr.seq_rating!, color: C.warning, name: "SEQ (1-7)" },
      ],
    }));
  if (seqData.length > 0) {
    drawBarChart(doc, margin + halfW + 6, y, halfW, chartH, seqData, "SEQ Ratings per Task");
  }

  y += chartH + 10;

  // Chart 5: Completion status pie
  const statusCounts: Record<string, number> = {};
  for (const tr of taskResults) {
    const s = tr.completion_status || "pending";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }
  const statusMap: Record<string, RGB> = {
    success: C.success, partial: C.secondary, failure: C.danger, skipped: C.muted, pending: [100, 116, 139],
  };
  const pieData = Object.entries(statusCounts).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: statusMap[label] ?? C.muted,
  }));

  y = ensureSpace(doc, y, 80);
  drawPieChart(doc, margin + halfW / 2, y + 45, 25, pieData, "Task Completion Status");
}

// ── Overall summary charts ──────────────────────────────────────

function renderOverallCharts(
  doc: jsPDF,
  template: TemplateWithRelations,
  sessions: TestSessionWithRelations[],
  margin: number,
  pageWidth: number,
) {
  doc.addPage();
  let y = 15;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Analysis", pageWidth / 2, y, { align: "center" });
  y += 4;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Aggregated data from ${sessions.length} completed session${sessions.length > 1 ? "s" : ""}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 8;

  const halfW = (pageWidth - margin * 2 - 6) / 2;
  const chartH = 70;

  // Aggregate task data
  const taskMap = new Map<string, { name: string; times: number[]; actions: number[]; errors: number[]; hesitations: number[]; seqs: number[]; statuses: string[] }>();
  for (const session of sessions) {
    for (const tr of session.task_results) {
      const key = tr.task_id;
      if (!taskMap.has(key)) {
        taskMap.set(key, { name: tr.template_tasks.name, times: [], actions: [], errors: [], hesitations: [], seqs: [], statuses: [] });
      }
      const entry = taskMap.get(key)!;
      if (tr.time_seconds != null) entry.times.push(Number(tr.time_seconds));
      if (tr.action_count != null) entry.actions.push(tr.action_count);
      entry.errors.push(tr.error_count);
      entry.hesitations.push(tr.hesitation_count);
      if (tr.seq_rating != null) entry.seqs.push(tr.seq_rating);
      if (tr.completion_status) entry.statuses.push(tr.completion_status);
    }
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const taskEntries = [...taskMap.values()];

  // Chart 1: Average Time per Task
  const avgTimeData = taskEntries.map((t) => ({
    label: t.name,
    values: [
      { value: avg(t.times), color: C.primary, name: "Avg Time (s)" },
    ],
  }));
  drawBarChart(doc, margin, y, halfW, chartH, avgTimeData, "Average Time per Task (s)");

  // Chart 2: Average Errors per Task
  const avgErrorData = taskEntries.map((t) => ({
    label: t.name,
    values: [
      { value: avg(t.errors), color: C.danger, name: "Avg Errors" },
      { value: avg(t.hesitations), color: C.warning, name: "Avg Hesitations" },
    ],
  }));
  drawBarChart(doc, margin + halfW + 6, y, halfW, chartH, avgErrorData, "Avg Errors & Hesitations per Task");

  y += chartH + 10;

  // Chart 3: Average SEQ per Task
  const avgSeqData = taskEntries
    .filter((t) => t.seqs.length > 0)
    .map((t) => ({
      label: t.name,
      values: [{ value: avg(t.seqs), color: C.warning, name: "Avg SEQ" }],
    }));
  if (avgSeqData.length > 0) {
    drawBarChart(doc, margin, y, halfW, chartH, avgSeqData, "Average SEQ Rating per Task");
  }

  // Chart 4: Overall completion status
  const allStatuses: Record<string, number> = {};
  for (const t of taskEntries) {
    for (const s of t.statuses) {
      allStatuses[s] = (allStatuses[s] || 0) + 1;
    }
  }
  const statusColorMap: Record<string, RGB> = {
    success: C.success, partial: C.secondary, failure: C.danger, skipped: C.muted,
  };
  const overallPie = Object.entries(allStatuses).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
    color: statusColorMap[label] ?? C.muted,
  }));
  drawPieChart(doc, margin + halfW + 6 + halfW / 2, y + 40, 22, overallPie, "Overall Task Completion");

  y += chartH + 10;

  // SUS Summary table
  const susScores = sessions
    .filter((s) => s.sus_answers && s.sus_answers.length > 0)
    .map((s) => ({
      name: s.participants.name,
      score: calculateSusScore(s.sus_answers),
    }))
    .filter((s) => s.score != null) as { name: string; score: number }[];

  if (susScores.length > 0) {
    y = ensureSpace(doc, y, 50);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SUS Score Summary", margin, y);
    y += 2;

    const avgSus = avg(susScores.map((s) => s.score));

    autoTable(doc, {
      startY: y,
      head: [["Participant", "SUS Score", "Rating"]],
      body: [
        ...susScores.map((s) => [s.name, s.score.toFixed(1), getSusLabel(s.score)]),
        ["Average", avgSus.toFixed(1), getSusLabel(avgSus)],
      ],
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [60, 60, 60] },
      columnStyles: { 0: { cellWidth: 50 } },
      didParseCell: (data: any) => {
        if (data.row.index === susScores.length && data.section === "body") {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // SUS horizontal bar chart
    y = ensureSpace(doc, y, 50);
    const susBarData = susScores.map((s) => ({
      label: s.name,
      value: s.score,
      color: s.score >= 68 ? C.success : s.score >= 50 ? C.warning : C.danger,
    }));
    susBarData.push({ label: "Average", value: avgSus, color: C.primary });
    drawHorizontalBarChart(doc, margin, y, pageWidth - margin * 2, 8 + susBarData.length * 10, susBarData, "SUS Scores Comparison");
  }
}
