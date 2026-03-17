import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("Manage Users function called");

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Get the caller's JWT
        const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
        if (!authHeader) {
            console.error("No authorization header found in request headers");
            return new Response(JSON.stringify({ error: "No authorization header" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, "");
        console.log("Token extracted (first 10 chars):", token.substring(0, 10));

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) {
            console.error("Invalid token error details:", userError);
            return new Response(JSON.stringify({
                error: "Invalid token",
                details: userError?.message
            }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log("Caller user ID:", user.id);

        // Check if user is admin
        const { data: roles, error: rolesError } = await supabaseClient
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .single();

        if (rolesError || !roles) {
            console.error("User is not admin. Role query error:", rolesError);
            return new Response(JSON.stringify({ error: "Unauthorized: Admin only" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get invite details
        const { email, full_name, role } = await req.json();
        console.log(`Inviting user: ${email}, Name: ${full_name}, Role: ${role}`);

        if (!email || !full_name || !role) {
            console.error("Missing fields:", { email, full_name, role });
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Invite user
        // Using a more reliable way to get the app URL, or fallback
        const appUrl = Deno.env.get("APP_URL") || "https://rayanne-imobiliaria.vercel.app";
        console.log(`Using appUrl: ${appUrl}`);

        const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
            data: { full_name, role },
            redirectTo: `${appUrl}/login`,
        });

        if (inviteError) {
            console.error("Supabase invite error:", inviteError);
            return new Response(JSON.stringify({ error: inviteError.message }), {
                status: inviteError.status || 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        console.log("Invite sent. User ID:", inviteData.user.id);
        const invitedUserId = inviteData.user.id;

        // Check if role already exists (from trigger)
        const { data: existingRole, error: existingRoleError } = await supabaseClient
            .from("user_roles")
            .select("role")
            .eq("user_id", invitedUserId)
            .maybeSingle();

        if (existingRoleError) {
            console.error("Error checking existing role:", existingRoleError);
        }

        if (existingRole) {
            console.log(`Existing role found: ${existingRole.role}. Updating if different from: ${role}`);
            if (existingRole.role !== role) {
                const { error: updateError } = await supabaseClient
                    .from("user_roles")
                    .update({ role })
                    .eq("user_id", invitedUserId);
                if (updateError) console.error("Update role error:", updateError);
            }
        } else {
            console.log(`No existing role. Inserting: ${role}`);
            const { error: insertError } = await supabaseClient
                .from("user_roles")
                .insert({ user_id: invitedUserId, role });
            if (insertError) console.error("Insert role error:", insertError);
        }

        return new Response(JSON.stringify({ message: "User invited successfully", user: inviteData.user }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Catch error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
