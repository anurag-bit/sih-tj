import {
  SummaryResponseSchema, PlanResponseSchema, DesignResponseSchema, FullResponseSchema, ExportResponseSchema,
  SummaryResponse, PlanResponse, DesignResponse, FullResponse, ExportResponse
} from '../schemas/docgen';

const API_BASE_URL = '/api/docgen';

type DocGenRequestPayload = {
  title: string;
  description: string;
  constraints?: string[];
  model?: string;
  context?: object;
  user_prompt?: string;
};

type ExportRequestPayload = {
  bundle: object;
  format: 'pdf' | 'zip';
};

type ApiResult<T> = { success: true; data: T } | { success: false; error: string };

async function post<T>(endpoint: string, payload: object, schema: Zod.Schema<T>): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      return { success: false, error: errorData.detail || 'An unknown error occurred' };
    }

    const data = await response.json();
    const validation = schema.safeParse(data);

    if (!validation.success) {
      console.error('Zod validation error:', validation.error);
      return { success: false, error: 'Received invalid data from the server.' };
    }

    return { success: true, data: validation.data };
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'A network error occurred.' };
  }
}

export const docgenApi = {
  generateSummary: (payload: DocGenRequestPayload): Promise<ApiResult<SummaryResponse>> =>
    post('/summary', payload, SummaryResponseSchema),

  generatePlan: (payload: DocGenRequestPayload): Promise<ApiResult<PlanResponse>> =>
    post('/plan', payload, PlanResponseSchema),

  generateDesign: (payload: DocGenRequestPayload): Promise<ApiResult<DesignResponse>> =>
    post('/design', payload, DesignResponseSchema),

  generateFull: (payload: DocGenRequestPayload): Promise<ApiResult<FullResponse>> =>
    post('/full', payload, FullResponseSchema),

  exportDocument: (payload: ExportRequestPayload): Promise<ApiResult<ExportResponse>> =>
    post('/export', payload, ExportResponseSchema),
};
