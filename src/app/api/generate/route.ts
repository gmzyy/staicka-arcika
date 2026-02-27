import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

// 1. Mover la inicialización fuera del handler es mejor práctica de rendimiento.
// Si cambias el .env, Next.js refresca el servidor automáticamente en desarrollo.
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: "Has agotado tus créditos diarios de STAICKA. ¡Vuelve mañana!" },
                { status: 429 }
            );
        }

        if (!genAI) {
            return NextResponse.json({ error: "Configuración de API ausente en STAICKA." }, { status: 500 });
        }

        const { idea } = await req.json();

        // 2. Usar 'gemini-2.5-flash' y forzar JSON output.
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Eres un Arquitecto de Software Senior de la marca STAICKA.
Tu respuesta DEBE ser ÚNICAMENTE un objeto JSON válido con el siguiente formato exacto:
{
  "mermaid": "Aquí va el código Mermaid.js puro (usa preferiblemente graph TD, detallado, grande y con subgrafos si aplica).",
  "explanation": {
     "business": "Impacto en negocio, por qué ayuda a escalar, mejora el TTM o previene errores. Dirigido a directores.",
     "technical": "Explicación muy técnica de por qué se eligieron estas tecnologías. Dirigido a Ingenieros."
  }
}

REGLAS CRÍTICAS PARA MERMAID:
1. Los nombres de los nodos deben ser simples (A, B, C).
2. El texto de los nodos DEBE estar siempre entre comillas dobles si contiene espacios o caracteres especiales, ej: A["Web App (React/Vue)"]. NUNCA uses paréntesis u otros caracteres sin comillas dobles protectivas.
3. NO uses saltos de línea dentro de las etiquetas de los nodos.
4. NO uses bloques de código (markdown) ni backticks en el texto de tu respuesta JSON.`,
            generationConfig: {
                temperature: 0.1, // Baja temperatura para consistencia técnica
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(idea);
        const response = await result.response;
        let text = response.text();

        // 3. Limpieza de emergencia (por si la IA ignora el mimeType e incluye bloques de código markdown)
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsedResult;
        try {
            parsedResult = JSON.parse(text);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", text);
            throw new Error("La IA no devolvió un JSON válido.");
        }

        // Limpieza extra del código Mermaid por si Gemini incluyó backticks
        const cleanMermaid = parsedResult.mermaid
            .replace(/```mermaid/g, "")
            .replace(/```/g, "")
            .trim();

        return NextResponse.json({
            mermaid: cleanMermaid,
            explanation: parsedResult.explanation
        });
    } catch (error: any) {
        console.error("Error en la ruta de la IA:", error);

        // Si el error persiste como 404, puede ser un tema de cuota o región.
        return NextResponse.json({
            error: "Error de conexión con el cerebro de Staicka. Verifica tu cuota de Gemini."
        }, { status: 500 });
    }
}