import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { buildFunction } from "@/lib/inngest/functions/build";

export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [buildFunction],
  ...(process.env.NEXT_PUBLIC_APP_URL && {
    serveHost: process.env.NEXT_PUBLIC_APP_URL,
  }),
});
