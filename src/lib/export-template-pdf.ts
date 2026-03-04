import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { TemplateWithRelations } from "@/types";
import { SUS_QUESTIONS } from "@/lib/sus";

export function exportTemplatePdf(template: TemplateWithRelations) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 15;

  // --- Header ---
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(template.name, pageWidth / 2, y, { align: "center" });
  y += 7;

  if (template.description) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(template.description, pageWidth - margin * 2);
    doc.text(lines, pageWidth / 2, y, { align: "center" });
    y += lines.length * 4 + 4;
  }

  // --- Participant Info ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Participant Information", margin, y);
  y += 2;

  const infoFields = [
    ["Participant:", ""],
    ["Date:", ""],
    ["Evaluator:", ""],
    ["Age:", ""],
    ["Gender:", ""],
    ["Tech Familiarity:", ""],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: infoFields,
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 35 },
      1: { cellWidth: pageWidth - margin * 2 - 35 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // --- Recording Legend ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Recording Legend", margin, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Code", "Meaning"]],
    body: [
      ["S", "Success — task completed correctly"],
      ["P", "Partial — task completed with issues"],
      ["F", "Failure — task not completed"],
    ],
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 20 } },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "SEQ (Single Ease Question): After each task, ask \"How easy was this task?\" on a scale of 1 (very difficult) to 7 (very easy).",
    margin,
    y + 3,
  );
  y += 8;

  // --- Task Tables ---
  const simpleTasks = template.template_tasks.filter((t) => t.complexity === "simple");
  const complexTasks = template.template_tasks.filter((t) => t.complexity === "complex");

  const taskColumns = ["#", "Task", "Comp.", "Time", "Actions", "Optimal", "Errors", "Hesit.", "SEQ"];

  function renderTaskTable(title: string, tasks: typeof simpleTasks) {
    if (tasks.length === 0) return;

    // Check if we need a new page
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin, y);
    y += 2;

    const body = tasks.map((t, i) => [
      `${i + 1}`,
      t.name,
      "", // Completion
      "", // Time
      "", // Actions
      t.optimal_actions != null ? String(t.optimal_actions) : "—",
      "", // Errors
      "", // Hesitations
      "", // SEQ
    ]);

    autoTable(doc, {
      startY: y,
      head: [taskColumns],
      body,
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2, minCellHeight: 8 },
      headStyles: { fillColor: [60, 60, 60] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 50 },
        2: { cellWidth: 14 },
        3: { cellWidth: 16 },
        4: { cellWidth: 18 },
        5: { cellWidth: 18 },
        6: { cellWidth: 16 },
        7: { cellWidth: 14 },
        8: { cellWidth: 12 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  renderTaskTable("Simple Tasks", simpleTasks);
  renderTaskTable("Complex Tasks", complexTasks);

  // --- Error Types Legend ---
  if (template.template_error_types.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Error Types", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Code", "Description"]],
      body: template.template_error_types.map((e) => [e.code, e.label]),
      theme: "grid",
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [60, 60, 60] },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 20 } },
    });
    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // --- Error Detail Log ---
  if (y > doc.internal.pageSize.getHeight() - 50) {
    doc.addPage();
    y = 15;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Error Detail Log", margin, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Task #", "Error Code", "Time (s)", "Description"]],
    body: Array.from({ length: 10 }, () => ["", "", "", ""]),
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2, minCellHeight: 7 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 24 },
      2: { cellWidth: 20 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // --- Hesitation & Think-Aloud Notes ---
  if (y > doc.internal.pageSize.getHeight() - 50) {
    doc.addPage();
    y = 15;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Hesitation & Think-Aloud Notes", margin, y);
  y += 2;

  autoTable(doc, {
    startY: y,
    head: [["Task #", "Time (s)", "Observation / Participant Quote"]],
    body: Array.from({ length: 10 }, () => ["", "", ""]),
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 2, minCellHeight: 7 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 20 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // --- SUS Questionnaire ---
  if (y > doc.internal.pageSize.getHeight() - 50) {
    doc.addPage();
    y = 15;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("System Usability Scale (SUS)", margin, y);
  y += 2;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text(
    "Rate each statement from 1 (Strongly Disagree) to 5 (Strongly Agree).",
    margin,
    y + 3,
  );
  y += 7;

  autoTable(doc, {
    startY: y,
    head: [["#", "Statement", "1", "2", "3", "4", "5"]],
    body: SUS_QUESTIONS.map((q, i) => [
      String(i + 1),
      q,
      "",
      "",
      "",
      "",
      "",
    ]),
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 7, cellPadding: 2, minCellHeight: 7 },
    headStyles: { fillColor: [60, 60, 60] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 100 },
      2: { cellWidth: 10, halign: "center" },
      3: { cellWidth: 10, halign: "center" },
      4: { cellWidth: 10, halign: "center" },
      5: { cellWidth: 10, halign: "center" },
      6: { cellWidth: 10, halign: "center" },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // --- Interview Questions ---
  if (template.template_questions.length > 0) {
    if (y > doc.internal.pageSize.getHeight() - 40) {
      doc.addPage();
      y = 15;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Post-Test Interview Questions", margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    for (const q of template.template_questions) {
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 15;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`Q${q.sort_order + 1}: ${q.question_text}`, margin, y);
      y += 5;

      // Draw blank answer lines
      doc.setDrawColor(200, 200, 200);
      for (let line = 0; line < 3; line++) {
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      }
      y += 3;
    }
  }

  // Save
  const safeName = template.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  doc.save(`${safeName}_observation_sheet.pdf`);
}
