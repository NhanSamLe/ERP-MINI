import { Request, Response } from "express";
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
} from "../services/partner.service";

// GET /api/partners
export async function getPartnersHandler(req: Request, res: Response) {
  try {
    const { type, status, search } = req.query;

    // KHÔNG truyền undefined vào filter (tránh lỗi exactOptionalPropertyTypes)
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) filter.search = search;

    const partners = await getAllPartners(filter);
    res.json(partners);
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ message: err.message || "Internal server error" });
  }
}

// GET /api/partners/:id
export async function getPartnerByIdHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const partner = await getPartnerById(id);
    res.json(partner);
  } catch (err: any) {
    if (err.message === "Partner not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}

// POST /api/partners
export async function createPartnerHandler(req: Request, res: Response) {
  try {
    const partner = await createPartner(req.body);
    res.status(201).json(partner);
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ message: err.message || "Bad request" });
  }
}

// PUT /api/partners/:id
export async function updatePartnerHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const partner = await updatePartner(id, req.body);
    res.json(partner);
  } catch (err: any) {
    if (err.message === "Partner not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error(err);
    res.status(400).json({ message: err.message || "Bad request" });
  }
}

// DELETE /api/partners/:id
export async function deletePartnerHandler(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    await deletePartner(id);
    res.status(204).send();
  } catch (err: any) {
    if (err.message === "Partner not found") {
      return res.status(404).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
}
