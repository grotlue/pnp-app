import { requireAuth } from "@/server/auth/require-auth";
import { jsonError, jsonOk } from "@/lib/api/http";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth.response;
  }

  const client = auth.context.client;

  const [{ data: categories, error: categoriesError }, { data: labels, error: labelsError }] =
    await Promise.all([
      client
        .from("relationship_categories")
        .select("id, key, sort_order")
        .order("sort_order", { ascending: true }),
      client
        .from("relationship_label_presets")
        .select("id, key, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

  if (categoriesError) {
    return jsonError(400, "relationship_categories_fetch_failed", categoriesError.message);
  }

  if (labelsError) {
    return jsonError(400, "relationship_label_presets_fetch_failed", labelsError.message);
  }

  return jsonOk({
    categories: categories ?? [],
    labels: labels ?? [],
  });
}
