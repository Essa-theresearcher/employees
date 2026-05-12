export const CONTRIBUTION_LABELS: Record<string, string> = {
  FRONTEND_DEVELOPMENT: 'Frontend Development',
  BACKEND_DEVELOPMENT: 'Backend Development',
  UI_UX_DESIGN: 'UI/UX Design',
  DATA_RESEARCH: 'Data & Research',
  PRESENTATION_PITCHING: 'Presentation & Pitching',
  BUSINESS_STRATEGY: 'Business Strategy',
  CONTENT_SOCIAL_MEDIA: 'Content & Social Media',
  PROJECT_MANAGEMENT: 'Project Management',
  BEGINNER_LEARNING: 'Beginner / Learning',
  OPEN_TO_ANY_ROLE: 'Open to Any Role'
} as const;

/** Display order on the registration form */
export const CONTRIBUTION_OPTIONS = [
  { value: 'FRONTEND_DEVELOPMENT' as const, label: CONTRIBUTION_LABELS.FRONTEND_DEVELOPMENT },
  { value: 'BACKEND_DEVELOPMENT' as const, label: CONTRIBUTION_LABELS.BACKEND_DEVELOPMENT },
  { value: 'UI_UX_DESIGN' as const, label: CONTRIBUTION_LABELS.UI_UX_DESIGN },
  { value: 'DATA_RESEARCH' as const, label: CONTRIBUTION_LABELS.DATA_RESEARCH },
  { value: 'PRESENTATION_PITCHING' as const, label: CONTRIBUTION_LABELS.PRESENTATION_PITCHING },
  { value: 'BUSINESS_STRATEGY' as const, label: CONTRIBUTION_LABELS.BUSINESS_STRATEGY },
  { value: 'CONTENT_SOCIAL_MEDIA' as const, label: CONTRIBUTION_LABELS.CONTENT_SOCIAL_MEDIA },
  { value: 'PROJECT_MANAGEMENT' as const, label: CONTRIBUTION_LABELS.PROJECT_MANAGEMENT },
  { value: 'BEGINNER_LEARNING' as const, label: CONTRIBUTION_LABELS.BEGINNER_LEARNING },
  { value: 'OPEN_TO_ANY_ROLE' as const, label: CONTRIBUTION_LABELS.OPEN_TO_ANY_ROLE }
];

export const SKILL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced'
};

export const PAYMENT_LABELS: Record<string, string> = {
  MPESA: 'M-Pesa',
  CASH: 'Cash',
  BANK: 'Bank'
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected'
};
