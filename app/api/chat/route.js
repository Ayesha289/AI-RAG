import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from '@pinecone-database/pinecone';
import fetch from 'cross-fetch';

global.fetch = fetch;

const systemPrompt = `
You are a rate my professor agent to help students find classes, that takes in user questions and answers them.
For every user question, the top 3 professors that match the user question are returned.
Use them to answer the question if needed.
`;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generationConfig = {
  stopSequences: ["red"],
  maxOutputTokens: 500,
  temperature: 0.7,
  topP: 0.6,
  topK: 16,
};

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  generationConfig,
  systemInstruction: systemPrompt,
});

export async function POST(req) {
    const data = await req.json();
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    const index = pc.index('rag').namespace('ns1');
    const text = data[data.length - 1].content;

    const embedding_model = genAI.getGenerativeModel({
        model: 'text-embedding-004'
    });

    const embedding = await embedding_model.embedContent(text);
    const vector = embedding['embedding'].values;

    // Ensure vector is a flat array of numbers
    if (!Array.isArray(vector) || vector.some(isNaN)) {
        console.log(vector)
        throw new Error("Embedding is not correctly formatted.");
    }

    const results = await index.query({
        topK: 5,
        includeMetadata: true,
        vector: vector,
    });

    let resultString = '';
    results.matches.forEach((match) => {
        resultString += `
        Returned Results:
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n`;
    });

    const lastMessage = data[data.length - 1];
    const lastMessageContent = lastMessage.content + resultString;
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

    const result = await model.generateContent(lastMessageContent);
    const response = result.response;
    const res = response.text();
    
    return NextResponse.json(res, { status: 200 });
}
