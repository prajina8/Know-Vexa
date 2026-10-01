import { Difficulty, QuestionType, SummaryLength } from '../../types';

export const SYSTEM_PROMPTS = {
  tutor:
    'You are an expert, encouraging study tutor helping a student master their course material. ' +
    'Be precise, clear, and pedagogically sound. Prefer plain language over jargon unless the ' +
    'material itself is technical, in which case explain the jargon.',
  summarizer:
    'You are an expert academic summarizer. You produce accurate, well-structured study summaries ' +
    'that highlight what a student actually needs to know for exams and understanding — never ' +
    'inventing facts not supported by the source text.',
  quizMaker:
    'You are an expert exam question writer. You produce fair, unambiguous questions that test real ' +
    'understanding of the given material, with exactly one defensible correct answer per question.',
  chatAssistant:
    'You are a study assistant answering questions about a specific uploaded document. You MUST ' +
    'prioritize the provided document context. If the context does not contain the answer, say so ' +
    'clearly instead of guessing or relying on general knowledge as if it were from the document.',
  analyst:
    'You are a data-driven academic performance analyst. You give specific, actionable, encouraging ' +
    'feedback grounded strictly in the performance data provided — never inventing numbers.',
};

export function summaryPrompt(text: string, length: SummaryLength) {
  const targetLength =
    length === 'short'
      ? '3-5 sentence summary plus 3-5 key points'
      : length === 'medium'
        ? '2-3 paragraph summary plus 5-8 key points'
        : 'comprehensive multi-section summary covering all major topics in depth';

  return {
    system: SYSTEM_PROMPTS.summarizer,
    prompt: `Summarize the following study material. Target: ${targetLength}.

Return JSON with this exact shape:
{
  "summary": string (markdown, use headings/bullets for detailed length),
  "keyConcepts": string[],
  "definitions": [{ "term": string, "definition": string }],
  "importantPoints": string[],
  "formulas": string[] (empty array if none apply),
  "examples": string[] (empty array if none apply)
}

MATERIAL:
"""
${text.slice(0, 60000)}
"""`,
  };
}

export function chatPrompt(question: string, context: string, history: string) {
  return {
    system: SYSTEM_PROMPTS.chatAssistant,
    prompt: `DOCUMENT CONTEXT (most relevant excerpts from the student's material):
"""
${context || '(no relevant context was found in the document for this question)'}
"""

CONVERSATION SO FAR:
${history || '(no prior messages)'}

STUDENT QUESTION: ${question}

Answer using the document context above as your primary source. If the context doesn't contain
the answer, explicitly tell the student that the material doesn't cover it, then you may
optionally add a clearly-labeled "General knowledge note:" with a brief general answer.
Use markdown formatting (headings, bullet points, bold) where it improves clarity, and use
code/formula blocks for any formulas or equations.`,
  };
}

export function quizGenPrompt(params: {
  text: string;
  topic?: string;
  numQuestions: number;
  difficulty: Difficulty | 'mixed';
  questionTypes: QuestionType[];
}) {
  const { text, topic, numQuestions, difficulty, questionTypes } = params;
  return {
    system: SYSTEM_PROMPTS.quizMaker,
    prompt: `Generate exactly ${numQuestions} quiz questions from the material below.
${topic ? `Focus specifically on the topic: "${topic}".` : 'Cover the range of topics present in the material.'}
Difficulty: ${difficulty}${difficulty === 'mixed' ? ' (vary across easy/medium/hard)' : ''}.
Allowed question types: ${questionTypes.join(', ')}.

Return JSON with this exact shape:
{
  "questions": [
    {
      "question": string,
      "type": "mcq" | "true_false" | "short_answer",
      "options": string[] (4 options for mcq, ["True","False"] for true_false, omit/empty for short_answer),
      "correctAnswer": string (must exactly match one of "options" for mcq/true_false),
      "explanation": string (why this is correct, referencing the material),
      "difficulty": "easy" | "medium" | "hard",
      "topic": string (specific sub-topic this question covers)
    }
  ]
}

MATERIAL:
"""
${text.slice(0, 60000)}
"""`,
  };
}

export function flashcardGenPrompt(params: { text: string; topic?: string; numCards: number }) {
  const { text, topic, numCards } = params;
  return {
    system: SYSTEM_PROMPTS.quizMaker,
    prompt: `Generate exactly ${numCards} flashcards from the material below.
${topic ? `Focus specifically on the topic: "${topic}".` : 'Cover the range of topics present in the material.'}
Each flashcard should test one atomic fact, term, or concept — question on the front, concise
answer/explanation on the back.

Return JSON with this exact shape:
{
  "flashcards": [
    { "question": string, "answer": string, "topic": string, "difficulty": "easy"|"medium"|"hard" }
  ]
}

MATERIAL:
"""
${text.slice(0, 60000)}
"""`,
  };
}

export function studyPlanPrompt(params: {
  range: 'daily' | 'weekly';
  weakTopics: { subject: string; topic: string; percentage: number }[];
  strongTopics: { subject: string; topic: string; percentage: number }[];
  recentQuizSummaries: string[];
  dailyGoalMinutes: number;
}) {
  const { range, weakTopics, strongTopics, recentQuizSummaries, dailyGoalMinutes } = params;
  return {
    system: SYSTEM_PROMPTS.analyst,
    prompt: `Build a ${range} study plan for a student with a daily goal of ${dailyGoalMinutes} minutes.

WEAK TOPICS (needs review, lower % = weaker):
${JSON.stringify(weakTopics, null, 2)}

STRONG TOPICS (for light reinforcement only):
${JSON.stringify(strongTopics, null, 2)}

RECENT QUIZ ACTIVITY:
${recentQuizSummaries.join('\n') || '(no recent quizzes)'}

Prioritize weak topics. Balance across subjects. Keep total time close to the daily goal
(x7 for weekly). Return JSON:
{
  "tasks": [
    {
      "subjectName": string (must match one of the subject names given above),
      "topic": string,
      "durationMinutes": number,
      "reason": string (one sentence, specific, grounded in the data above),
      "priority": number (1 highest - 5 lowest)
    }
  ]
}`,
  };
}

export function recommendationsPrompt(params: {
  weakTopics: { subject: string; topic: string; percentage: number }[];
  improvements: { subject: string; topic: string; deltaPercent: number }[];
  strugglingStreaks: { subject: string; topic: string; consecutiveLowScores: number }[];
}) {
  return {
    system: SYSTEM_PROMPTS.analyst,
    prompt: `Given this student performance data, write 3-6 short, specific, encouraging recommendation
messages, similar in style to:
"You should review Normalization before taking another DBMS quiz."
"Your performance in Computer Networks has improved by 18%."
"You have struggled with Process Scheduling in your last 3 attempts."
"Try a medium-level quiz on Transactions."

DATA:
weakTopics: ${JSON.stringify(params.weakTopics)}
improvements: ${JSON.stringify(params.improvements)}
strugglingStreaks: ${JSON.stringify(params.strugglingStreaks)}

Return JSON: { "recommendations": string[] }
Every recommendation must be traceable to the data above — do not invent numbers or topics.`,
  };
}
