// Participant-client localization (P2.6). Deliberately not an i18n
// framework: two dictionaries and a context at this string count.
// Evaluator-facing UI stays English; only participant surfaces (join
// flow, live view, questionnaires) consume this. Resolution order:
// ?lang= URL param, then localStorage, then browser language.
//
// PT SUS items follow the European Portuguese validation of
// Martins et al. (2015); UEQ-S pairs follow the official Portuguese
// version from ueq-online.org.

/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { InstrumentDef } from "@/lib/instruments";

export type Lang = "en" | "pt";

const en = {
  common: {
    loading: "Loading...",
    submitting: "Submitting...",
    submit: "Submit",
    continue: "Continue",
  },
  join: {
    title: "Join Usability Test",
    usabilityTest: "Usability Test",
    evaluator: "Evaluator",
    tasksToComplete: "{n} task(s) to complete:",
    yourInfo: "Your Information",
    additionalInfo: "Additional Information",
    name: "Name *",
    namePlaceholder: "Your name",
    email: "Email",
    emailInvalid: "Please enter a valid email",
    age: "Age",
    gender: "Gender",
    selectGender: "Select gender",
    male: "Male",
    female: "Female",
    other: "Other",
    occupation: "Occupation",
    techProficiency: "Tech Proficiency",
    selectLevel: "Select level",
    low: "Low",
    medium: "Medium",
    high: "High",
    notes: "Notes",
    selectOption: "Select an option",
    join: "Join Session",
    joining: "Joining...",
    invalidLink: "Invalid or expired link",
    invalidLinkHint:
      "This link is no longer active. Please contact the evaluator for a new one.",
    joinFailed: "Failed to join session. Please try again.",
  },
  live: {
    loadingSession: "Loading session...",
    sessionComplete: "Session Complete",
    thankYouClose: "Thank you for participating! You can close this page.",
    waitingEvaluator: "Waiting for Evaluator",
    waitingEvaluatorHint:
      "The evaluator hasn't started the session yet. This page will update automatically when they begin.",
    tasksScheduled: "{n} task(s) scheduled",
    thankYou: "Thank You!",
    allDoneHint:
      "You have completed all tasks and the questionnaires. You can close this page.",
    taskOf: "Task {i} of {n}",
    done: "{done}/{total} done",
    tasksDone: "{done}/{total} tasks done",
    workThrough:
      "Work through this task. Questions will appear here once the evaluator marks it complete.",
    waitingNextTask: "Waiting for Next Task",
    waitingNextTaskHint:
      "The evaluator is working on the session. Questions will appear here as tasks are completed.",
    tasksCompleted: "Tasks completed",
    answered: "Answered",
    questions: "Questions",
    yourAnswer: "Your answer...",
    submitAnswers: "Submit Answers",
    interviewTitle: "Interview Questions",
    interviewHint:
      "Please answer the following questions about your experience.",
    ratingOf: "Rating {i} of {max}",
  },
  sus: {
    title: "System Usability Scale (SUS)",
    hint: "Please rate your agreement with each statement on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree).",
    submitSus: "Submit SUS Questionnaire",
    answerAll: "Answer all questions ({n}/10)",
    questions: [
      "I think that I would like to use this system frequently.",
      "I found the system unnecessarily complex.",
      "I thought the system was easy to use.",
      "I think that I would need the support of a technical person to be able to use this system.",
      "I found the various functions in this system were well integrated.",
      "I thought there was too much inconsistency in this system.",
      "I would imagine that most people would learn to use this system very quickly.",
      "I found the system very cumbersome to use.",
      "I felt very confident using the system.",
      "I needed to learn a lot of things before I could get going with this system.",
    ],
    scaleLow: "Strongly Disagree",
    scaleHigh: "Strongly Agree",
  },
  instruments: {
    slideToAnswer: "slide to answer",
    tlxDescription:
      "Rate the workload you experienced during the tasks on each dimension.",
    tlxPrompts: [
      "Mental demand — How mentally demanding were the tasks?",
      "Physical demand — How physically demanding were the tasks?",
      "Temporal demand — How hurried or rushed was the pace?",
      "Performance — How successful were you in accomplishing what you were asked to do?",
      "Effort — How hard did you have to work to accomplish your level of performance?",
      "Frustration — How insecure, discouraged, irritated, stressed or annoyed were you?",
    ],
    veryLow: "Very low",
    veryHigh: "Very high",
    perfect: "Perfect",
    failure: "Failure",
    ueqDescription:
      "Rate your impression of the system between the two opposing terms.",
    ueqPairs: [
      ["obstructive", "supportive"],
      ["complicated", "easy"],
      ["inefficient", "efficient"],
      ["confusing", "clear"],
      ["boring", "exciting"],
      ["not interesting", "interesting"],
      ["conventional", "inventive"],
      ["usual", "leading edge"],
    ],
  },
};

