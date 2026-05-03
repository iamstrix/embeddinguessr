import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HintTooltipProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function HintTooltip({ title, description, children, className = "" }: HintTooltipProps) {
  const [visible, setVisible] = useState(false);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => setVisible(true);
  const hide = () => setVisible(false);

  const onTouchStart = () => {
    touchTimerRef.current = setTimeout(() => setVisible(true), 400);
  };
  const onTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 z-50 pointer-events-none"
          >
            <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-xl px-3.5 py-3 shadow-2xl">
              <div className="text-xs font-mono font-bold text-white mb-1.5">{title}</div>
              <div className="text-[11px] font-mono text-white/55 leading-relaxed">{description}</div>
            </div>
            <div className="w-2 h-2 bg-black/90 border-r border-b border-white/10 rotate-45 mx-auto -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
