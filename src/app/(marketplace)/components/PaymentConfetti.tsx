"use client";

import { useEffect } from "react";

const PaymentConfetti: React.FC = () => {
  useEffect(() => {
    let canvas: HTMLCanvasElement | null = document.createElement("canvas");

    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";

    document.body.appendChild(canvas);

    let isCancelled = false;

    const run = async () => {
      const { default: confettiLib } = await import("canvas-confetti");
      if (!canvas || isCancelled) return;

      const confetti = confettiLib.create(canvas, {
        resize: true,
        useWorker: true,
      });

      const duration = 2000;
      const end = Date.now() + duration;

      const oceanColors = ["#00CED1", "#1E90FF", "#4682B4", "#87CEEB", "#B0C4DE"];

      (function frame() {
        confetti({
          particleCount: 6,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: oceanColors,
        });
        confetti({
          particleCount: 6,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: oceanColors,
        });

        if (!isCancelled && Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();

      setTimeout(() => {
        if (canvas && canvas.parentNode) {
          canvas.parentNode.removeChild(canvas);
        }
        canvas = null;
      }, duration + 5000);
    };

    run();

    return () => {
      isCancelled = true;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      canvas = null;
    };
  }, []);

  return null;
};

export default PaymentConfetti;