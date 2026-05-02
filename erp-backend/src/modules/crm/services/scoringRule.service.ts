import { ScoringRule } from "../models/scoringRule.model";
import { Lead } from "../models/lead.model";

export const getAllRules = async () => {
  return await ScoringRule.findAll({ order: [['score', 'DESC']] });
};

export const createRule = async (data: any) => {
  return await ScoringRule.create({ ...data, is_active: true });
};

export const updateRule = async (id: number, data: Partial<any>) => {
  const rule = await ScoringRule.findByPk(id);
  if (!rule) throw new Error("Scoring Rule not found");
  return await rule.update(data);
};

export const deleteRule = async (id: number) => {
  const rule = await ScoringRule.findByPk(id);
  if (!rule) throw new Error("Scoring Rule not found");
  await rule.destroy();
  return true;
};

// AUTO CALCULATE LEAD SCORE
export const calculateLeadScore = async (leadId: number) => {
  const lead = await Lead.findByPk(leadId) as any;
  if (!lead) return;

  const rules = await ScoringRule.findAll({ where: { is_active: true } }) as any[];
  let score = 0;

  for (const rule of rules) {
    let match = false;
    
    // Very simple matching criteria based on field name and value
    if (rule.condition_field === 'industry' && lead.industry === rule.condition_value) match = true;
    if (rule.condition_field === 'company_size' && lead.company_size === rule.condition_value) match = true;
    if (rule.condition_field === 'source_id' && lead.source_id == rule.condition_value) match = true;

    if (match) {
      score += Number(rule.score);
    }
  }

  // Update lead
  await lead.update({ lead_score: score });
  return score;
};
