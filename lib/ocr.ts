import { DocumentProcessorServiceClient } from "@google-cloud/documentai";
import { env } from "@/lib/env";

export function isOcrConfigured() {
  return Boolean(
    env.GOOGLE_CLOUD_PROJECT_ID &&
      env.GOOGLE_CLOUD_LOCATION &&
      env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID &&
      env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

/** Regional hostname must match the processor’s location (e.g. asia-south1-documentai.googleapis.com). */
function documentAiEndpoint(location: string) {
  return `${location}-documentai.googleapis.com`;
}

let cachedClient: DocumentProcessorServiceClient | null = null;
let cachedEndpointKey = "";

function getDocumentAiClient() {
  const key = `${env.GOOGLE_CLOUD_LOCATION}:${env.GOOGLE_CLOUD_PROJECT_ID}`;
  const endpoint = documentAiEndpoint(env.GOOGLE_CLOUD_LOCATION);
  if (!cachedClient || cachedEndpointKey !== key) {
    cachedClient = new DocumentProcessorServiceClient({ apiEndpoint: endpoint });
    cachedEndpointKey = key;
  }
  return cachedClient;
}

const PROCESS_TIMEOUT_MS = 300_000;

export async function extractTextWithDocumentAi(base64: string, mimeType: string) {
  if (!isOcrConfigured()) {
    return { text: "", usedOcr: false, reason: "Document AI is not configured" };
  }

  const client = getDocumentAiClient();
  const processorPath = `projects/${env.GOOGLE_CLOUD_PROJECT_ID}/locations/${env.GOOGLE_CLOUD_LOCATION}/processors/${env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`;

  const [result] = await client.processDocument(
    {
      name: processorPath,
      rawDocument: {
        content: base64,
        mimeType,
      },
    },
    { timeout: PROCESS_TIMEOUT_MS }
  );

  const text = result.document?.text || "";
  return { text, usedOcr: true };
}
