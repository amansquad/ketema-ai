"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const STEPS = [
  {
    title: "Welcome to Ketema AI",
    description: "Create your digital twin city. Let's get you started with the basics.",
  },
  {
    title: "Place Assets",
    description: "Drag buildings, trees, or roads from the left palette directly onto the scene to place them.",
  },
  {
    title: "Transform Objects",
    description: "Click an object to see the gizmo. Drag the arrows to move, circles to rotate, and squares to scale.",
  },
  {
    title: "Customize Properties",
    description: "Use the right panel to fine-tune the name, color, and scale, or change individual part colors.",
  },
  {
    title: "AI Assistant",
    description: "Stuck? Tell the AI assistant in the bottom-left to 'add a residential neighborhood' or 'clear the scene'.",
  },
];

export function TutorialOverlay() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("ketema-tutorial-dismissed");
    if (!hasSeenTutorial) {
      setIsVisible(true);
    }
  }, []);

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      dismiss();
    }
  };

  const dismiss = () => {
    localStorage.setItem("ketema-tutorial-dismissed", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-6">
      <div className="relative max-w-md w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 w-8 rounded-full transition-colors ${
                  i === currentStep ? "bg-emerald-500" : "bg-zinc-800"
                }`}
              />
            ))}
          </div>

          <h2 className="mb-3 text-2xl font-semibold text-zinc-100">{step.title}</h2>
          <p className="mb-8 text-zinc-400 leading-relaxed">{step.description}</p>

          <div className="flex w-full items-center justify-between gap-4">
            <button
              onClick={dismiss}
              className="flex-1 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
            >
              Don't show this again
            </button>
            <button
              onClick={next}
              className="flex-1 rounded-lg bg-emerald-500 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
            >
              {isLastStep ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
