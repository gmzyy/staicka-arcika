import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Nota: Mantener esto afuera está bien, pero asegúrate de haber reiniciado 
// el servidor si cambiaste tu .env recientemente.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "API Key no configurada." }, { status: 500 });
        }

        const { idea } = await req.json();

        if (!idea || idea.length < 5) {
            return NextResponse.json({ error: "La idea es demasiado corta." }, { status: 400 });
        }

        // 1. Usamos Flash por velocidad y estabilidad
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `Eres un consultor de negocios senior de STAICKA. 
El usuario tiene una idea de negocio. Propón EXACTAMENTE 3 módulos de software esenciales.
Responde ÚNICAMENTE en JSON: { "suggestions": ["string", "string", "string"] }`,
            generationConfig: {
                temperature: 0.2, // Bajamos la temperatura para que sea más "serio" y preciso
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(idea);
        const response = await result.response;
        let text = response.text();

        // 2. Limpieza de emergencia (por si la IA ignora el mimeType)
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();

        let parsedResult;
        try {
            parsedResult = JSON.parse(text);
        } catch (e) {
            console.error("FALLA DE PARSEO EN STAICKA. Texto recibido:", text);
            throw new Error("Respuesta de IA no procesable.");
        }

        return NextResponse.json({
            suggestions: parsedResult.suggestions || []
        });

    } catch (error: any) {
        // 3. Este log aparecerá en tu terminal de VS Code, ¡revísalo!
        console.error("DETALLE DEL ERROR EN REFINE:", error.message || error);

        return NextResponse.json({
            error: "Error analizando la idea. Revisa la terminal del servidor."
        }, { status: 500 });
    }
}