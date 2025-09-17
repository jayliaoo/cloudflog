import { ActionFunctionArgs, redirect } from "react-router";
import { getAuth, getSession } from "~/auth.server";
import { getEnv } from "~/env.server";

export async function action({ request }: ActionFunctionArgs) {
  const env = getEnv();
  const auth = getAuth(env);
  
  // Check if there's an existing session
  const session = await getSession(request, env);
  
  if (session) {
    // Sign out the user
    await auth.signOut();
  }
  
  return redirect("/");
}