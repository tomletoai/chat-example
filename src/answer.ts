import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { loadPineconeVector } from './pinecone';

const prompt = `
Ответь на вопрос исходя из предоставленной документации.
Всегда отвечай на русском языке.

Документация: """
{context}
"""

Вопрос: {question}
`;

export async function answerQuery(query: string) {
  const vectorStore = await loadPineconeVector(process.env.PINECONE_NAMESPACE);

  const model = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0,
  });

  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['context', 'question'],
  });

  const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever(3), {
    prompt: promptTemplate,
  });

  const { text } = await chain.call({
    query: query,
  });

  return text;
}
