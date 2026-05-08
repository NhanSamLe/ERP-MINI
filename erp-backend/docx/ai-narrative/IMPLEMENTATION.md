# AI Financial Narrative - Detailed Implementation Guide

## 🎯 Architecture

```
ERP Data → KPI Calculator → Prompt Builder → OpenAI API → Response Parser → Cache → UI
```

---

## 📋 Database Schema

### ai_narrative_configs

```sql
CREATE TABLE ai_narrative_configs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  narrative_type ENUM('monthly_report', 'sales_performance', 'vendor_performance', 'cash_flow'),
  template_name VARCHAR(255),
  prompt_template LONGTEXT,
  tone ENUM('formal', 'casual', 'analytical'),
  language VARCHAR(10),
  max_tokens INT DEFAULT 500,
  temperature FLOAT DEFAULT 0.7,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### ai_narrative_cache

```sql
CREATE TABLE ai_narrative_cache (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  narrative_type VARCHAR(50),
  period_start DATE,
  period_end DATE,
  data_hash VARCHAR(64),
  narrative_text LONGTEXT,
  metadata JSON,
  ttl_expires_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### ai_narrative_logs

```sql
CREATE TABLE ai_narrative_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  company_id INT NOT NULL,
  user_id INT NOT NULL,
  narrative_type VARCHAR(50),
  period_start DATE,
  period_end DATE,
  input_data JSON,
  output_narrative LONGTEXT,
  tokens_used INT,
  cost_usd DECIMAL(10, 4),
  generation_time_ms INT,
  status ENUM('success', 'failed', 'partial'),
  error_message TEXT,
  created_at TIMESTAMP
);
```

---

## 🔧 Implementation Steps

### Step 1: Create Models

**File: erp-backend/src/models/narrative-config.model.ts**

```typescript
import { DataTypes, Model, Sequelize } from "sequelize";

export class NarrativeConfig extends Model {
  public id!: number;
  public companyId!: number;
  public narrativeType!: string;
  public templateName!: string;
  public promptTemplate!: string;
  public tone!: "formal" | "casual" | "analytical";
  public language!: string;
  public maxTokens!: number;
  public temperature!: number;
  public isActive!: boolean;
}

export function initNarrativeConfigModel(sequelize: Sequelize) {
  NarrativeConfig.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "company_id",
      },
      narrativeType: {
        type: DataTypes.ENUM(
          "monthly_report",
          "sales_performance",
          "vendor_performance",
          "cash_flow",
        ),
        allowNull: false,
        field: "narrative_type",
      },
      templateName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "template_name",
      },
      promptTemplate: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
        field: "prompt_template",
      },
      tone: {
        type: DataTypes.ENUM("formal", "casual", "analytical"),
        defaultValue: "analytical",
      },
      language: {
        type: DataTypes.STRING(10),
        defaultValue: "vi",
      },
      maxTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 500,
        field: "max_tokens",
      },
      temperature: {
        type: DataTypes.FLOAT,
        defaultValue: 0.7,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "is_active",
      },
    },
    {
      sequelize,
      tableName: "ai_narrative_configs",
      timestamps: true,
      underscored: true,
    },
  );

  return NarrativeConfig;
}
```

### Step 2: Create Services

**File: erp-backend/src/services/narrative.service.ts**

```typescript
import { Sequelize } from "sequelize";
import { KPICalculatorService } from "./kpi-calculator.service";
import { PromptBuilderService } from "./prompt-builder.service";
import { LLMIntegrationOpenAIService } from "./llm-integration-openai.service";
import { NarrativeConfig } from "../models/narrative-config.model";
import { NarrativeCache } from "../models/narrative-cache.model";
import { NarrativeLog } from "../models/narrative-log.model";
import {
  GenerateNarrativeRequest,
  GenerateNarrativeResponse,
} from "../types/narrative.types";
import * as crypto from "crypto";

export class NarrativeService {
  constructor(
    private sequelize: Sequelize,
    private kpiCalculator: KPICalculatorService,
    private promptBuilder: PromptBuilderService,
    private llmIntegration: LLMIntegrationOpenAIService,
  ) {}

  async generateNarrative(
    request: GenerateNarrativeRequest,
    userId: number,
  ): Promise<GenerateNarrativeResponse> {
    try {
      // 1. Check cache
      if (!request.forceRefresh) {
        const cached = await this.getFromCache(
          request.companyId,
          request.narrativeType,
          request.periodStart,
          request.periodEnd,
        );

        if (cached) {
          return {
            success: true,
            data: cached,
            cacheHit: true,
          };
        }
      }

      // 2. Calculate KPIs
      const kpis = await this.kpiCalculator.calculateMonthlyReportKPIs(
        request.companyId,
        request.periodStart,
        request.periodEnd,
      );

      // 3. Get config
      const config = await NarrativeConfig.findOne({
        where: {
          companyId: request.companyId,
          narrativeType: request.narrativeType,
          isActive: true,
        },
      });

      if (!config) {
        throw new Error(`No active config for ${request.narrativeType}`);
      }

      // 4. Build prompt
      const prompt = this.promptBuilder.buildMonthlyReportPrompt(
        kpis,
        config.toJSON(),
      );

      // 5. Generate narrative
      const startTime = Date.now();
      const narrative = await this.llmIntegration.generateNarrative(
        prompt,
        config.maxTokens,
        config.temperature,
      );
      const generationTime = Date.now() - startTime;

      // 6. Save to cache
      await this.saveToCache(
        request.companyId,
        request.narrativeType,
        request.periodStart,
        request.periodEnd,
        narrative,
      );

      // 7. Log
      await NarrativeLog.create({
        companyId: request.companyId,
        userId,
        narrativeType: request.narrativeType,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        inputData: JSON.stringify(kpis),
        outputNarrative: narrative.narrative,
        tokensUsed: narrative.metadata.tokensUsed,
        generationTimeMs: generationTime,
        status: "success",
      });

      return {
        success: true,
        data: narrative,
        cacheHit: false,
      };
    } catch (error) {
      await NarrativeLog.create({
        companyId: request.companyId,
        userId,
        narrativeType: request.narrativeType,
        periodStart: request.periodStart,
        periodEnd: request.periodEnd,
        inputData: JSON.stringify(request),
        status: "failed",
        errorMessage: error.message,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async getFromCache(
    companyId: number,
    narrativeType: string,
    periodStart: string,
    periodEnd: string,
  ) {
    const cached = await NarrativeCache.findOne({
      where: {
        companyId,
        narrativeType,
        periodStart,
        periodEnd,
      },
    });

    if (cached && new Date(cached.ttlExpiresAt) > new Date()) {
      return JSON.parse(cached.narrativeText);
    }

    return null;
  }

  private async saveToCache(
    companyId: number,
    narrativeType: string,
    periodStart: string,
    periodEnd: string,
    narrative: any,
  ) {
    const ttlExpiresAt = new Date();
    ttlExpiresAt.setDate(ttlExpiresAt.getDate() + 7);

    await NarrativeCache.create({
      companyId,
      narrativeType,
      periodStart,
      periodEnd,
      dataHash: this.generateHash(JSON.stringify(narrative)),
      narrativeText: JSON.stringify(narrative),
      ttlExpiresAt,
    });
  }

  private generateHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }
}
```

### Step 3: Create Express Controller

**File: erp-backend/src/controllers/narrative.controller.ts**

```typescript
import { Request, Response } from "express";
import { NarrativeService } from "../services/narrative.service";
import { GenerateNarrativeRequest } from "../types/narrative.types";

export class NarrativeController {
  constructor(private narrativeService: NarrativeService) {}

  async generateNarrative(req: Request, res: Response) {
    try {
      const request: GenerateNarrativeRequest = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await this.narrativeService.generateNarrative(
        request,
        userId,
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.json(result);
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}
```

### Step 4: Create Express Routes

**File: erp-backend/src/routes/narrative.routes.ts**

```typescript
import { Router, Request, Response } from "express";
import { NarrativeController } from "../controllers/narrative.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Initialize controller (inject dependencies)
const controller = new NarrativeController(narrativeService);

// Middleware
router.use(authMiddleware);

// Routes
router.post("/generate", (req: Request, res: Response) =>
  controller.generateNarrative(req, res),
);

export default router;
```

### Step 5: Register Routes in App

**File: erp-backend/src/server.ts**

```typescript
import express from "express";
import narrativeRoutes from "./routes/narrative.routes";

const app = express();

// ... other middleware

// Register narrative routes
app.use("/api/ai-narrative", narrativeRoutes);

// ... rest of app
```

---

## 🧪 Testing

```bash
# Test API
curl -X POST http://localhost:3000/api/ai-narrative/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyId": 1,
    "narrativeType": "monthly_report",
    "periodStart": "2025-03-01",
    "periodEnd": "2025-03-31"
  }'
```

---

## ✅ Checklist

- [ ] Database migrations run
- [ ] Models created
- [ ] Services created
- [ ] Controller created
- [ ] Routes created
- [ ] Routes registered in app
- [ ] API tested
- [ ] Cache working
- [ ] Logging working

---

**Ready to implement! 🚀**
