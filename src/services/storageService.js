import * as DocumentPicker from "expo-document-picker";
import { requireSupabase } from "../config/supabaseClient";

const BUCKET = "club-documents";

export const storageService = {
  async pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled) return null;
    return result.assets?.[0] || null;
  },
  async uploadPickedDocument(asset, folder = "general") {
    if (!asset?.uri) throw new Error("Fișier invalid.");
    const file = await fetch(asset.uri).then((res) => res.blob());
    const safeName = `${Date.now()}-${asset.name || "document"}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const path = `${folder}/${safeName}`;
    const { data, error } = await requireSupabase()
      .storage
      .from(BUCKET)
      .upload(path, file, { contentType: asset.mimeType || "application/octet-stream", upsert: false });
    if (error) throw error;
    return data;
  },
  async listDocuments(folder = "general") {
    const { data, error } = await requireSupabase()
      .storage
      .from(BUCKET)
      .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;
    return data || [];
  },
  async createSignedUrl(path) {
    const { data, error } = await requireSupabase().storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (error) throw error;
    return data?.signedUrl;
  },
};
