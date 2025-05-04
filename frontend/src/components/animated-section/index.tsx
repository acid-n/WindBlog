"use client";
import { motion } from "framer-motion";
import React from "react";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, className, ariaLabel }) => (
  <motion.section
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={className}
    aria-label={ariaLabel}
  >
    {children}
  </motion.section>
);

export default AnimatedSection; 