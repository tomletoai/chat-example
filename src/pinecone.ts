import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { PineconeClient } from '@pinecone-database/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

async function getClient() {
  const client = new PineconeClient();
  await client.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
  return client;
}

export const clearPineconeIndex = async (namespace: string) => {
  const client = await getClient();

  const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

  await pineconeIndex.delete1({
    deleteAll: true,
    namespace: namespace,
  });
};

export const addToPinecondeIndex = async (
  namespace: string,
  docs: Document[]
) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 2000,
    chunkOverlap: 100,
  });

  const splittedDocs = await splitter.splitDocuments(docs);

  const client = await getClient();

  const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

  await PineconeStore.fromDocuments(splittedDocs, new OpenAIEmbeddings(), {
    pineconeIndex,
    namespace,
  });
};

export const loadPineconeVector = async (namespace: string) => {
  const client = await getClient();
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX);

  return await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {
    pineconeIndex,
    namespace,
  });
};
