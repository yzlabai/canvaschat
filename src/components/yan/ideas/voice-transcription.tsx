"use client";

interface VoiceTranscriptionProps {
  transcriptionText: string;
}

export function VoiceTranscription({ transcriptionText }: VoiceTranscriptionProps) {
  if (!transcriptionText) return null;

  return (
    <div className="px-4 py-2 bg-blue-50 border-t">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm text-muted-foreground">Transcribing:</span>
        <span className="text-sm font-medium">{transcriptionText}</span>
      </div>
    </div>
  );
}
