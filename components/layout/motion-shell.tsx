"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

export function MotionShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
