import { Op } from "sequelize";
import { Uom, UomConversion } from "../../../models";


export class CreateUomDto {
  code!: string; 
  name!: string; 
}

export class UpdateUomDto {
  code?: string; 
  name?: string;
}

export const getAllUoms = async () => {
  const result = await Uom.findAll({
    order: [["id", "ASC"]],
  });

  return {
    message: "Lấy danh sách đơn vị tính thành công.",
    data: result,
  };
};

export const searchUoms = async (search?: string) => {
  const where: any = {};

  if (search) {
    where[Op.or] = [
      { code: { [Op.like]: `%${search}%` } },
      { name: { [Op.like]: `%${search}%` } },
    ];
  }

  const result = await Uom.findAll({
    where,
    order: [["id", "ASC"]],
  });

  if (!result.length)
    return { message: "Không tìm thấy đơn vị tính phù hợp.", data: [] };

  return { message: "Lấy danh sách đơn vị tính thành công.", data: result };
};

// 📌 Lấy chi tiết UOM
export const getUomById = async (id: number) => {
  const uom = await Uom.findByPk(id);
  if (!uom) throw new Error("Đơn vị tính không tồn tại.");
  return uom;
};

export const createUom = async (data: CreateUomDto) => {
  if (!data.code || !data.name)
    throw new Error("Mã và tên đơn vị tính là bắt buộc.");

  const exist = await Uom.findOne({ where: { code: data.code } });
  if (exist) throw new Error("Mã đơn vị tính đã tồn tại.");

  const created = await Uom.create(data);
  return { message: "Tạo đơn vị tính thành công.", data: created };
};

export const updateUom = async (id: number, data: UpdateUomDto) => {
  const uom = await Uom.findByPk(id);
  if (!uom) throw new Error("Đơn vị tính không tồn tại.");

  if (data.code) {
    const duplicate = await Uom.findOne({
      where: {
        code: data.code,
        id: { [Op.ne]: id },
      },
    });
    if (duplicate) throw new Error("Mã đơn vị tính đã tồn tại.");
  }

  const updated = await uom.update(data);
  return { message: "Cập nhật đơn vị tính thành công.", data: updated };
};

export const deleteUom = async (id: number) => {
  const uom = await Uom.findByPk(id);
  if (!uom) throw new Error("Đơn vị tính không tồn tại.");
  await uom.destroy();
  return { message: "Xóa đơn vị tính thành công." };
};
