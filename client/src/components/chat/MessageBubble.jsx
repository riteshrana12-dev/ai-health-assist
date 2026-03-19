import { motion } from "framer-motion";
import { AlertTriangle, Bot, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import { formatTime } from "../../utils/formatters";

// ── Simple markdown renderer ──────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading ##
    if (line.startsWith("## ")) {
      elements.push(
        <p key={key++} className="font-semibold text-white text-sm mt-3 mb-1">
          {line.slice(3)}
        </p>,
      );
      continue;
    }

    // Bullet point
    if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span className="text-brand-400 mt-1.5 flex-shrink-0 text-[8px]">
            ●
          </span>
          <span className="text-sm leading-relaxed">
            {renderInline(line.slice(2))}
          </span>
        </div>,
      );
      continue;
    }

    // Divider ---
    if (line.trim() === "---") {
      elements.push(<hr key={key++} className="border-white/10 my-2" />);
      continue;
    }

    // Empty line → small gap
    if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={key++} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  }

  return elements;
};

// Inline bold (**text**) and code (`text`)
const renderInline = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-white/8 text-brand-300 text-xs font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// ─────────────────────────────────────────────────────────────
const MessageBubble = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isEmergency = message.isEmergency;
  const isError = message.isError;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} group`}
    >
      {/* Avatar */}
      <div
        className={`
        w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
        ${
          isUser
            ? "bg-gradient-to-br from-brand-500 to-purple-600"
            : isEmergency
              ? "bg-red-500/20 border border-red-500/30"
              : "bg-gradient-to-br from-health-500/20 to-brand-500/20 border border-white/10"
        }
      `}
      >
        {isUser ? (
          <User size={14} className="text-white" />
        ) : isEmergency ? (
          <AlertTriangle size={14} className="text-red-400" />
        ) : (
          <Bot size={14} className="text-health-400" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] lg:max-w-[70%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        {/* Emergency banner */}
        {isEmergency && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-medium mb-1 w-full">
            <AlertTriangle size={12} />
            Emergency alert — seek immediate medical attention
          </div>
        )}

        <div
          className={`
          relative px-4 py-3 rounded-2xl text-sm
          ${
            isUser
              ? "bg-brand-600 text-white rounded-br-sm"
              : isEmergency
                ? "bg-red-500/10 border border-red-500/20 text-gray-200 rounded-bl-sm"
                : isError
                  ? "bg-orange-500/10 border border-orange-500/20 text-gray-300 rounded-bl-sm"
                  : "bg-dark-100 border border-white/8 text-gray-200 rounded-bl-sm"
          }
        `}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
          )}
        </div>

        {/* Timestamp + copy */}
        <div
          className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <span className="text-[10px] text-gray-600">
            {formatTime(message.timestamp)}
          </span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-gray-600 hover:text-gray-400"
              title="Copy message"
            >
              {copied ? (
                <Check size={11} className="text-health-400" />
              ) : (
                <Copy size={11} />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
