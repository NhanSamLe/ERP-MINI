import { Op } from "sequelize";
import { Uom, UomConversion } from "../../../models";


export class CreateUomConversionDto {
  from_uom_id!: number;
  to_uom_id!: number;
  factor!: number;
}

export class UpdateUomConversionDto {
  factor?: number;
}
export const getAllConversions = async () => {
  const data = await UomConversion.findAll({
    include: [
      { model: Uom, as: "fromUom" },
      { model: Uom, as: "toUom" },
    ],
    order: [["id", "ASC"]],
  });

  return {
    message: "Lấy danh sách quy đổi thành công.",
    data,
  };
}; 

export const searchConversions = async (search?: string) => {
  const where: any = {};

  if (search) {
    where[Op.or] = [
      { "$fromUom.code$": { [Op.like]: `%${search}%` } },
      { "$toUom.code$": { [Op.like]: `%${search}%` } },
    ];
  }

  const data = await UomConversion.findAll({
    where,
    include: [
      { model: Uom, as: "fromUom" },
      { model: Uom, as: "toUom" },
    ],
       order: [["id", "ASC"]],
  });

  if (!data.length)
    return { message: "Không tìm thấy quy đổi phù hợp.", data: [] };

  return { message: "Lấy danh sách quy đổi thành công.", data };
};

// 📌 Tạo Conversion mới
export const createConversion = async (data: CreateUomConversionDto) => {
  const { from_uom_id, to_uom_id, factor } = data;

  if (!from_uom_id || !to_uom_id || !factor)
    throw new Error("Thiếu dữ liệu bắt buộc.");

  if (from_uom_id === to_uom_id)
    throw new Error("Hai đơn vị tính phải khác nhau.");

  if (factor <= 0) throw new Error("Hệ số quy đổi phải > 0.");

  const [fromUom, toUom] = await Promise.all([
    Uom.findByPk(from_uom_id),
    Uom.findByPk(to_uom_id),
  ]);

  if (!fromUom || !toUom)
    throw new Error("Đơn vị tính không hợp lệ.");

  const duplicated = await UomConversion.findOne({
    where: { from_uom_id, to_uom_id },
  });
  if (duplicated)
    throw new Error("Quy đổi này đã tồn tại, vui lòng chỉnh sửa.");

  const created = await UomConversion.create(data);
  return { message: "Tạo quy đổi thành công.", data: created };
};

// 📌 Cập nhật Conversion
export const updateConversion = async (id: number, data: UpdateUomConversionDto) => {
  const found = await UomConversion.findByPk(id);
  if (!found) throw new Error("Quy đổi không tồn tại.");

  if (data.factor && data.factor <= 0)
    throw new Error("Hệ số quy đổi phải lớn hơn 0.");

  const updated = await found.update(data);
  return { message: "Cập nhật quy đổi thành công.", data: updated };
};

// 📌 Xóa Conversion
export const deleteConversion = async (id: number) => {
  const found = await UomConversion.findByPk(id);
  if (!found) throw new Error("Quy đổi không tồn tại.");

  await found.destroy();
  return { message: "Xóa quy đổi thành công." };
};