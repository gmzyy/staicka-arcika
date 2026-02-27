import { create } from 'zustand';

export interface ArchitectureCosts {
    database: number;
    servers: number;
    external: number;
    total: number;
}

export interface ArchitectureExplanation {
    business: string;
    technical: string;
}

interface ArchitectureState {
    mermaidCode: string;
    explanation: ArchitectureExplanation;
    costs: ArchitectureCosts | null;
    setMermaidCode: (code: string) => void;
    setExplanation: (explanation: ArchitectureExplanation) => void;
    setCosts: (costs: ArchitectureCosts | null) => void;
}

const initialCode = `graph TD
    A[Client Request] --> B(API Gateway)
    B --> C{Load Balancer}
    C -->|Route 1| D[Service A]
    C -->|Route 2| E[Service B]
    D --> F[(Database)]
    E --> F
`;

export const useArchitectureStore = create<ArchitectureState>((set) => ({
    mermaidCode: initialCode,
    explanation: {
        business: "Arquitectura base de ejemplo para demostrar la integración. Minimiza el esfuerzo inicial aportando escalabilidad comprobada en producción con balanceo de carga.",
        technical: "Muestra un flujo simple de cliente a base de datos a través de un API Gateway y balanceador de carga, enrutando a dos servicios que comparten una misma base de datos. Ideal para MVPs.",
    },
    costs: null,
    setMermaidCode: (code) => set({ mermaidCode: code }),
    setExplanation: (text) => set({ explanation: text }),
    setCosts: (costs) => set({ costs }),
}));
