import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { getCurrentUser } from "~/auth.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  const user = await getCurrentUser(request, context.cloudflare.env as Env);
  
  if (!user) {
    return new Response('Not authenticated', { status: 401 });
  }
  
  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function action({ request, context }: ActionFunctionArgs) {
  const user = await getCurrentUser(request, context.cloudflare.env as Env);
  
  if (!user) {
    return new Response('Not authenticated', { status: 401 });
  }
  
  return new Response(JSON.stringify({ user }), {
    headers: { 'Content-Type': 'application/json' }
  });
}