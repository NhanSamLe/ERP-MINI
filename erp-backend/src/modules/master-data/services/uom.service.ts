import { Op } from "sequelize";
import { Uom, UomConversion } from "../../../models";

export class CreateUomDto {
  code!: string;
  name!: string;
  company_id?: number | null;
}

export class UpdateUomDto {
  code?: string;
  name?: string;
}

// WHERE company_id = companyId OR company_id IS NULL
function companyWhere(companyId?: number) {
  if (!companyId) return { company_id: null };
  return { [Op.or]: [{ company_id: companyId }, { company_id: null }] };
}

export const getAllUoms = async (companyId?: number) => {
  const result = await Uom.findAll({
    where: companyWhere(companyId) as any,
    order: [["company_id", "ASC"], ["id", "ASC"]],
  });
  return { message: "Lấy danh sách đơn vị tính thành công.", data: result };
};

export const searchUoms = async (search?: string, companyId?: number) => {
  const base = companyWhere(companyId) as any;
  const where: any = { ...base };

  if (search) {
    where[Op.and] = [
      base,
      { [Op.or]: [{ code: { [Op.like]: `%${search}%` } }, { name: { [Op.like]: `%${search}%` } }] },
    ];
    delete where[Op.or];
  }

  const result = await Uom.findAll({ where, order: [["id", "ASC"]] });
  if (!result.length) return { message: "Không tìm thấy đơn vị tính phù hợp.", data: [] };
  return { message: "Lấy danh sách đơn vị tính thành công.", data: result };
};

export const getUomById = async (id: number) => {
  const uom = await Uom.findByPk(id);
  if (!uom) throw new Error("Đơn vị tính không tồn tại.");
  return uom;
};

export const createUom = async (data: CreateUomDto) => {
  if (!data.code || !data.name) throw new Error("Mã và tên đơn vị tính là bắt buộc.");

  const exist = await Uom.findOne({
    where: { code: data.code, company_id: data.company_id ?? null },
  });
  if (exist) throw new Error("Mã đơn vị tính đã tồn tại.");

  const created = await Uom.create({
    code: data.code,
    name: data.name,
    company_id: data.company_id ?? null,
  });
  return { message: "Tạo đơn vị tính thành công.", data: created };
};

export const updateUom = async (id: number, data: UpdateUomDto) => {
  const uom = await Uom.findByPk(id);
  if (!uom) throw new Error("Đơn vị tính không tồn tại.");

  if (data.code) {
    const duplicate = await Uom.findOne({
      where: { code: data.code, company_id: uom.company_id, id: { [Op.ne]: id } },
    });
    if (duplicate) throw new Error("Mã đơn vị tính đã tồn tại.");
  }

  const updated = await uom.update(data);
  return { message: "Cập nhật đơn vị tính thành công.", data: updated };
};

export const deleteUom = async (id: number) => {
  const uom = await Uom.findByPk(id);
  if (!uom) throw new Error("Đơn vị tính không tồn tại.");
  // Không cho xóa UOM hệ thống (company_id = null)
  if (uom.company_id === null) throw new Error("Không thể xóa đơn vị tính hệ thống.");
  await uom.destroy();
  return { message: "Xóa đơn vị tính thành công." };
};
