'use client';

import React, { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, CheckCircle2, Cpu, Briefcase, Zap } from 'lucide-react';
import { useArchitectureStore } from '@/store/useArchitectureStore';

export default function ArchitectureInsights() {
    const { explanation } = useArchitectureStore();
    const [isOpen, setIsOpen] = useState(false);

    if (!explanation || !explanation.business) {
        return null;
    }

    return (
        <div className="absolute bottom-0 left-0 right-0 z-50">
            <Collapsible.Root
                open={isOpen}
                onOpenChange={setIsOpen}
                className="w-full bg-zinc-950/80 backdrop-blur-xl border-t border-cyan-500/30 overflow-hidden"
            >
                <Collapsible.Trigger asChild>
                    <button
                        className="w-full flex items-center justify-between px-6 py-4 outline-none hover:bg-zinc-900/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-md">
                                <Zap className="w-5 h-5 text-cyan-400" />
                            </div>
                            <span className="text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors tracking-wide">
                                ¿Por qué Staicka eligió esta arquitectura?
                            </span>
                        </div>
                        {isOpen ? (
                            <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                        ) : (
                            <ChevronUp className="w-5 h-5 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
                        )}
                    </button>
                </Collapsible.Trigger>

                <AnimatePresence>
                    {isOpen && (
                        <Collapsible.Content forceMount asChild>
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                className="max-h-[40vh] overflow-y-auto"
                            >
                                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-800/50 bg-gradient-to-b from-transparent to-cyan-950/10">

                                    {/* Columna: Negocio */}
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                            <Briefcase className="w-5 h-5 text-cyan-500" />
                                            Impacto en Negocio
                                        </h3>
                                        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 prose prose-invert prose-sm max-w-none">
                                            <p className="text-zinc-300 leading-relaxed">
                                                {explanation.business}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Columna: Técnica */}
                                    <div className="space-y-4">
                                        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                                            <Cpu className="w-5 h-5 text-blue-500" />
                                            Implementación Técnica
                                        </h3>
                                        <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 prose prose-invert prose-sm max-w-none">
                                            <p className="text-zinc-300 leading-relaxed font-mono text-xs">
                                                {explanation.technical}
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        </Collapsible.Content>
                    )}
                </AnimatePresence>
            </Collapsible.Root>
        </div>
    );
}
