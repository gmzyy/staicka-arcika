'use client';

import React, { useState, useEffect } from 'react';
import { useArchitectureStore, ArchitectureCosts } from '@/store/useArchitectureStore';
import DiagramCanvas from '@/components/DiagramCanvas';
import ArchitectureInsights from '@/components/ArchitectureInsights';
import { Play, Code2, LayoutTemplate, Loader2, Wand2, AlertCircle, Info, Briefcase, Server, Database, Globe, DollarSign, ChevronRight, Menu } from 'lucide-react';

export default function Home() {
  const { mermaidCode, setMermaidCode, explanation, setExplanation, costs, setCosts } = useArchitectureStore();

  // Modos y States
  const [activeMode, setActiveMode] = useState<'expert' | 'entrepreneur'>('expert');
  const [idea, setIdea] = useState('');

  // States para Modo Emprendedor
  const [entUsers, setEntUsers] = useState('');
  const [entBudget, setEntBudget] = useState('');
  const [entFeatures, setEntFeatures] = useState('');

  // States para Navegación Móvil
  const [mobileTab, setMobileTab] = useState<'idea' | 'code' | 'diagram'>('idea');

  // States para Refinamiento
  const [isRefiningMode, setIsRefiningMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRefining, setIsRefining] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [localCode, setLocalCode] = useState(mermaidCode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Ref para el textarea del editor manual
  const editorRef = React.useRef<HTMLTextAreaElement>(null);

  // Sincronizar cambios externos (cuando la IA actualiza el store)
  useEffect(() => {
    setLocalCode(mermaidCode);
  }, [mermaidCode]);

  // Handler para llamar a la API interna de Staicka
  const handleGenerateAI = async () => {
    let finalPrompt = '';

    if (activeMode === 'expert') {
      if (!idea.trim()) return;

      // Validar si requiere refinamiento (Idea corta en Modo Experto)
      if (idea.length < 35 && !isRefiningMode) {
        handleRefineIdea();
        return;
      }

      // Si ya pasó por refinamiento o es lo suficientemente larga, este es el prompt final:
      finalPrompt = idea;
    } else {
      if (!entUsers || !entBudget || !entFeatures) {
        setErrorMessage("Por favor llena las 3 preguntas del modo emprendedor.");
        return;
      }
      finalPrompt = `Basado en este perfil de negocio, diseña la mejor arquitectura posible que oculte la complejidad al usuario: 
- Usuarios esperados (mes 1): ${entUsers}
- Presupuesto mensual: ${entBudget}
- Funciones principales: ${entFeatures}`;
    }

    executeGeneration(finalPrompt);
  };

  const executeGeneration = async (finalPrompt: string) => {
    setIsGenerating(true);
    setErrorMessage(null); // Limpiar errores previos
    setMobileTab('diagram'); // Cambiar a la pestaña de diagrama en móvil automáticamente

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: finalPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el cerebro de Staicka');
      }

      // IMPORTANTE: Asegúrate que el backend devuelva JSON con mermaid, explanation y costs
      if (data.mermaid) {
        setMermaidCode(data.mermaid);
        if (data.explanation) setExplanation(data.explanation);
        if (data.costs) setCosts(data.costs);

        // Limpiar inputs tras el éxito
        if (activeMode === 'expert') {
          setIdea('');
          setIsRefiningMode(false);
          setSuggestions([]);
        }
      }
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      setErrorMessage(error.message || "No se pudo conectar con la IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefineIdea = async () => {
    setIsRefining(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error refinando la idea');

      setSuggestions(data.suggestions || []);
      setIsRefiningMode(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error al buscar sugerencias.");
    } finally {
      setIsRefining(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    const enrichedIdea = `${idea}. Específicamente, incluye el módulo de: ${suggestion}.`;
    setIdea(enrichedIdea);
    setIsRefiningMode(false); // Hide the cards
    executeGeneration(enrichedIdea); // Trigger generation immediately
  };

  const handleUpdateDiagram = () => {
    setMermaidCode(localCode);
  };

  // Click to Code: Funcionalidad Pro
  const handleNodeClick = (nodeId: string) => {
    if (!editorRef.current || !localCode) return;

    // Buscar en el texto completo dónde se define o usa el nodo.
    // Ej: "A[Web App]" o "A --> B"
    const lines = localCode.split('\n');
    let targetLineIndex = -1;

    // Lógica simple: Buscar la primera aparición del nodeId aislado o definiendo algo.
    // Usamos una Regex para encontrar la letra/id exacta.
    const regex = new RegExp(`\\b${nodeId}\\b`);

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        targetLineIndex = i;
        break;
      }
    }

    if (targetLineIndex !== -1) {
      // Calcular la posición del caracter (Start / End)
      let charIndexStart = 0;
      for (let i = 0; i < targetLineIndex; i++) {
        charIndexStart += lines[i].length + 1; // +1 por el \n
      }

      const lineLength = lines[targetLineIndex].length;

      // Hacer foco, seleccionar línea completa y scrollear
      editorRef.current.focus();
      editorRef.current.setSelectionRange(charIndexStart, charIndexStart + lineLength);

      // Calcular scroll aproximado
      const lineHeight = 18; // px aprox por línea text-xs
      editorRef.current.scrollTop = targetLineIndex * lineHeight;

      // Cambiar a la pestaña experta para que el dev pueda editar
      setActiveMode('expert');
      setMobileTab('code');
    }
  };

  return (
    <main className="flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-zinc-950 text-foreground font-sans pb-16 lg:pb-0">
      {/* Panel Izquierdo - Área de Control */}
      <aside className={`w-full lg:w-[450px] border-r border-zinc-800 bg-zinc-950 flex-col shadow-2xl z-20 transition-all ${mobileTab === 'diagram' ? 'hidden lg:flex' : 'flex'} h-full lg:h-screen overflow-hidden`}>
        <div className="p-4 lg:p-6 border-b border-zinc-800 flex items-center gap-3 shrink-0">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <LayoutTemplate className="w-6 h-6 text-cyan-500" />
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight text-white uppercase">Staicka <span className="text-cyan-500">Architect</span></h1>
            <p className="text-xs text-zinc-400">Powered by Gemini 1.5 Pro</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Mode Tabs */}
          <div className={`flex border-b border-zinc-800 shrink-0 ${mobileTab === 'idea' ? 'flex' : 'hidden lg:flex'}`}>
            <button
              onClick={() => setActiveMode('expert')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex justify-center items-center gap-2 ${activeMode === 'expert' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Code2 className="w-4 h-4" />
              Deseo Personalizar
            </button>
            <button
              onClick={() => setActiveMode('entrepreneur')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 flex justify-center items-center gap-2 ${activeMode === 'entrepreneur' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <Briefcase className="w-4 h-4" />
              Modo Emprendedor
            </button>
          </div>

          {/* Entrada de Idea con IA */}
          <div className={`p-4 lg:p-6 border-b border-zinc-800/50 shrink-0 ${mobileTab === 'idea' ? 'block' : 'hidden lg:block'}`}>
            {activeMode === 'expert' ? (
              <>
                {!isRefiningMode ? (
                  <>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                      <Wand2 className="w-4 h-4 text-cyan-500" />
                      Describe tu idea de sistema
                    </label>
                    <textarea
                      value={idea}
                      onChange={(e) => setIdea(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 lg:p-4 text-xs lg:text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 resize-none placeholder:text-zinc-600 transition-all min-h-[100px] lg:min-h-[120px]"
                      placeholder="Ej: Una arquitectura de microservicios con Next.js, Go y Redis..."
                      disabled={isGenerating || isRefining}
                    />
                  </>
                ) : (
                  <div className="animate-fade-in">
                    <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Idea ambigua detectada. ¿Qué enfoque prefieres?
                    </h3>
                    <div className="space-y-2">
                      {suggestions.map((sug, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestion(sug)}
                          className="p-3 bg-zinc-900/80 border border-zinc-700/50 rounded-lg hover:border-cyan-500/50 hover:bg-zinc-800 cursor-pointer transition-all group flex items-start gap-3"
                        >
                          <ChevronRight className="w-4 h-4 mt-0.5 text-zinc-600 group-hover:text-cyan-500 flex-shrink-0" />
                          <span className="text-xs lg:text-sm text-zinc-300 group-hover:text-white leading-tight">{sug}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => { setIsRefiningMode(false); executeGeneration(idea); }}
                        className="w-full mt-2 text-xs text-zinc-500 hover:text-zinc-300 underline"
                      >
                        Ignorar e intentar con la idea original
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col gap-4 animate-fade-in">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">¿Cuántos usuarios esperas el 1er mes?</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 lg:p-3 text-xs lg:text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
                    placeholder="Ej: 1,000 activos"
                    value={entUsers} onChange={e => setEntUsers(e.target.value)} disabled={isGenerating}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">¿Cual es tu presupuesto de servidor?</label>
                  <input
                    type="text"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 lg:p-3 text-xs lg:text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none"
                    placeholder="Ej: $50 dólares/mes"
                    value={entBudget} onChange={e => setEntBudget(e.target.value)} disabled={isGenerating}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">¿Qué funciones principales tendrá tu app?</label>
                  <textarea
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-2.5 lg:p-3 text-xs lg:text-sm text-zinc-300 focus:border-cyan-500 focus:outline-none resize-none min-h-[80px]"
                    placeholder="Ej: Pagos con Stripe, Streaming de Video, Base de datos de roles..."
                    value={entFeatures} onChange={e => setEntFeatures(e.target.value)} disabled={isGenerating}
                  />
                </div>
              </div>
            )}

            {/* Mensaje de Error Visual */}
            {errorMessage && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMessage}
              </div>
            )}

            {!isRefiningMode && (
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || isRefining || (activeMode === 'expert' && !idea.trim())}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 text-white font-medium lg:font-semibold py-3 px-4 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] text-sm lg:text-base"
              >
                {isGenerating || isRefining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isRefining ? 'Refinando idea...' : 'Arquitecto pensando...'}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generar con STAICKA IA
                  </>
                )}
              </button>
            )}
          </div>

          {/* Editor Manual de Mermaid */}
          <div className={`p-4 lg:p-6 flex-1 flex flex-col gap-3 lg:gap-4 min-h-[50vh] lg:min-h-0 ${mobileTab === 'code' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Code2 className="w-4 h-4 text-zinc-500" />
                Código Mermaid (Editor)
              </div>
              <button
                onClick={handleUpdateDiagram}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3 text-cyan-500" />
                Actualizar
              </button>
            </div>

            <textarea
              ref={editorRef}
              value={localCode}
              onChange={(e) => setLocalCode(e.target.value)}
              className="flex-1 w-full bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-3 text-xs font-mono text-zinc-400 focus:outline-none focus:border-cyan-500/50 selection:bg-cyan-500/30 resize-none transition-colors"
              spellCheck={false}
            />
          </div>
        </div>
      </aside>

      {/* Panel Derecho - El Plano Técnico */}
      <section className={`flex-1 bg-zinc-950 relative flex flex-col ${mobileTab === 'diagram' ? 'flex' : 'hidden lg:flex'}`}>
        {/* We removed the static background grid as DiagramCanvas now handles an interactive one */}

        <div className="flex-1 relative border-b border-zinc-800/50">
          <DiagramCanvas onNodeClick={handleNodeClick} />
        </div>

        {/* Panel Inferior de Explicación y Costos */}
        {(explanation || costs) && (
          <div className="bg-zinc-900/50 backdrop-blur-md border-t border-zinc-800/50 flex flex-col xl:flex-row shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 relative">

            {/* Estimador de Costos */}
            {costs && (
              <div className="w-full xl:w-[450px] p-6 bg-zinc-950/30 flex flex-col justify-center border-b xl:border-b-0 xl:border-r border-zinc-800/50">
                <h3 className="flex items-center justify-between text-zinc-100 font-semibold mb-6">
                  <span className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Presupuesto Estimado</span>
                  <span className="text-xs font-normal text-zinc-500 px-2 py-1 bg-zinc-800 rounded-md">/ mes (AWS o Azure)</span>
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-zinc-400"><Database className="w-4 h-4 text-purple-400" /> Base de Datos</span>
                    <span className="font-mono text-zinc-200">${costs.database || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-zinc-400"><Server className="w-4 h-4 text-blue-400" /> Servidores/Serverless</span>
                    <span className="font-mono text-zinc-200">${costs.servers || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-zinc-400"><Globe className="w-4 h-4 text-orange-400" /> Servicios Externos</span>
                    <span className="font-mono text-zinc-200">${costs.external || 0}</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-3 mt-1 flex justify-between items-center">
                    <span className="text-zinc-300 font-medium">Total Estimado</span>
                    <span className="text-xl font-bold text-green-400 flex items-center">
                      ${costs.total || (costs.database + costs.servers + costs.external)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Explicación Técnica (Collapsible) */}
            <div className="flex-1 relative flex flex-col justify-end min-h-[160px]">
              <ArchitectureInsights />
            </div>
          </div>
        )}
      </section>
      {/* Navegación Móvil Inferior */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-800 z-50 flex py-2 px-2 justify-between items-center pb-safe">
        <button onClick={() => setMobileTab('idea')} className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-colors ${mobileTab === 'idea' ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Wand2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Idea</span>
        </button>
        <button onClick={() => setMobileTab('code')} className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-colors ${mobileTab === 'code' ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <Code2 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Código</span>
        </button>
        <button onClick={() => setMobileTab('diagram')} className={`flex flex-col items-center gap-1 p-2 flex-1 rounded-xl transition-colors ${mobileTab === 'diagram' ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}>
          <LayoutTemplate className="w-5 h-5" />
          <span className="text-[10px] font-medium">Diagrama</span>
        </button>
      </div>
    </main>
  );
}