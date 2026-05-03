# Express.js Adaptation Guide

## ⚠️ Important Note

Backend uses **Express.js** (not NestJS), so some code needs adaptation.

---

## 🔄 Key Differences

### NestJS → Express.js

| Aspect                   | NestJS                       | Express                 |
| ------------------------ | ---------------------------- | ----------------------- |
| **Decorators**           | @Injectable, @Controller     | Plain classes           |
| **Dependency Injection** | Built-in                     | Manual                  |
| **Middleware**           | @UseGuards, @UseInterceptors | app.use()               |
| **Routing**              | @Post, @Get                  | router.post, router.get |
| **Models**               | TypeORM                      | Sequelize               |

---

## 📝 Adaptation Steps

### 1. Models (Sequelize)

```typescript
// Express style
export class NarrativeConfig extends Model {
  public id!: number;
  public companyId!: number;
  // ... properties
}

export function initNarrativeConfigModel(sequelize: Sequelize) {
  NarrativeConfig.init(
    {
      // ... field definitions
    },
    {
      sequelize,
      tableName: "ai_narrative_configs",
    },
  );
  return NarrativeConfig;
}
```

### 2. Services (Plain Classes)

```typescript
// Express style - no decorators
export class NarrativeService {
  constructor(
    private sequelize: Sequelize,
    private kpiCalculator: KPICalculatorService,
    private promptBuilder: PromptBuilderService,
    private llmIntegration: LLMIntegrationOpenAIService,
  ) {}

  async generateNarrative(request: GenerateNarrativeRequest, userId: number) {
    // ... implementation
  }
}
```

### 3. Controller (Express)

```typescript
// Express style - no decorators
export class NarrativeController {
  constructor(private narrativeService: NarrativeService) {}

  async generateNarrative(req: Request, res: Response) {
    try {
      const result = await this.narrativeService.generateNarrative(
        req.body,
        req.user?.id,
      );
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
}
```

### 4. Routes (Express)

```typescript
// Express style
import { Router } from "express";
import { NarrativeController } from "../controllers/narrative.controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();
const controller = new NarrativeController(narrativeService);

router.use(authMiddleware);
router.post("/generate", (req, res) => controller.generateNarrative(req, res));

export default router;
```

### 5. Register in App

```typescript
// In server.ts
import narrativeRoutes from "./routes/narrative.routes";

app.use("/api/ai-narrative", narrativeRoutes);
```

---

## ✅ Checklist

- [ ] Remove all @Injectable, @Controller decorators
- [ ] Use plain classes for services
- [ ] Use Sequelize for models
- [ ] Use Express Router for routes
- [ ] Manual dependency injection
- [ ] Register routes in app.ts/server.ts

---

**Ready to adapt! 🚀**
