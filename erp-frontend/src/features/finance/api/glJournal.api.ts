import apiClient from "../../../api/axiosClient";
import { GlJournalDTO } from "../dto/glJournal.dto";

const BASE_URL = "/finance/gl-journals";

export const glJournalApi = {
  getAll: () => apiClient.get<GlJournalDTO[]>(BASE_URL),
};
