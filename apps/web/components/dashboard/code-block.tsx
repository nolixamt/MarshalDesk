"use client";

import { cn } from "cn";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { IconButton } from "./icon-button";

type TokenKind = "punctuation" | "tag" | "attribute" | "string" | "text";
type Token = { kind: TokenKind; value: string };

const tokenClassNames: Record<TokenKind, string> = {
  punctuation: "text-ink-foreground/45",
  tag: "text-white",
  attribute: "text-ink-foreground/80",
  string: "text-ink-muted",
  text: "text-ink-foreground",
};

// A tiny HTML tokenizer: enough for the install snippet, tracking whether a tag spans lines.
function tokenizeHtml(code: string): Token[][] {
  const lines: Token[][] = [];
  let inTag = false;

  for (const line of code.split("\n")) {
    const tokens: Token[] = [];
    let rest = line;

    while (rest.length > 0) {
      const whitespace = /^\s+/.exec(rest);
      if (whitespace) {
        tokens.push({ kind: "text", value: whitespace[0] });
        rest = rest.slice(whitespace[0].length);
        continue;
      }

      if (!inTag) {
        const open = /^(<\/?)([a-zA-Z][\w-]*)/.exec(rest);
        if (open?.[1] && open[2]) {
          tokens.push({ kind: "punctuation", value: open[1] });
          tokens.push({ kind: "tag", value: open[2] });
          rest = rest.slice(open[0].length);
          inTag = true;
          continue;
        }
        const text = /^[^<]+/.exec(rest)?.[0] ?? rest.slice(0, 1);
        tokens.push({ kind: "text", value: text });
        rest = rest.slice(text.length);
        continue;
      }

      const close = /^\/?>/.exec(rest);
      if (close) {
        tokens.push({ kind: "punctuation", value: close[0] });
        rest = rest.slice(close[0].length);
        inTag = false;
        continue;
      }
      const string = /^("[^"]*"|'[^']*')/.exec(rest);
      if (string) {
        tokens.push({ kind: "string", value: string[0] });
        rest = rest.slice(string[0].length);
        continue;
      }
      if (rest.startsWith("=")) {
        tokens.push({ kind: "punctuation", value: "=" });
        rest = rest.slice(1);
        continue;
      }
      const attribute = /^[^\s=>/"']+/.exec(rest)?.[0] ?? rest.slice(0, 1);
      tokens.push({ kind: "attribute", value: attribute });
      rest = rest.slice(attribute.length);
    }

    lines.push(tokens);
  }

  return lines;
}

export function CodeBlock({
  code,
  label = "Copy code",
  className,
}: {
  code: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = tokenizeHtml(code);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl bg-ink text-ink-foreground ring-1 ring-foreground/10",
        className,
      )}
    >
      <IconButton
        label={copied ? "Copied" : label}
        onClick={copy}
        side="left"
        className="absolute top-2 right-2 text-ink-foreground/70 hover:bg-white/10 hover:text-white dark:hover:bg-white/10"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </IconButton>
      <pre className="overflow-x-auto py-3 pr-12 font-mono text-[0.8125rem] leading-6">
        <code className="grid">
          {lines.map((tokens, index) => (
            <span key={index} className="flex">
              <span
                aria-hidden
                className="w-10 shrink-0 pr-4 text-right text-ink-foreground/35 select-none"
              >
                {index + 1}
              </span>
              <span className="whitespace-pre">
                {tokens.map((token, tokenIndex) => (
                  <span
                    key={tokenIndex}
                    className={tokenClassNames[token.kind]}
                  >
                    {token.value}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
