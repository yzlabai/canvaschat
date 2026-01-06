import React, { ReactElement, MouseEvent, cloneElement, Children } from 'react';

// Type definitions
interface ClipboardOptions {
  debug?: boolean;
  message?: string;
  format?: string;
  onCopy?: (clipboardData: DataTransfer | null) => void;
}

interface CopyToClipboardProps {
  text: string;
  children: ReactElement<any>;
  onCopy?: (text: string, success: boolean) => void;
  options?: ClipboardOptions;
}

// Extend Window interface for IE11 support
declare global {
  interface Window {
    clipboardData?: {
      clearData(): void;
      setData(format: string, data: string): boolean;
    };
  }
}

// Constants
const clipboardToIE11Formatting: Record<string, string> = {
  "text/plain": "Text",
  "text/html": "Url",
  "default": "Text"
} as const;

const defaultMessage = "Copy to clipboard: #{key}, Enter";

// Missing deselectCurrent function - implementing it
function deselectCurrent(): (() => void) | null {
  const selection = document.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  
  const activeElement = document.activeElement as HTMLElement;
  const ranges: Range[] = [];
  
  for (let i = 0; i < selection.rangeCount; i++) {
    ranges.push(selection.getRangeAt(i));
  }
  
  selection.removeAllRanges();
  
  return () => {
    selection.removeAllRanges();
    ranges.forEach(range => selection.addRange(range));
    if (activeElement?.focus) {
      activeElement.focus();
    }
  };
}

// Utility functions
function formatMessage(message: string): string {
  const copyKey = (/mac os x/i.test(navigator.userAgent) ? "⌘" : "Ctrl") + "+C";
  return message.replace(/#{\s*key\s*}/g, copyKey);
}

async function copyToClipboard(text: string, options: ClipboardOptions = {}): Promise<boolean> {
  const { debug = false } = options;
  
  // Try modern Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      if (options.onCopy) {
        options.onCopy(null);
      }
      return true;
    } catch (err) {
      if (debug) {
        console.error("Modern clipboard API failed:", err);
      }
    }
  }
  
  // Fallback to legacy method
  return copyLegacy(text, options);
}

function copyLegacy(text: string, options: ClipboardOptions = {}): boolean {
  const { debug = false } = options;
  let success = false;
  let reselectPrevious: (() => void) | null = null;
  let range: Range | null = null;
  let selection: Selection | null = null;
  let mark: HTMLSpanElement | null = null;

  try {
    reselectPrevious = deselectCurrent();
    range = document.createRange();
    selection = document.getSelection();

    if (!selection) {
      throw new Error("Unable to get selection");
    }

    mark = document.createElement("span");
    mark.textContent = text;
    mark.ariaHidden = "true";
    
    // Reset user styles for span element
    Object.assign(mark.style, {
      all: "unset",
      position: "fixed",
      top: "0",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "pre",
      webkitUserSelect: "text",
      MozUserSelect: "text",
      msUserSelect: "text",
      userSelect: "text"
    });

    mark.addEventListener("copy", (e: ClipboardEvent) => {
      e.stopPropagation();
      
      if (options.format) {
        e.preventDefault();
        
        if (!e.clipboardData && window.clipboardData) {
          // IE 11 support
          if (debug) {
            console.warn("Using IE11 clipboard API");
          }
          window.clipboardData.clearData();
          const format = clipboardToIE11Formatting[options.format] || clipboardToIE11Formatting.default;
          window.clipboardData.setData(format, text);
        } else if (e.clipboardData) {
          // Modern browsers
          e.clipboardData.clearData();
          e.clipboardData.setData(options.format, text);
        }
      }
      
      if (options.onCopy) {
        e.preventDefault();
        options.onCopy(e.clipboardData);
      }
    });

    document.body.appendChild(mark);
    range.selectNodeContents(mark);
    selection.addRange(range);

    const successful = document.execCommand("copy");
    if (!successful) {
      throw new Error("Copy command was unsuccessful");
    }
    success = true;

  } catch (err) {
    if (debug) {
      console.error("Unable to copy using execCommand:", err);
      console.warn("Trying IE specific method");
    }
    
    try {
      if (window.clipboardData) {
        window.clipboardData.setData(options.format || "text", text);
        if (options.onCopy) {
          options.onCopy(null);
        }
        success = true;
      } else {
        throw new Error("No clipboard API available");
      }
    } catch (fallbackErr) {
      if (debug) {
        console.error("Unable to copy using clipboardData:", fallbackErr);
        console.error("Falling back to prompt");
      }
      
      const message = formatMessage(options.message || defaultMessage);
      window.prompt(message, text);
    }
  } finally {
    // Cleanup
    if (selection && range) {
      if (typeof selection.removeRange === "function") {
        selection.removeRange(range);
      } else {
        selection.removeAllRanges();
      }
    }

    if (mark && mark.parentNode) {
      document.body.removeChild(mark);
    }
    
    if (reselectPrevious) {
      reselectPrevious();
    }
  }

  return success;
}

// Modern functional component
export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  children,
  onCopy,
  options,
}) => {
  const handleClick = async (event: MouseEvent) => {
    const elem = Children.only(children);
    
    let result: boolean;
    
    // Try modern async approach first, fallback to legacy
    try {
      result = await copyToClipboard(text, options);
    } catch {
      result = copyLegacy(text, options);
    }
    
    if (onCopy) {
      onCopy(text, result);
    }

    // Call original onClick if it exists
    const originalOnClick = (elem.props as any)?.onClick;
    if (originalOnClick && typeof originalOnClick === 'function') {
      originalOnClick(event);
    }
  };

  const elem = Children.only(children);
  return cloneElement(elem, { ...elem.props, onClick: handleClick });
};

// Keep the class component for backward compatibility
export class CopyToClipboardClass extends React.PureComponent<CopyToClipboardProps> {
  onClick = async (event: MouseEvent) => {
    const { text, onCopy, children, options } = this.props;
    const elem = Children.only(children);

    let result: boolean;
    
    try {
      result = await copyToClipboard(text, options);
    } catch {
      result = copyLegacy(text, options);
    }

    if (onCopy) {
      onCopy(text, result);
    }

    const originalOnClick = (elem.props as any)?.onClick;
    if (originalOnClick && typeof originalOnClick === 'function') {
      originalOnClick(event);
    }
  };

  render() {
    const { children } = this.props;
    
    const elem = Children.only(children);
    return cloneElement(elem, { ...elem.props, onClick: this.onClick });
  }
}

// Export both for flexibility
export default CopyToClipboard;