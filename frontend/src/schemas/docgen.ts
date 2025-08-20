import { z } from 'zod';

export const DiagramSchema = z.object({
  id: z.string(),
  type: z.string(),
  language: z.string(),
  title: z.string().optional(),
  code: z.string(),
  rendered_svg_url: z.string().optional(),
});

export const SummaryResponseSchema = z.object({
  summary_md: z.string(),
});

export const PlanResponseSchema = z.object({
  plan_md: z.string(),
});

export const DesignResponseSchema = z.object({
  design_md: z.string(),
  diagrams: z.array(DiagramSchema),
});

export const FullResponseSchema = z.object({
  summary_md: z.string().optional(),
  plan_md: z.string().optional(),
  design_md: z.string().optional(),
  diagrams: z.array(DiagramSchema).optional().default([]),
  risks_md: z.string().optional(),
  acceptance_md: z.string().optional(),
  testing_md: z.string().optional(),
  api_md: z.string().optional(),
  data_md: z.string().optional(),
  data_model_md: z.string().optional(),
  capacity_md: z.string().optional(),
});

export const ExportResponseSchema = z.object({
  artifact_id: z.string(),
  filenames: z.array(z.string()),
});

export type SummaryResponse = z.infer<typeof SummaryResponseSchema>;
export type PlanResponse = z.infer<typeof PlanResponseSchema>;
export type DesignResponse = z.infer<typeof DesignResponseSchema>;
export type FullResponse = z.infer<typeof FullResponseSchema>;
export type ExportResponse = z.infer<typeof ExportResponseSchema>;
export type Diagram = z.infer<typeof DiagramSchema>;
