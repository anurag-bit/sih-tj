import {
  SummaryResponseSchema, PlanResponseSchema, DesignResponseSchema, FullResponseSchema, ExportResponseSchema,
  SummaryResponse, PlanResponse, DesignResponse, FullResponse, ExportResponse
} from '../schemas/docgen';

const API_BASE_URL = '/api/docgen';
const DEFAULT_TIMEOUT_MS = 45000;
const MAX_RETRIES = 2; // simple retry for transient issues

type DocGenRequestPayload = {
  title: string;
  description: string;
  constraints?: string[];
  model?: string;
  context?: object;
  user_prompt?: string;
  prompts?: string[]; // for /full
};

type ExportRequestPayload = {
  bundle: object;
  format: 'pdf' | 'zip';
};

type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

async function post<T>(endpoint: string, payload: object, schema: ZodType<T>): Promise<ApiResult<T>> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        lastError = errorData.detail || 'An unknown error occurred';
        // Retry on 502/503/504
        if ([502, 503, 504].includes(response.status) && attempt < MAX_RETRIES) continue;
  return { success: false, error: lastError || 'Request failed' };
      }

      const data = await response.json();
      const validation = schema.safeParse(data);
      if (!validation.success) {
        console.error('Zod validation error:', validation.error);
        return { success: false, error: 'Received invalid data from the server.' };
      }
      return { success: true, data: validation.data };
    } catch (error: any) {
      window.clearTimeout(timeout);
      const msg = error?.name === 'AbortError' ? 'Request timed out' : (error instanceof Error ? error.message : 'A network error occurred.');
      lastError = msg;
      if (attempt < MAX_RETRIES) continue;
      console.error(`API call to ${endpoint} failed:`, error);
      return { success: false, error: msg };
    }
  }
  return { success: false, error: lastError || 'Unknown error' };
}

export const docgenApi = {
  generateSummary: (payload: DocGenRequestPayload): Promise<ApiResult<SummaryResponse>> =>
    post('/summary', payload, SummaryResponseSchema),

  generatePlan: (payload: DocGenRequestPayload): Promise<ApiResult<PlanResponse>> =>
    post('/plan', payload, PlanResponseSchema),

  generateDesign: (payload: DocGenRequestPayload): Promise<ApiResult<DesignResponse>> =>
    post('/design', payload, DesignResponseSchema),

  generateFull: (payload: DocGenRequestPayload): Promise<ApiResult<FullResponse>> =>
    post('/full', {
      // ensure prompts for better outputs
      prompts: payload.prompts && payload.prompts.length > 0 ? payload.prompts : ['exec_summary', 'solution_plan', 'system_design'],
      ...payload,
    }, FullResponseSchema),

  exportDocument: (payload: ExportRequestPayload): Promise<ApiResult<ExportResponse>> =>
    post('/export', payload, ExportResponseSchema),
};