export type Dict = typeof en;

const pt: Dict = {
  common: {
    loading: "A carregar...",
    submitting: "A submeter...",
    submit: "Submeter",
    continue: "Continuar",
  },
  join: {
    title: "Participar no Teste de Usabilidade",
    usabilityTest: "Teste de Usabilidade",
    evaluator: "Avaliador",
    tasksToComplete: "{n} tarefa(s) a realizar:",
    yourInfo: "Os seus dados",
    additionalInfo: "Informações adicionais",
    name: "Nome *",
    namePlaceholder: "O seu nome",
    email: "Email",
    emailInvalid: "Introduza um email válido",
    age: "Idade",
    gender: "Género",
    selectGender: "Selecione o género",
    male: "Masculino",
    female: "Feminino",
    other: "Outro",
    occupation: "Profissão",
    techProficiency: "Competência tecnológica",
    selectLevel: "Selecione o nível",
    low: "Baixa",
    medium: "Média",
    high: "Alta",
    notes: "Notas",
    selectOption: "Selecione uma opção",
    join: "Entrar na sessão",
    joining: "A entrar...",
    invalidLink: "Ligação inválida ou expirada",
    invalidLinkHint:
      "Esta ligação já não está ativa. Contacte o avaliador para obter uma nova.",
    joinFailed: "Não foi possível entrar na sessão. Tente novamente.",
  },
  live: {
    loadingSession: "A carregar a sessão...",
    sessionComplete: "Sessão concluída",
    thankYouClose: "Obrigado pela sua participação! Pode fechar esta página.",
    waitingEvaluator: "À espera do avaliador",
    waitingEvaluatorHint:
      "O avaliador ainda não iniciou a sessão. Esta página atualiza automaticamente quando começar.",
    tasksScheduled: "{n} tarefa(s) agendada(s)",
    thankYou: "Obrigado!",
    allDoneHint:
      "Concluiu todas as tarefas e os questionários. Pode fechar esta página.",
    taskOf: "Tarefa {i} de {n}",
    done: "{done}/{total} concluídas",
    tasksDone: "{done}/{total} tarefas concluídas",
    workThrough:
      "Realize esta tarefa. As perguntas aparecerão aqui quando o avaliador a marcar como concluída.",
    waitingNextTask: "À espera da próxima tarefa",
    waitingNextTaskHint:
      "O avaliador está a conduzir a sessão. As perguntas aparecerão aqui à medida que as tarefas forem concluídas.",
    tasksCompleted: "Tarefas concluídas",
    answered: "Respondidas",
    questions: "Perguntas",
    yourAnswer: "A sua resposta...",
    submitAnswers: "Submeter respostas",
    interviewTitle: "Perguntas de entrevista",
    interviewHint:
      "Responda às seguintes perguntas sobre a sua experiência.",
    ratingOf: "Classificação {i} de {max}",
  },
  sus: {
    title: "Escala de Usabilidade do Sistema (SUS)",
    hint: "Indique o seu grau de concordância com cada afirmação, de 1 (Discordo totalmente) a 5 (Concordo totalmente).",
    submitSus: "Submeter questionário SUS",
    answerAll: "Responda a todas as perguntas ({n}/10)",
    // European Portuguese SUS, Martins et al. (2015)
    questions: [
      "Acho que gostaria de utilizar este sistema com frequência.",
      "Considerei o sistema mais complexo do que o necessário.",
      "Achei o sistema fácil de utilizar.",
      "Acho que necessitaria da ajuda de um técnico para conseguir utilizar este sistema.",
      "Considerei que as várias funcionalidades deste sistema estavam bem integradas.",
      "Achei que este sistema tinha muitas inconsistências.",
      "Suponho que a maioria das pessoas aprenderia a utilizar rapidamente este sistema.",
      "Considerei o sistema muito complicado de utilizar.",
      "Senti-me muito confiante a utilizar este sistema.",
      "Tive de aprender muito antes de conseguir utilizar este sistema.",
    ],
    scaleLow: "Discordo totalmente",
    scaleHigh: "Concordo totalmente",
  },
  instruments: {
    slideToAnswer: "deslize para responder",
    tlxDescription:
      "Classifique a carga de trabalho que sentiu durante as tarefas em cada dimensão.",
    tlxPrompts: [
      "Exigência mental — Quão mentalmente exigentes foram as tarefas?",
      "Exigência física — Quão fisicamente exigentes foram as tarefas?",
      "Exigência temporal — Quão apressado ou acelerado foi o ritmo das tarefas?",
      "Desempenho — Quão bem-sucedido foi a realizar o que lhe foi pedido?",
      "Esforço — Quanto teve de se esforçar para alcançar o seu nível de desempenho?",
      "Frustração — Quão inseguro, desencorajado, irritado ou stressado se sentiu?",
    ],
    veryLow: "Muito baixa",
    veryHigh: "Muito alta",
    perfect: "Perfeito",
    failure: "Fracasso",
    ueqDescription:
      "Classifique a sua impressão do sistema entre os dois termos opostos.",
    ueqPairs: [
      ["obstrutivo", "impulsionador"],
      ["complicado", "fácil"],
      ["ineficiente", "eficiente"],
      ["confuso", "claro"],
      ["aborrecido", "empolgante"],
      ["desinteressante", "interessante"],
      ["convencional", "inovador"],
      ["comum", "vanguardista"],
    ],
  },
};

