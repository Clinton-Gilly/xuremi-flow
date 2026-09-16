import { redirect } from "next/navigation";

export default async function WorkflowsRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = new URLSearchParams();

  for (const [key, val] of Object.entries(params)) {
    if (typeof val === "string") {
      search.set(key, val);
    } else if (Array.isArray(val)) {
      for (const item of val) {
        search.append(key, item);
      }
    }
  }

  const query = search.toString();
  redirect(`/w${query ? `?${query}` : ""}`);
}
