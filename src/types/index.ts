export type DocumentType = 'syllabus' | 'textbook' | 'notes' | 'past_papers';

export interface DocumentMeta {
  id: string;
  name: string;
  type: DocumentType;
  uploadedAt: string;
  fileSize: number;
  chunkCount: number;
  status: 'processing' | 'ready' | 'error';
  summary?: string;
  extractedTextLength?: number;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  docName: string;
  content: string;
  pageNumber?: number;
  sectionCitation: string;
  topicId?: string;
  similarity?: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  chapter: string;
  name: string;
  description: string;
  subtopics: string[];
  pastExamFrequency: number; // occurrences in past exam papers
  examWeight: 'High' | 'Medium' | 'Low';
  sourceCitation: string;
}

export interface Question {
  id: string;
  topicId: string;
  topicName: string;
  chapter: string;
  questionText: string;
  options: string[];
  correctAnswer: number; // index 0-3
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sourceDocument: string;
  sourceCitation: string;
  groundedContextSnippet: string;
}

export type TopicGapStatus = 'weak' | 'medium' | 'strong';

export interface TopicGapReport {
  topicId: string;
  topicName: string;
  chapter: string;
  accuracy: number;
  questionsAttempted: number;
  correctCount: number;
  incorrectCount: number;
  status: TopicGapStatus;
  examWeight: 'High' | 'Medium' | 'Low';
  diagnosisReason: string;
  recommendedAction: string;
  citationRef: string;
}

export interface StudentAnswerRecord {
  questionId: string;
  questionText: string;
  selectedAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  topicId: string;
  topicName: string;
  explanation: string;
  sourceCitation: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  attemptNumber: number;
  quizMode: 'quick_5' | 'standard_10' | 'deep_20' | 'topic_targeted';
  topicId?: string;
  score: number;
  totalQuestions: number;
  accuracy: number;
  startedAt: string;
  completedAt: string;
  answers: StudentAnswerRecord[];
}

export interface RevisionTask {
  id: string;
  dayNumber: number;
  topicId: string;
  topicName: string;
  chapter: string;
  status: TopicGapStatus;
  priority: 'High' | 'Medium' | 'Low';
  durationMinutes: number;
  learningObjective: string;
  sourceSections: string[];
  practiceItems: string[];
  completed: boolean;
}

export interface RevisionPlan {
  id: string;
  userId: string;
  createdAt: string;
  availableDays: number;
  hoursPerDay: number;
  targetExamDate: string;
  totalStudyHours: number;
  tasks: RevisionTask[];
}

export interface Citation {
  docName: string;
  section: string;
  page?: number;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  isGroundingSufficient: boolean;
  provider?: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  targetExam: string;
  targetGrade: string;
  examDate: string;
  isDemoUser: boolean;
}
