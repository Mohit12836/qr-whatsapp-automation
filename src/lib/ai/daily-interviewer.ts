import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Lazy admin client
let _adminClient: SupabaseClient | null = null;
function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    _adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _adminClient;
}

export interface StagedRule {
  id: string;
  account_id: string;
  extracted_entity: string;
  extracted_attribute: string;
  extracted_value: string;
  raw_message_text: string;
}

/**
 * Handles incoming messages from registered store owners for daily knowledge ingestion
 */
export async function handleOwnerInterviewMessage(
  ownerPhone: string,
  messageText: string
): Promise<{ isOwnerMessage: boolean; replyText?: string } | null> {
  const supabase = getAdminClient();
  const normalized = (messageText || "").trim().toLowerCase();

  // 1. Check if sender is a registered account owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id, full_name, user_id")
    .eq("phone", ownerPhone)
    .single();

  if (!profile || !profile.account_id) {
    return { isOwnerMessage: false };
  }

  const accountId = profile.account_id;

  // 2. Check if owner is confirming a pending rule
  if (normalized === "yes" || normalized === "haan" || normalized === "1" || normalized === "confirm" || normalized === "theek hai") {
    const { data: pending } = await supabase
      .from("temp_knowledge_staging")
      .select("*")
      .eq("account_id", accountId)
      .eq("status", "pending_confirmation")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (pending) {
      // Mark as confirmed
      await supabase
        .from("temp_knowledge_staging")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", pending.id);

      // Create permanent AI Knowledge Node
      await supabase.from("ai_knowledge").insert({
        account_id: accountId,
        title: `${pending.extracted_entity} - ${pending.extracted_attribute}`,
        content: `${pending.extracted_entity} ${pending.extracted_attribute}: ${pending.extracted_value}`,
        created_at: new Date().toISOString(),
      });

      return {
        isOwnerMessage: true,
        replyText: `✅ धन्यवाद ${profile.full_name || "सर"}! यह नया नियम आपकी दुकान के AI दिमाग में पक्का (Locked) कर दिया गया है। अब सभी ग्राहकों को यही सही जानकारी मिलेगी।`,
      };
    }
  }

  // 3. Check if owner is rejecting
  if (normalized === "no" || normalized === "nahi" || normalized === "2" || normalized === "cancel" || normalized === "galat") {
    await supabase
      .from("temp_knowledge_staging")
      .update({ status: "rejected" })
      .eq("account_id", accountId)
      .eq("status", "pending_confirmation");

    return {
      isOwnerMessage: true,
      replyText: "❌ ठीक है सर, यह नियम रद्द कर दिया गया है और डेटाबेस में सेव नहीं किया गया।",
    };
  }

  // 4. New rule incoming from owner -> Stage it
  const entity = "Store Policy / Detail";
  const attribute = "Updated Rule";
  const value = messageText;

  await supabase.from("temp_knowledge_staging").insert({
    account_id: accountId,
    sender_phone: ownerPhone,
    raw_message_text: messageText,
    extracted_entity: entity,
    extracted_attribute: attribute,
    extracted_value: value,
    status: "pending_confirmation",
  });

  return {
    isOwnerMessage: true,
    replyText: `📌 **मैंने यह नया नियम नोट कर लिया है:**\n"${messageText}"\n\nक्या मैं इसे आपकी दुकान की AI नॉलेज में पक्का (Lock) कर दूँ? (कृपया **हाँ / YES** या **नहीं / NO** लिखकर पुष्टि करें)`,
  };
}
