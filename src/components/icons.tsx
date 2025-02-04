import {
  Play,
  Users,
  TrendingUp,
  Book,
  Upload,
  Trash,
  Check,
  Send,
  Loader2 as Spinner,
  ChevronUp,
  ChevronDown,
  Rocket,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
} from "lucide-react";

export type IconKey = keyof typeof Icons;
export type Icon = (typeof Icons)[IconKey];

export const Icons = {
  // App icons only
  play: Play,
  users: Users,
  trendingUp: TrendingUp,
  book: Book,
  upload: Upload,
  trash: Trash,
  check: Check,
  send: Send,
  spinner: Spinner,
  chevronUp: ChevronUp,
  chevronDown: ChevronDown,
  rocket: Rocket,
  thumbsUp: ThumbsUp,
  thumbsDown: ThumbsDown,
  alertTriangle: AlertTriangle,
} as const;
