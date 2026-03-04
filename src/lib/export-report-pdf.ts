import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  TemplateWithRelations,
  TestSessionWithRelations,
} from "@/types";
import { SUS_QUESTIONS, calculateSusScore, getSusLabel } from "@/lib/sus";

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
  doc.text(
    `Generated: ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    y,
    { align: "center" },
  );
  y += 8;

  if (template.description) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(
      template.description,
      pageWidth - margin * 2,
    );
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
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40 },
      1: { cellWidth: 30 },
    },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // --- Per-session sections ---
  sessions.forEach((session, idx) => {
    // Page break between sessions
    if (idx > 0) {
      doc.addPage();
      y = 15;
    } else if (y > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      y = 15;
    }

    // Session header
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Session ${idx + 1}: ${session.participants.name}`, margin, y);
    y += 6;

    // Participant & session info
    const startedAt = session.started_at
      ? new Date(session.started_at).toLocaleString()
      : "—";
    const completedAt = session.completed_at
      ? new Date(session.completed_at).toLocaleString()
      : "—";

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
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 35 },
      },
    });
    y = (doc as any).lastAutoTable.finalY + 6;

    // Task results table
    const sortedResults = [...session.task_results].sort(
      (a, b) => a.template_tasks.sort_order - b.template_tasks.sort_order,
    );

    if (sortedResults.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Task Results", margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [
          [
            "Task",
            "Comp.",
            "Time (s)",
            "Actions",
            "Optimal",
            "Errors",
            "Hesit.",
            "SEQ",
          ],
        ],
        body: sortedResults.map((r) => [
          r.template_tasks.name,
          r.completion_status || "—",
          r.time_seconds != null ? String(r.time_seconds) : "—",
          r.action_count != null ? String(r.action_count) : "—",
          r.template_tasks.optimal_actions != null
            ? String(r.template_tasks.optimal_actions)
            : "—",
          String(r.error_count),
          String(r.hesitation_count),
          r.seq_rating != null ? String(r.seq_rating) : "—",
        ]),
        theme: "grid",
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [60, 60, 60] },
        columnStyles: {
          0: { cellWidth: 45 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
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
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 15;
      }

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
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 18 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Hesitation logs
    const allHesitations = sortedResults.flatMap((r) =>
      r.hesitation_logs.map((h) => ({
        task: r.template_tasks.name,
        time:
          h.timestamp_seconds != null ? String(h.timestamp_seconds) : "—",
        note: h.note || "—",
      })),
    );

    if (allHesitations.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 15;
      }

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
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 18 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Interview answers
    const answeredQuestions = session.interview_answers.filter(
      (a) => a.answer_text,
    );
    if (answeredQuestions.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Interview Answers", margin, y);
      y += 6;

      // Map question IDs to question text from the template
      const questionMap = new Map(
        template.template_questions.map((q) => [q.id, q.question_text]),
      );

      doc.setFontSize(9);
      for (const answer of answeredQuestions) {
        if (y > doc.internal.pageSize.getHeight() - 25) {
          doc.addPage();
          y = 15;
        }

        const qText = questionMap.get(answer.question_id) || "Unknown question";
        doc.setFont("helvetica", "bold");
        doc.text(`Q: ${qText}`, margin, y, {
          maxWidth: pageWidth - margin * 2,
        });
        const qLines = doc.splitTextToSize(
          `Q: ${qText}`,
          pageWidth - margin * 2,
        );
        y += qLines.length * 4 + 1;

        doc.setFont("helvetica", "normal");
        const aLines = doc.splitTextToSize(
          answer.answer_text!,
          pageWidth - margin * 2,
        );
        doc.text(aLines, margin, y);
        y += aLines.length * 4 + 5;
      }
    }

    // SUS Questionnaire
    if (session.sus_answers && session.sus_answers.length > 0) {
      if (y > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        y = 15;
      }

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

      const sortedSus = [...session.sus_answers].sort(
        (a, b) => a.question_number - b.question_number,
      );

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
        columnStyles: {
          0: { cellWidth: 8 },
          2: { cellWidth: 15 },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;
    }

    // Session notes
    if (session.notes) {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 15;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Session Notes", margin, y);
      y += 5;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const noteLines = doc.splitTextToSize(
        session.notes,
        pageWidth - margin * 2,
      );
      doc.text(noteLines, margin, y);
      y += noteLines.length * 4 + 4;
    }
  });

  const safeName = template.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  doc.save(`${safeName}_report.pdf`);
}
