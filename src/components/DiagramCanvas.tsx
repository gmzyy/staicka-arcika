'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { useArchitectureStore } from '@/store/useArchitectureStore';
import { toPng } from 'html-to-image';
import { Download, Loader2, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Configuración Maestra de Legibilidad y Estilo STAICKA
mermaid.initialize({
    startOnLoad: false,
    theme: 'base', // Usamos base para control total de colores
    securityLevel: 'loose',
    fontFamily: 'Inter, system-ui, sans-serif',
    themeVariables: {
        // Fondos y Bordes Profesionales
        primaryColor: '#18181b',       // Fondo Nodos (Zinc-900)
        primaryBorderColor: '#06b6d4',  // Borde Cian STAICKA
        clusterBkg: '#09090b',          // Fondo de Subgrafos
        clusterBorder: '#27272a',       // Borde de Subgrafos (Zinc-800)

        // Máxima Legibilidad de Texto
        primaryTextColor: '#ffffff',    // Texto Blanco Puro
        fontSize: '16px',               // Fuente más grande para Angel
        lineColor: '#71717a',           // Flechas en Zinc-400
        arrowheadColor: '#06b6d4',      // Puntas de flecha en Cian

        // Eliminar colores estridentes automáticos
        tertiaryColor: '#18181b',
        edgeLabelBackground: '#09090b',
    },
    flowchart: {
        htmlLabels: true,
        curve: 'basis', // Flechas orgánicas y limpias
        padding: 20
    }
});

interface DiagramCanvasProps {
    onNodeClick?: (nodeId: string) => void;
}

export default function DiagramCanvas({ onNodeClick }: DiagramCanvasProps) {
    const { mermaidCode } = useArchitectureStore();
    const [svgContent, setSvgContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [renderKey, setRenderKey] = useState(0);

    const exportAreaRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        setMousePos({
            x: (clientX / window.innerWidth - 0.5) * 20,
            y: (clientY / window.innerHeight - 0.5) * 20
        });
    }, []);

    const handleExport = async () => {
        if (!exportAreaRef.current) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(exportAreaRef.current, {
                cacheBust: true,
                backgroundColor: '#09090b',
                pixelRatio: 3, // Calidad Ultra-HD para presentaciones
            });
            const link = document.createElement('a');
            link.download = `staicka-arch-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Export Error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        const renderDiagram = async () => {
            if (!mermaidCode.trim()) {
                setSvgContent('');
                setError(null);
                return;
            }

            try {
                const id = `mermaid-${Math.random().toString(36).substring(7)}`;
                const { svg, bindFunctions } = await mermaid.render(id, mermaidCode);

                if (isMounted) {
                    setSvgContent(svg);
                    setError(null);
                    setRenderKey(prev => prev + 1);

                    setTimeout(() => {
                        if (bindFunctions) bindFunctions(exportAreaRef.current as Element);
                        const svgElement = exportAreaRef.current?.querySelector('svg');
                        if (svgElement && onNodeClick) {
                            svgElement.querySelectorAll('.node').forEach(node => {
                                (node as HTMLElement).style.cursor = 'pointer';
                                node.addEventListener('click', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onNodeClick(node.id.split('-').pop() || '');
                                });
                            });
                        }
                    }, 100);
                }
            } catch (err: any) {
                if (isMounted) setError(err?.message || "Error en sintaxis Mermaid");
            }
        };

        renderDiagram();
        return () => { isMounted = false; };
    }, [mermaidCode, onNodeClick]);

    return (
        <div className="relative flex-1 h-full w-full bg-zinc-950 flex flex-col overflow-hidden" onMouseMove={handleMouseMove}>

            {/* Grilla Técnica Interactiva */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    transform: `translate(${mousePos.x}px, ${mousePos.y}px)`
                }}
            />

            {/* Error Overlay */}
            {error && (
                <div className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-mono z-50 backdrop-blur-md">
                    ⚠️ {error}
                </div>
            )}

            {/* Header / Exportar */}
            {!error && svgContent && (
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="absolute top-6 right-6 z-40 flex items-center gap-2 bg-zinc-900/80 hover:bg-zinc-800 text-white text-sm font-medium px-5 py-2.5 rounded-xl border border-zinc-800 shadow-2xl transition-all disabled:opacity-50"
                >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> : <Download className="w-4 h-4 text-cyan-400" />}
                    Descargar Plano
                </button>
            )}

            <TransformWrapper initialScale={1} minScale={0.4} maxScale={5} centerOnInit>
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        {/* Controles Flotantes Minimalistas */}
                        <div className="absolute bottom-8 right-8 z-40 flex flex-col gap-2 bg-zinc-900/60 backdrop-blur-xl border border-white/5 p-2 rounded-2xl shadow-2xl">
                            <button onClick={() => zoomIn(0.3)} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-cyan-400"><ZoomIn className="w-5 h-5" /></button>
                            <button onClick={() => zoomOut(0.3)} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-cyan-400"><ZoomOut className="w-5 h-5" /></button>
                            <div className="h-px bg-white/5 mx-2" />
                            <button onClick={() => resetTransform()} className="p-2.5 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-cyan-400"><Maximize className="w-5 h-5" /></button>
                        </div>

                        <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                            <div
                                ref={exportAreaRef}
                                key={renderKey}
                                className="w-full h-full flex items-center justify-center p-20 animate-in fade-in zoom-in duration-700 select-none"
                                dangerouslySetInnerHTML={{ __html: svgContent }}
                            />
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>

            {/* Marca de Agua Staicka */}
            <div className="absolute bottom-8 left-8 flex items-center gap-3 opacity-20 pointer-events-none grayscale">
                <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse" />
                <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">STAICKA Architect</span>
            </div>
        </div>
    );
}