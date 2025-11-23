import bcrypt from "bcryptjs";
import { supabaseServer as supabase } from "./supabase-server";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  role: "master" | "admin";
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
}

export async function loginAdmin(
  username: string,
  password: string
): Promise<AdminUser | null> {
  try {
    // Fetch admin user by username
    const { data: adminUser, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .eq("is_active", true)
      .single();

    if (error || !adminUser) {
      return null;
    }

    console.log("password", adminUser.password_hash);
    // Verify password
    const passwordMatch = await bcrypt.compare(
      password,
      adminUser.password_hash
    );

    if (!passwordMatch) {
      return null;
    }

    // Update last login time
    await supabase
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", adminUser.id);

    // Log activity
    await logAdminActivity(adminUser.id, "login", null, null, {
      success: true,
    });

    return {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      full_name: adminUser.full_name,
      role: adminUser.role,
      is_active: adminUser.is_active,
      created_at: adminUser.created_at,
      last_login_at: adminUser.last_login_at,
    };
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function createAdminUser(
  creatorId: string,
  username: string,
  email: string,
  password: string,
  fullName: string,
  role: "admin" | "master" = "admin"
) {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const { data, error } = await supabase
      .from("admin_users")
      .insert({
        username,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role,
        created_by: creatorId,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await logAdminActivity(
      creatorId,
      "create_admin_user",
      "admin_user",
      data.id,
      {
        username,
        email,
        role,
      }
    );

    return data;
  } catch (error) {
    console.error("Create admin user error:", error);
    throw error;
  }
}

export async function resetAdminPassword(
  masterAdminId: string,
  targetAdminId: string,
  newPassword: string
) {
  try {
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update admin password
    const { error } = await supabase
      .from("admin_users")
      .update({ password_hash: passwordHash })
      .eq("id", targetAdminId);

    if (error) throw error;

    // Log activity
    await logAdminActivity(
      masterAdminId,
      "reset_password",
      "admin_user",
      targetAdminId,
      {
        target_admin_id: targetAdminId,
      }
    );

    return true;
  } catch (error) {
    console.error("Reset admin password error:", error);
    throw error;
  }
}

export async function logAdminActivity(
  adminUserId: string,
  action: string,
  resourceType: string | null,
  resourceId: string | null,
  details: any
) {
  try {
    await supabase.from("admin_activity_logs").insert({
      admin_user_id: adminUserId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
    });
  } catch (error) {
    console.error("Log activity error:", error);
  }
}
