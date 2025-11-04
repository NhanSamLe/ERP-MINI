// src/models/relations.helper.ts
import * as models from "../../models/index"; 

type RelationInfo = {
  model: any;
  modelName: string;
  field: string;
  as: string;
};

/**
 * Trả về danh sách (model, foreignKey, alias) có belongsTo(target).
 * target có thể là tên ("User") hoặc chính model (models.User).
 */
export function getRelations(target: any | string, log = false): RelationInfo[] {
  const result: RelationInfo[] = [];

  for (const [name, mdl] of Object.entries(models)) {
    if (!mdl || typeof mdl !== "function" || !("associations" in mdl)) continue;

    // Duyệt qua tất cả các association của model hiện tại
    const assocMap = (mdl as any).associations ?? {};
    for (const [as, assoc] of Object.entries(assocMap)) {
        if ((assoc as any).associationType !== "BelongsTo") continue; 
      const t = (assoc as any).target;
      const fk = (assoc as any).foreignKey;

      // Chỉ chọn nếu target là model cần kiểm tra (User)
      const matched =
        typeof target === "string" ? t?.name === target : t === target;

      // Chỉ tính nếu model hiện tại khác target (tránh Role.hasMany(User))
      if (matched && mdl !== target) {
        log && console.log(`🔗 ${name}.${fk} → ${(t && t.name) || "?"} (as: ${as})`);
        result.push({
          model: mdl,
          modelName: name,
          field: fk,
          as,
        });
      }
    }
  }
  for (const rel of result) {
    console.log(`📦 ${rel.modelName}.${rel.field} → ${rel.as}`);
  }
  return result;
}


export async function hasLinkedData(targetModel: any | string, id: number): Promise<boolean> {
  const relations = getRelations(targetModel);

  const counts = await Promise.all(
    relations.map(({ model, field }) => model.count({ where: { [field]: id } }))
  );

  return counts.some((c) => c > 0);
}
