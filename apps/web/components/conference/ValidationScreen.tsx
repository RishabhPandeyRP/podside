"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Mic, Video, Shield, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface RoomParams {
    roomIdUrl?: string | string[];
}

const steps = [
    { icon: Mic, text: "Setting up microphone" },
    { icon: Video, text: "Checking camera" },
    { icon: Shield, text: "Validating room" },
    // { icon: CheckCircle2, text: "All set! Joining" },
];

const ValidationScreen = ({ roomIdUrl }: RoomParams) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [visibleSteps, setVisibleSteps] = useState([0, 1, 2]);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setOffset((prev) => prev + 1);
            setVisibleSteps((prev) => {
                const next = [...prev];
                next.shift();
                next.push(((next[next.length - 1] || 0) + 1) % steps.length);
                return next;
            });
        }, 900); // 1.5s per step
        return () => clearInterval(interval);
    }, []);

     const waveformData = useMemo(() => {
        return [...Array(120)].map((_, i) => ({
            height: Math.random() * 80 + 20,
            duration: 1 + Math.random() * 0.5,
            delay: i * 0.04,
        }));
    }, []);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#1b1b1b] text-white"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.1, ease: "easeInOut" }}
            style={{ originY: 0 }}
        >
            {/* --- HORIZONTAL WAVEFORM BACKGROUND --- */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
                <div className="flex items-end w-full h-40 justify-between px-2">
                    {waveformData.map((wave, i) => (
                        <motion.div
                            key={i}
                            className="w-[3px] bg-[#9966CC]/60 rounded-full"
                            animate={{
                                height: [8, wave.height, 8],
                            }}
                            transition={{
                                duration: wave.duration,
                                repeat: Infinity,
                                delay: wave.delay,
                                ease: "easeInOut",
                                repeatType: "loop",
                            }}
                        />
                    ))}
                </div>
            </div>
            

            <div className="relative h-60 overflow-hidden z-10 w-80 mt-[10%]">
                <AnimatePresence mode="popLayout">
                    {visibleSteps.map((stepIndex, position) => {
                        const step = steps[stepIndex];
                        const Icon = step?.icon as React.ComponentType<{ className?: string }>;
                        const isCenter = position === 1;

                        return (
                            <motion.div
                                key={`${stepIndex}-${offset + position}`}
                                className={`absolute left-0 right-0 flex items-center gap-3 text-2xl transition-all duration-500 ${
                                    isCenter ? "text-[#9966CC]" : "text-gray-500"
                                }`}
                                initial={{ 
                                    y: 160,
                                    opacity: 0,
                                    scale: 0.8
                                }}
                                animate={{ 
                                    y: position * 60,
                                    opacity: isCenter ? 1 : 0.3,
                                    // scale: isCenter ? 1 : 0.85
                                }}
                                exit={{ 
                                    y: -60,
                                    opacity: 0,
                                    scale: 0.8
                                }}
                                transition={{ 
                                    duration: 0.3,
                                    ease: [0.25, 0.46, 0.45, 0.94]
                                }}
                            >
                                <motion.div
                                    animate={isCenter ? {
                                        rotate: [0, 360],
                                    } : {}}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "linear"
                                    }}
                                >
                                    <Icon className={`w-5 h-5 ${isCenter ? 'text-[#9966CC]' : ''}`} />
                                </motion.div>
                                <span className="font-medium">{step?.text}</span>
                                
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            
        </motion.div>
    );
};

export default ValidationScreen;
