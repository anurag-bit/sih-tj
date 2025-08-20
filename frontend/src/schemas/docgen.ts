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
  summary_md: z.string(),
  plan_md: z.string(),
  design_md: z.string(),
  diagrams: z.array(DiagramSchema),
  risks_md: z.string(),
  acceptance_md: z.string(),
  testing_md: z.string(),
  api_md: z.string(),
  data_md: z.string(),
  capacity_md: z.string(),
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
