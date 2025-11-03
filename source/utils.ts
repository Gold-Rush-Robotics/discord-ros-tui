import { writeSync } from "fs";
import { Key, useStdout } from "ink";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function exitError(exit: (error?: Error) => void, error: Error) {
  process.exitCode = 1;
  exit();
  setTimeout(() => {
    writeSync(2, `\n${error.message}\n`);
    process.exit(1);
  }, 50);
}

export function sidebarItemInputHandler(
  key: Key,
  hoverIndex: number,
  setHoverIndex: Dispatch<SetStateAction<number>>,
  onReturn: (selectedIndex: number) => void,
  items: any[]
) {
  if (key.upArrow) {
    setHoverIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      } else {
        return items ? items.length - 1 : 0;
      }
    });
  }
  if (key.downArrow) {
    setHoverIndex((prev) => {
      if (prev + 1 < (items?.length ?? 0)) {
        return prev + 1;
      } else {
        return 0;
      }
    });
  }
  if (key.return) {
    onReturn(hoverIndex);
  }
}

/**
 * Gets the character to be used to prefix a list of items (like a tree structure)
 * @param index The index of the item
 * @param items The total number of items
 * @returns The character to be used to prefix the item
 */
export function getListCharacter(index: number, items: number) {
  if (index === items - 1) {
    return "└─";
  }
  return "├─";
}

/**
 * Hook to get terminal dimensions for main content area
 * Returns: { height: available lines, width: available chars per line }
 */
export function useMainContentDimensions() {
  const { stdout } = useStdout();
  const [height, setHeight] = useState(Math.max(1, stdout.rows - 7));
  const [width, setWidth] = useState(Math.max(1, stdout.columns - 28));

  useEffect(() => {
    function updateDimensions() {
      setHeight(Math.max(1, stdout.rows - 7));
      setWidth(Math.max(1, stdout.columns - 28));
    }
    updateDimensions();
    stdout.on("resize", updateDimensions);
    return () => {
      stdout.off("resize", updateDimensions);
    };
  }, [stdout]);

  return { height, width };
}

/**
 * Calculate how many lines a message will take up based on its content
 * @param message The message object
 * @param lineWidth Available width per line (terminal width - 28)
 * @param prefixWidth Width of timestamp + author prefix (e.g., "[12:34:56] <user> ")
 */
export function calculateMessageLines(
  message: {
    content: string;
    embeds: any[] | { length: number };
    attachments: any[] | { size: number };
    author?: { username?: string };
  },
  lineWidth: number,
  prefixWidth: number = 25 // Default estimate for timestamp + author
): number {
  let lines = 1; // Base line for the message

  // Calculate prefix width more accurately if we have author info
  const actualPrefixWidth = message.author?.username
    ? 10 + message.author.username.length + 3 // "[HH:MM:SS] <username> "
    : prefixWidth;

  // Available width for content (first line has prefix, subsequent lines don't)
  const firstLineContentWidth = lineWidth - actualPrefixWidth;
  const subsequentLineWidth = lineWidth;

  // Content wrapping
  if (message.content) {
    // Count explicit newlines in content (each \n adds a line)
    const explicitNewlines = (message.content.match(/\n/g) || []).length;
    lines += explicitNewlines;

    // Calculate wrapping for the rest of the content
    // Remove newlines for width calculation
    const contentWithoutNewlines = message.content.replace(/\n/g, " ");
    const contentLength = contentWithoutNewlines.length;
    if (contentLength <= firstLineContentWidth) {
      // Fits on first line (if no explicit newlines, we already added 1 base line)
      // If there were explicit newlines, we already accounted for them
    } else {
      // Needs wrapping
      const remainingAfterFirstLine = contentLength - firstLineContentWidth;
      const additionalLines = Math.ceil(
        remainingAfterFirstLine / subsequentLineWidth
      );
      lines += additionalLines;
    }
  }

  // Embeds add 1 line each
  if (
    message.embeds &&
    Array.isArray(message.embeds) &&
    message.embeds.length > 0
  ) {
    lines += message.embeds.length;
  }

  // Attachments add 1 line each (can be Collection with .size or array with .length)
  const attachmentCount = Array.isArray(message.attachments)
    ? message.attachments.length
    : (message.attachments as any)?.size ?? 0;
  if (attachmentCount > 0) {
    lines += attachmentCount;
  }

  return lines;
}
