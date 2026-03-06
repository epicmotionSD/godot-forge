import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { buildFunction } from "@/lib/inngest/functions/build";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [buildFunction],
});
