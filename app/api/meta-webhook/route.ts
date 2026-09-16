import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Verify Webhook (Required by Meta when setting up the webhook)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // This should match the Verify Token set in the Meta App Dashboard
  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Meta Webhook Verified!");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid token" }, { status: 403 });
}

// Receive Lead Data
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const appSecret = process.env.META_APP_SECRET;

    // 1. Verify Signature (Security Best Practice)
    if (appSecret && signature) {
      const expectedHash = crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");
      const expectedSignature = `sha256=${expectedHash}`;
      
      if (signature !== expectedSignature) {
        console.error("Meta Webhook: Signature mismatch.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else if (!appSecret) {
      console.warn("META_APP_SECRET is not set. Webhook signature is not being verified.");
    }

    const body = JSON.parse(rawBody);

    // Ensure this is a page webhook event
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          // We only care about leadgen events
          if (change.field === "leadgen") {
            const leadgenId = change.value.leadgen_id;
            
            // 2. Fetch lead details from Meta Graph API
            const accessToken = process.env.META_SYSTEM_USER_ACCESS_TOKEN;
            if (!accessToken) {
              console.error("Missing META_SYSTEM_USER_ACCESS_TOKEN");
              return NextResponse.json({ error: "Missing config" }, { status: 500 });
            }

            const response = await fetch(
              `https://graph.facebook.com/v19.0/${leadgenId}?access_token=${accessToken}`
            );
            
            const metaLeadData = await response.json();
            
            if (metaLeadData.error) {
              console.error("Error fetching lead from Meta:", metaLeadData.error);
              continue;
            }

            // 3. Extract specific fields from Meta's field_data array
            const fieldData = metaLeadData.field_data || [];
            
            // Helper function to find a field's value by name
            const getField = (fieldName: string) => {
              const field = fieldData.find((f: { name: string; values: string[] }) => f.name === fieldName);
              return field && field.values.length > 0 ? field.values[0] : "";
            };

            // Map Meta fields (e.g., 'full_name', 'email') to our DB columns
            const studentName = getField("full_name") || getField("first_name") || "";
            const email = getField("email");
            const phone = getField("phone_number");
            
            // 4. Save to database
            await db.insert(leads).values({
              studentName: studentName || "Unknown (Meta Lead)",
              email: email,
              mobileNo: phone,
              source: "Meta Ads",
              // We can map more fields if they exist in your lead form:
              grade: getField("grade") || "",
              parentName: getField("parent_name") || "",
            });

            console.log(`Successfully saved Meta Lead: ${leadgenId}`);
          }
        }
      }
      
      // Meta requires a 200 OK response within 20 seconds to confirm receipt
      return NextResponse.json({ status: "success" }, { status: 200 });
    }

    return NextResponse.json({ status: "ignored" }, { status: 400 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