export const DICTIONARIES: Record<Lang, Dict> = { en, pt };

export function detectLang(): Lang {
  const param = new URLSearchParams(window.location.search).get("lang");
  if (param === "pt" || param === "en") return param;
  const stored = localStorage.getItem("avalux-lang");
  if (stored === "pt" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("pt") ? "pt" : "en";
}

/** "{n} task(s)" -> params {n: 3}; "(s)" plural marker resolved by n/total */
export function format(
  template: string,
  params: Record<string, number | string> = {},
): string {
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  const plural = Number(params.n ?? params.total ?? NaN);
  if (!Number.isNaN(plural)) {
    out = out.replace(/\((\w+)\)/g, plural === 1 ? "" : "$1");
  }
  return out;
}

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  dict: Dict;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  dict: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang());

  const setLang = (next: Lang) => {
    localStorage.setItem("avalux-lang", next);
    setLangState(next);
  };

  // WCAG 3.1.1: the document language must match the rendered language
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(
    () => ({ lang, setLang, dict: DICTIONARIES[lang] }),
    [lang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}

/** Localized copy of an instrument definition (EN defs stay canonical). */
export function localizeInstrument(def: InstrumentDef, dict: Dict): InstrumentDef {
  const i = dict.instruments;
  if (def.key === "nasa_tlx") {
    return {
      ...def,
      description: i.tlxDescription,
      items: def.items.map((item, idx) => ({
        ...item,
        prompt: i.tlxPrompts[idx] ?? item.prompt,
        lowAnchor: item.number === 4 ? i.perfect : i.veryLow,
        highAnchor: item.number === 4 ? i.failure : i.veryHigh,
      })),
    };
  }
  if (def.key === "ueq_s") {
    return {
      ...def,
      description: i.ueqDescription,
      items: def.items.map((item, idx) => ({
        ...item,
        lowAnchor: i.ueqPairs[idx]?.[0] ?? item.lowAnchor,
        highAnchor: i.ueqPairs[idx]?.[1] ?? item.highAnchor,
      })),
    };
  }
  return def;
}
