
"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Camera as CameraIcon, Trash2, Zap, ScanSearch, CheckCircle2, VideoOff, Hand, Palette, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DrawingCanvasProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

const COLORS = [
  { name: "Red", value: "#ef4444", minX: 0, maxX: 320 },
  { name: "Green", value: "#22c55e", minX: 320, maxX: 640 },
  { name: "Blue", value: "#3b82f6", minX: 640, maxX: 960 },
  { name: "Yellow", value: "#eab308", minX: 960, maxX: 1280 },
];

export function DrawingCanvas({ onCapture, isProcessing }: DrawingCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null); 
  const [activeColor, setActiveColor] = useState("#3b82f6");
  const activeColorRef = useRef("#3b82f6"); 
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isAirMode, setIsAirMode] = useState(false);
  const [mode, setMode] = useState<"draw" | "hover" | "eraser" | "idle">("idle");
  const [trackingPos, setTrackingPos] = useState<{ x: number; y: number } | null>(null);
  const [brushSize, setBrushSize] = useState(6);
  const brushSizeRef = useRef(6);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const lastAirPoint = useRef<{ x: number; y: number } | null>(null);
  const handsRef = useRef<any>(null);

  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
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
      window.speechSynthesis.speak(utterance);
    }
  };

  const startWebcam = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      const constraints = { 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          facingMode: "user"
        } 
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsCameraOn(true);
            setHasCameraPermission(true);
          }).catch(e => console.error("Video play error:", e));
        };
      }
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setHasCameraPermission(false);
      setIsCameraOn(false);
      toast({ variant: "destructive", title: "Camera Error", description: "Please enable camera access." });
    }
  }, [stream]);

  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOn(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  }, [stream]);

  const toggleCamera = () => isCameraOn ? stopWebcam() : startWebcam();

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      lastAirPoint.current = null;
      speak("Identified your virtual handwriting: Virtual canvas has been cleared.");
    }
  };

  const handleCapture = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const aiCanvas = document.createElement("canvas");
      aiCanvas.width = CANVAS_WIDTH;
      aiCanvas.height = CANVAS_HEIGHT;
      const aiCtx = aiCanvas.getContext("2d");
      if (aiCtx) {
        aiCtx.fillStyle = "black";
        aiCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        aiCtx.drawImage(canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        onCapture(aiCanvas.toDataURL("image/png"));
      }
    }
  }, [onCapture]);

  useEffect(() => {
    startWebcam();
    if (typeof window !== 'undefined') window.speechSynthesis.getVoices();
    return () => stream?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (!isAirMode || !isCameraOn || !videoRef.current) {
      setTrackingPos(null);
      lastAirPoint.current = null;
      setMode("idle");
      overlayRef.current?.getContext("2d")?.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      return;
    }

    let animationFrameId: number;
    const setupHands = async () => {
      try {
        const { Hands } = await import("@mediapipe/hands");
        if (!handsRef.current) {
          const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
          hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.8, minTrackingConfidence: 0.8 });
          handsRef.current = hands;
        }
        handsRef.current.onResults((results: any) => {
          const canvas = canvasRef.current;
          const overlay = overlayRef.current;
          if (!canvas || !overlay) return;
          const overlayCtx = overlay.getContext("2d");
          overlayCtx?.clearRect(0, 0, overlay.width, overlay.height);
          if (!results.multiHandLandmarks?.length) {
            setTrackingPos(null);
            lastAirPoint.current = null;
            setMode("idle");
            return;
          }
          const landmarks = results.multiHandLandmarks[0];
          
          if (overlayCtx) {
            overlayCtx.strokeStyle = "#22c55e";
            overlayCtx.lineWidth = 2;
            const connections = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];
            connections.forEach(([i, j]) => {
              const pt1 = landmarks[i]; const pt2 = landmarks[j];
              overlayCtx.beginPath(); overlayCtx.moveTo((1 - pt1.x) * overlay.width, pt1.y * overlay.height);
              overlayCtx.lineTo((1 - pt2.x) * overlay.width, pt2.y * overlay.height); overlayCtx.stroke();
            });
            landmarks.forEach((pt: any) => {
              overlayCtx.fillStyle = "#22c55e"; overlayCtx.beginPath();
              overlayCtx.arc((1 - pt.x) * overlay.width, pt.y * overlay.height, 3, 0, Math.PI * 2); overlayCtx.fill();
            });
          }

          const indexTip = landmarks[8]; 
          const middleTip = landmarks[12]; 
          const indexMcp = landmarks[5]; 
          const wrist = landmarks[0];
          
          const handScaleDist = Math.sqrt(Math.pow(wrist.x - indexMcp.x, 2) + Math.pow(wrist.y - indexMcp.y, 2));
          setBrushSize(Math.max(2, Math.min(30, handScaleDist * 80)));
          
          const x = (1 - indexTip.x) * CANVAS_WIDTH; 
          const y = indexTip.y * CANVAS_HEIGHT;
          setTrackingPos({ x, y });

          const isIndexOpen = indexTip.y < indexMcp.y; 
          const isMiddleOpen = middleTip.y < landmarks[9].y;
          const isFist = landmarks[8].y > landmarks[5].y && landmarks[12].y > landmarks[9].y && landmarks[16].y > landmarks[13].y && landmarks[20].y > landmarks[17].y;
          
          let currentMode: "draw" | "hover" | "eraser" | "idle" = "idle";
          
          if (isFist) {
            currentMode = "eraser";
          } else if (isIndexOpen && isMiddleOpen) {
            currentMode = "hover";
            // Color Selection Logic: Split 1280 into 4 equal segments of 320px
            if (y >= 0 && y <= 100) {
              if (x >= 0 && x <= 320) {
                setActiveColor("#ef4444"); // Red
              } else if (x > 320 && x <= 640) {
                setActiveColor("#22c55e"); // Green
              } else if (x > 640 && x <= 960) {
                setActiveColor("#3b82f6"); // Blue
              } else if (x > 960 && x <= 1280) {
                setActiveColor("#eab308"); // Yellow
              }
            }
          } else if (isIndexOpen) {
            currentMode = "draw";
          }
          
          setMode(currentMode);
          const ctx = canvas.getContext("2d");
          if (ctx) {
            if (currentMode === "draw") {
              ctx.lineWidth = brushSizeRef.current; 
              ctx.lineCap = "round"; 
              ctx.strokeStyle = activeColorRef.current; 
              ctx.globalCompositeOperation = "source-over";
              if (lastAirPoint.current && y >= 100) { 
                ctx.beginPath(); 
                ctx.moveTo(lastAirPoint.current.x, lastAirPoint.current.y); 
                ctx.lineTo(x, y); 
                ctx.stroke(); 
              }
              lastAirPoint.current = { x, y };
            } else if (currentMode === "eraser") {
              ctx.lineWidth = 100; 
              ctx.lineCap = "round"; 
              ctx.globalCompositeOperation = "destination-out";
              if (lastAirPoint.current) { 
                ctx.beginPath(); 
                ctx.moveTo(lastAirPoint.current.x, lastAirPoint.current.y); 
                ctx.lineTo(x, y); 
                ctx.stroke(); 
              }
              lastAirPoint.current = { x, y };
            } else {
              lastAirPoint.current = null;
            }
          }
        });
        const processFrame = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && isAirMode && isCameraOn) {
            try { await handsRef.current.send({ image: videoRef.current }); } catch (e) { console.warn("MediaPipe error:", e); }
          }
          animationFrameId = requestAnimationFrame(processFrame);
        };
        processFrame();
      } catch (err) { console.error("MediaPipe failed:", err); }
    };
    setupHands();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAirMode, isCameraOn]); 

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code === "Space") { 
        e.preventDefault(); 
        if (!isProcessing) {
          handleCapture(); 
        }
      } 
      if (e.code === "KeyC") clearCanvas(); 
    };
    window.addEventListener("keydown", handleKeyDown); 
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCapture, isProcessing]);

  return (
    <div className="flex flex-col gap-6 items-center w-full">
      <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 aspect-video">
        <div className="absolute top-0 left-0 right-0 h-[100px] flex z-50 pointer-events-none">
          {COLORS.map((color) => {
            const isHovering = mode === "hover" && trackingPos && trackingPos.y < 100 && trackingPos.x >= color.minX && trackingPos.x <= color.maxX;
            const isSelected = activeColor === color.value;
            
            return (
              <div 
                key={color.name} 
                className={cn(
                  "flex-1 flex flex-col items-center justify-center transition-all border-b-4", 
                  isSelected ? "opacity-100 border-white" : "opacity-40 border-transparent",
                  isHovering && "opacity-100 bg-white/20"
                )} 
                style={{ backgroundColor: color.value }}
              >
                <span className="text-white font-black text-sm uppercase tracking-widest drop-shadow-lg">{color.name}</span>
                {isSelected && <div className="mt-1 w-3 h-3 bg-white rounded-full animate-pulse shadow-xl" />}
                {isHovering && <Zap className="absolute w-8 h-8 text-white animate-ping opacity-50" />}
              </div>
            );
          })}
        </div>

        <video ref={videoRef} autoPlay playsInline muted className={cn("absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-500", isCameraOn ? "opacity-100" : "opacity-0")} />
        <canvas ref={overlayRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className={cn("absolute inset-0 w-full h-full z-20", isAirMode ? "cursor-none" : "cursor-crosshair")} />
        
        {isAirMode && trackingPos && (
          <div 
            className={cn(
              "absolute rounded-full border-2 border-white transition-all pointer-events-none z-30 flex items-center justify-center shadow-lg", 
              mode === "draw" && "transition-none", 
              mode === "hover" && "w-10 h-10 bg-white/40 backdrop-blur-sm scale-125 border-4", 
              mode === "eraser" && "w-24 h-24 bg-red-500/30 border-dashed border-red-500"
            )} 
            style={{ 
              left: `${(trackingPos.x / CANVAS_WIDTH) * 100}%`, 
              top: `${(trackingPos.y / CANVAS_HEIGHT) * 100}%`, 
              transform: 'translate(-50%, -50%)', 
              width: mode === "draw" ? `${brushSize * 2}px` : undefined, 
              height: mode === "draw" ? `${brushSize * 2}px` : undefined, 
              backgroundColor: mode === "draw" ? activeColor : undefined, 
              boxShadow: mode === "draw" ? `0 0 20px ${activeColor}` : undefined 
            }}
          >
            {mode === "eraser" && <Eraser className="w-8 h-8 text-white animate-bounce" />}
            {mode === "draw" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
            {mode === "hover" && <Palette className="w-5 h-5 text-white animate-spin-slow" />}
          </div>
        )}

        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-40 text-white p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <CameraIcon className={cn("w-12 h-12 text-primary", hasCameraPermission === null && "animate-pulse")} />
              <p className="text-lg font-medium">{hasCameraPermission === false ? "Camera access denied." : "Camera is off."}</p>
              <Button onClick={startWebcam} variant="secondary">Turn On Camera</Button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-50 flex flex-col gap-2">
          {isCameraOn && (
            <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 text-white text-xs font-bold border border-white/10 capitalize shadow-2xl">
              <div className="w-3 h-3 rounded-full shadow-[0_0_10px_white]" style={{ backgroundColor: mode === 'eraser' ? '#ef4444' : activeColor }} />
              Mode: {mode} | Size: {Math.round(brushSize)}
            </div>
          )}
          <Button onClick={toggleCamera} variant="ghost" size="sm" className="bg-black/40 hover:bg-black/60 text-white border border-white/10 rounded-full h-8 px-3 text-xs w-fit">
            {isCameraOn ? <VideoOff className="w-3 h-3 mr-2" /> : <CameraIcon className="w-3 h-3 mr-2" />}
            {isCameraOn ? "Off" : "On"}
          </Button>
        </div>
      </div>

      <div className="flex flex-row justify-center gap-4 w-full">
        <Button onClick={() => setIsAirMode(!isAirMode)} variant={isAirMode ? "default" : "outline"} size="lg" className={cn("flex-1 max-w-[200px] border-2 font-bold transition-all", isAirMode ? "bg-primary text-white border-primary shadow-lg" : "hover:border-primary hover:text-primary")}>
          <Hand className={cn("w-5 h-5 mr-2", isAirMode && mode === 'draw' && "animate-pulse")} />
          {isAirMode ? "Air: ON" : "Air: OFF"}
        </Button>
        <Button onClick={clearCanvas} variant="outline" size="lg" className="flex-1 max-w-[160px] border-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive transition-all">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </Button>
        <Button onClick={handleCapture} disabled={isProcessing} size="lg" className="flex-1 max-w-[200px] bg-primary text-white font-bold text-lg shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
          {isProcessing ? <ScanSearch className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
          Identify
        </Button>
      </div>
    </div>
  );
}
