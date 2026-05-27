import { createClient } from "@supabase/supabase-js";

let supabaseClient: any = null;

function getSupabaseClient() {
	if (supabaseClient) return supabaseClient;

	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseKey) {
		throw new Error("Missing Supabase environment variables");
	}

	  supabaseClient = createClient<any>(supabaseUrl, supabaseKey);
	return supabaseClient;
}

	export const supabase: any = new Proxy({}, {
	get(_target, prop) {
			return getSupabaseClient()[prop as string];
	},
});
