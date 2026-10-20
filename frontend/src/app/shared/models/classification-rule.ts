export interface ClassificationRule {
  id: number;
  name: string;
  conditionsJson: string;
  categoryId: number;
  priority: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassificationRuleCreateRequest {
  name: string;
  conditionsJson: string;
  categoryId: number;
  priority?: number;
  isActive?: number;
}

export interface ClassificationRuleUpdateRequest {
  name?: string;
  conditionsJson?: string;
  categoryId?: number;
  priority?: number;
  isActive?: number;
}

export interface ClassificationRuleStatusUpdate {
  isActive: number;
}

export interface RuleTestRequest {
  conditionsJson: string;
}

export interface RuleProposeRequest {
  // transaction fields sent to the propose endpoint
  [key: string]: unknown;
}

export interface RuleProposeResponse {
  proposal: {
    categoryId: number;
    categoryName?: string;
    confidence?: number;
    matchedRuleId?: number;
  };
}
