"use client";

import React, { useState } from "react";
import { DrawingCanvas } from "@/components/drawing-canvas";
import { RecognitionResult } from "@/components/recognition-result";
import { recognizeDrawnLetter, type RecognizeDrawnTextOutput } from "@/ai/flows/recognize-drawn-letter-flow";
import { Info, BrainCircuit, Calculator, MessageSquareText, Shapes, Move3d } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Home() {
  const [result, setResult] = useState<RecognizeDrawnTextOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (imageDataUri: string) => {
    setIsProcessing(true);
    try {
      const data = await recognizeDrawnLetter({ imageDataUri });
      
      if (data.error === 'QUOTA_EXCEEDED') {
        toast({
          variant: "destructive",
          title: "AI Brain Overloaded",
          description: "The free-tier limit has been reached. Please wait a few seconds.",
        });
      }

      setResult(data);
    } catch (error: any) {
      console.error("Failed to recognize input:", error);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Oops! Something went wrong on our end.",
      });
      setResult({ error: "System Error", recognizedText: "Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-16 max-w-6xl">
      <header className="flex flex-col items-center mb-12 text-center animate-in fade-in slide-in-from-top duration-700">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <BrainCircuit className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-6xl font-black font-headline text-primary mb-2 tracking-tight">
          AI Motion<span className="text-accent">Desk</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium">
          Virtual Math & Real-time AI Handwriting Magic
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <section className="space-y-6">
            <DrawingCanvas onCapture={handleCapture} isProcessing={isProcessing} />
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
              <Card className="bg-white/50 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Calculator className="w-6 h-6 text-accent" />
                  <h4 className="font-bold text-sm">Math Solver</h4>
                  <p className="text-xs text-muted-foreground">Draw equations like "5 + 3".</p>
                </CardContent>
              </Card>
              <Card className="bg-white/50 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Shapes className="w-6 h-6 text-accent" />
                  <h4 className="font-bold text-sm">Magic Shapes</h4>
                  <p className="text-xs text-muted-foreground">Rough shapes become perfect.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/50 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Move3d className="w-6 h-6 text-accent" />
                  <h4 className="font-bold text-sm">3D Depth</h4>
                  <p className="text-xs text-muted-foreground">Proximity controls size.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/50 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <BrainCircuit className="w-6 h-6 text-accent" />
                  <h4 className="font-bold text-sm">Analysis</h4>
                  <p className="text-xs text-muted-foreground">Real-time hand tracking.</p>
                </CardContent>
              </Card>
              <Card className="bg-white/50 border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <MessageSquareText className="w-6 h-6 text-accent" />
                  <h4 className="font-bold text-sm">Voice AI</h4>
                  <p className="text-xs text-muted-foreground">Results are spoken aloud.</p>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <RecognitionResult result={result} isLoading={isProcessing} />
          
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div className="space-y-2">
                  <h3 className="font-bold text-primary">Instructions</h3>
                  <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                    <li><span className="font-bold text-blue-500 text-xs uppercase tracking-tighter">Index</span>: Draw (Paas/Door = Size).</li>
                    <li><span className="font-bold text-green-500 text-xs uppercase tracking-tighter">Two Fingers</span>: Select Color.</li>
                    <li><span className="font-bold text-red-500 text-xs uppercase tracking-tighter">Fist</span>: Magic Eraser.</li>
                    <li><kbd className="px-2 py-0.5 bg-muted border rounded">Space</kbd> Tap Identify.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="mt-20 pt-8 border-t text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} AI MotionDesk. Powered by GenAI Magic.</p>
      </footer>
    </main>
  );
}
