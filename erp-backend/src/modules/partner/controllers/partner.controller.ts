import { Request, Response } from "express";
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
} from "../services/partner.service";

function getCompanyId(req: Request): number | undefined {
  return (req as any).user?.company_id;
}

// GET /api/partners
export async function getPartnersHandler(req: Request, res: Response) {
  try {
    const { type, status, search } = req.query;
    const company_id = getCompanyId(req);

    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) filter.search = search;
    if (company_id) filter.company_id = company_id;

    const partners = await getAllPartners(filter);
    res.json(partners);
  } catch (err: any) {
    res.status(500).json({ message: err.message || "Internal server error" });
  }
}

// GET /api/partners/:id
export async function getPartnerByIdHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const company_id = getCompanyId(req);
    const partner = await getPartnerById(id, company_id);
    res.json(partner);
  } catch (err: any) {
    if (err.message === "Partner not found") {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/partners
export async function createPartnerHandler(req: Request, res: Response) {
  try {
    const company_id = getCompanyId(req);
    if (!company_id) {
      return res.status(400).json({ message: "User không có company_id. Vui lòng đăng nhập lại." });
    }
    const partner = await createPartner({ ...req.body, company_id });
    res.status(201).json(partner);
  } catch (err: any) {
    res.status(400).json({ message: err.message || "Bad request" });
  }
}

// PUT /api/partners/:id
export async function updatePartnerHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const company_id = getCompanyId(req);
    const partner = await updatePartner(id, req.body, company_id);
    res.json(partner);
  } catch (err: any) {
    if (err.message === "Partner not found") {
      return res.status(404).json({ message: err.message });
    }
    res.status(400).json({ message: err.message || "Bad request" });
  }
}

// DELETE /api/partners/:id
export async function deletePartnerHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const company_id = getCompanyId(req);
    await deletePartner(id, company_id);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === "Partner not found") {
      return res.status(404).json({ message: err.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
}
