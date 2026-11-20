import { ArrowRightIcon } from "lucide-react";

export function WidgetSuggestedQuestions({
  questions,
  onSelect,
}: {
  questions: string[];
  onSelect?: (question: string) => void;
}) {
  if (questions.length === 0) {
    return null;
  }

  return (
    <ul className="ml-8 divide-y divide-foreground/10 overflow-hidden rounded-xl bg-background ring-1 ring-foreground/10">
      {questions.map((question) => (
        <li key={question}>
          <button
            type="button"
            onClick={() => onSelect?.(question)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
          >
            <span className="min-w-0 flex-1">{question}</span>
            <ArrowRightIcon className="size-3.5 shrink-0 text-primary" />
          </button>
        </li>
      ))}
    </ul>
  );
}
