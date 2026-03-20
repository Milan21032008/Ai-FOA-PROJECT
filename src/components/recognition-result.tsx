"use client";

import React, { useEffect, useState } from "react";
import { Volume2, Sparkles, Languages, Calculator, SearchCode, AlertCircle, RefreshCcw } from "lucide-react";
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
      message = "Identified your virtual handwriting: The AI brain is currently resting. Please wait a moment.";
    } else if (mathResult) {
      const speechExpr = recognizedText?.replace(/\*/g, 'times').replace(/\//g, 'divided by').replace(/x/g, 'times') || "";
      message = `Identified your virtual handwriting: ${speechExpr} equals ${mathResult}`;
    } else if (shape && shape !== 'none') {
      message = `Identified your virtual handwriting: ${shape}`;
    } else if (recognizedText) {
      message = `Identified your virtual handwriting: ${recognizedText}`;
    }
    
    if (!message) return;
    
    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('google uk english female') || 
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('zira') ||
      v.name.toLowerCase().includes('victoria')
    );
    
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      }
    }
  }, []);

  useEffect(() => {
    if (result && !isLoading) {
      speak(result.recognizedText, result.mathResult, result.detectedShape, result.error);
    }
  }, [result, isLoading]);

  if (!result && !isLoading) {
    return (
      <Card className="border-dashed border-2 bg-muted/30 animate-in fade-in duration-500">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
          <Languages className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">Draw math (e.g. 5+3), words, or shapes and press Identify.</p>
        </CardContent>
      </Card>
    );
  }

  const isMath = !!result?.mathResult;
  const isShape = result?.detectedShape !== 'none';
  const isError = result?.error === 'QUOTA_EXCEEDED';

  return (
    <Card className="relative overflow-hidden border-2 transition-all duration-500 shadow-2xl min-h-[420px] animate-in zoom-in-95 duration-300">
      {isLoading && (
        <div className="absolute inset-0 bg-white/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-xl" />
          <p className="text-primary font-black text-xl tracking-tighter animate-pulse uppercase">AI Analyzing...</p>
        </div>
      )}
      
      <CardHeader className="text-center pb-2 border-b bg-primary/5">
        <CardTitle className="flex items-center justify-center gap-2 text-primary font-black tracking-tighter uppercase text-base">
          {isError ? <RefreshCcw className="w-5 h-5 text-orange-500 animate-spin-slow" /> : isMath ? <Calculator className="w-5 h-5" /> : isShape ? <SearchCode className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          {isError ? "System Recovery" : isMath ? "Math Solver" : isShape ? "Shape ID" : "Handwriting Result"}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center p-8 gap-6">
        <div className="relative w-full flex flex-col items-center gap-4">
          {isSpeaking && <div className="ripple-effect absolute inset-0 -z-10" />}
          
          <div className={cn(
            "w-full min-h-[160px] rounded-3xl bg-white shadow-inner border-2 flex flex-col items-center justify-center p-8 gap-2 transition-all duration-700",
            isShape && "border-accent/30 bg-accent/5",
            isMath && "border-primary/30 bg-primary/5",
            isError && "border-orange-200 bg-orange-50",
            !isShape && !isMath && !isError && "border-primary/20 bg-primary/5"
          )}>
            {isError ? (
              <div className="flex flex-col items-center gap-3 text-center animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-12 h-12 text-orange-500 mb-1" />
                <span className="text-2xl font-black text-orange-700 leading-tight uppercase tracking-tighter">AI Needs a Moment</span>
                <p className="text-xs font-bold text-orange-600/70 uppercase tracking-widest px-4">The free-tier limit is reached. We are recovering.</p>
              </div>
            ) : isShape ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Detected Shape</span>
                <span className="text-6xl font-black text-accent uppercase tracking-tighter drop-shadow-sm">{result?.detectedShape}</span>
              </div>
            ) : isMath ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <span className="text-4xl font-bold text-muted-foreground/50 tracking-tight">{result?.recognizedText}</span>
                <div className="h-0.5 w-1/2 bg-primary/20 rounded-full" />
                <span className="text-7xl font-black text-primary font-headline drop-shadow-md tracking-tighter">= {result?.mathResult}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Handwriting</span>
                <span className="text-6xl font-black text-primary font-headline tracking-tighter drop-shadow-md break-all text-center leading-tight">
                  {result?.recognizedText}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">
            Identified your virtual handwriting
          </h3>
          <p className="text-muted-foreground text-sm font-semibold tracking-tight italic">
            {isError ? "AI is cooling down. Please wait shortly." : "Real-time AI analysis complete."}
          </p>
        </div>

        <button 
          onClick={() => result && speak(result.recognizedText, result.mathResult, result.detectedShape, result.error)} 
          disabled={!result || isLoading} 
          className="group rounded-full px-12 py-4 flex gap-3 items-center bg-primary text-white hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/30 disabled:opacity-50 disabled:grayscale"
        >
          <Volume2 className={cn("w-6 h-6", isSpeaking && "animate-bounce")} />
          <span className="font-black text-lg uppercase tracking-tighter">Listen Result</span>
        </button>
      </CardContent>
    </Card>
  );
}
