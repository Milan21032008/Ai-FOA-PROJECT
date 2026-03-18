"use client";

import React, { useEffect, useState } from "react";
import { Volume2, Sparkles, Languages, Calculator, SearchCode, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecognizeDrawnTextOutput } from "@/ai/flows/recognize-drawn-letter-flow";
import { cn } from "@/lib/utils";

interface RecognitionResultProps {
  result: RecognizeDrawnTextOutput | null;
  isLoading: boolean;
}

export function RecognitionResult({ result, isLoading }: RecognitionResultProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speak = (recognizedText?: string, mathResult?: string, shape?: string, error?: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    let message = "";
    if (error === 'QUOTA_EXCEEDED') {
      message = "The AI brain is resting. Please try again in a few seconds.";
    } else if (mathResult) {
      const speechExpr = recognizedText?.replace(/\*/g, 'times').replace(/\//g, 'divided by') || "";
      message = `Identified your virtual handwriting: ${speechExpr} equals ${mathResult}`;
    } else if (shape && shape !== 'none') {
      message = `Identified your virtual handwriting: ${shape}`;
    } else if (recognizedText) {
      message = `Identified your virtual handwriting: ${recognizedText}`;
    }
    if (!message) return;
    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('google uk english female') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('victoria'));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.getVoices();
    if (result && !isLoading) speak(result.recognizedText, result.mathResult, result.detectedShape, result.error);
  }, [result, isLoading]);

  if (!result && !isLoading) {
    return (
      <Card className="border-dashed border-2 bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Languages className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg">Draw math (5+3), words, or shapes (Circle) and press Identify.</p>
        </CardContent>
      </Card>
    );
  }

  const isMath = !!result?.mathResult;
  const isShape = result?.detectedShape !== 'none';
  const isError = !!result?.error;

  return (
    <Card className="relative overflow-hidden border-2 transition-all duration-500 shadow-xl min-h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-primary font-bold animate-pulse">AI is analyzing...</p>
        </div>
      )}
      <CardHeader className="text-center pb-2">
        <CardTitle className="flex items-center justify-center gap-2 text-primary font-headline">
          {isError ? <AlertCircle className="w-5 h-5 text-destructive" /> : isMath ? <Calculator className="w-5 h-5" /> : isShape ? <SearchCode className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          {isError ? "System Update" : isMath ? "Math Solver" : isShape ? "Shape ID" : "Handwriting"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center p-8 gap-6">
        <div className="relative w-full flex flex-col items-center gap-4">
          {isSpeaking && <div className="ripple-effect absolute inset-0 -z-10" />}
          <div className={cn("w-full min-h-[120px] rounded-2xl bg-primary/5 border-2 border-primary/20 flex flex-col items-center justify-center shadow-inner p-6 gap-2", isShape && "bg-accent/5 border-accent/20", isError && "bg-destructive/5 border-destructive/20")}>
            {isError ? (
              <span className="text-2xl font-bold text-destructive text-center">AI Brain Overloaded</span>
            ) : isShape ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black text-accent uppercase tracking-widest">{result?.detectedShape}</span>
              </div>
            ) : isMath ? (
              <>
                <span className="text-5xl font-black text-muted-foreground font-headline text-center break-all">{result?.recognizedText}</span>
                <span className="text-7xl font-black text-primary drop-shadow-sm font-headline text-center break-all border-t-2 border-primary/20 pt-2 w-full">= {result?.mathResult}</span>
              </>
            ) : (
              <span className="text-5xl font-black text-primary font-headline text-center break-all">{result?.recognizedText}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <h3 className="text-xl font-bold">
            {isError ? "Try again shortly" : `Identified: ${isMath ? result?.mathResult : isShape ? result?.detectedShape : result?.recognizedText}`}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isError ? "AI service is currently at its limit." : "Identified your virtual handwriting."}
          </p>
        </div>
        <button onClick={() => result && speak(result.recognizedText, result.mathResult, result.detectedShape, result.error)} disabled={!result} className="rounded-full px-8 py-3 flex gap-2 items-center bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground transition-all border-2 border-transparent font-medium disabled:opacity-50">
          <Volume2 className={isSpeaking ? "w-5 h-5 animate-bounce" : "w-5 h-5"} />
          Listen
        </button>
      </CardContent>
    </Card>
  );
}
