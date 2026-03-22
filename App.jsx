// App.jsx

import React, { useState, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator
} from "react-native";

import OpenAI from "openai";
import { OPENAI_API_KEY } from "@env";

// ─── Validate API Key ───────────────────────────────
if (!OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is missing. Add it to your .env file.");
}

// ─── Seasonal Calendar Table Data ─────────────────────
const seasonalCalendar = [
  { month: "January", produce: "Kale, Radishes, Turnips", signature: "Collards"},
  { month: "February", produce: "Kale, Turnips, Carrots", signature: "Collards"},
  { month: "March", produce: "Collards, Asparagus, Kale", signature: "Strawberries"},
  { month: "April", produce: "Asparagus, Lettuce, Blueberries", signature: "Strawberries"},
  { month: "May", produce: "Peaches, Watermelon, Greens", signature: "Blueberries"},
  { month: "June", produce: "Peaches, Watermelon, Tomatoes", signature: "Blueberries"},
  { month: "July", produce: "Peaches, Tomatoes, Okra", signature: "Peaches"},
  { month: "August", produce: "Peaches, Tomatoes, Bell Peppers", signature: "Peaches" },
  { month: "September", produce: "Apples, Pears, Grapes", signature: "Peaches" },
  { month: "October", produce: "Pumpkins, Apples, Sweet Potatoes", signature: "Pumpkins" },
  { month: "November", produce: "Pecans, Cabbage, Kale", signature: "Pecans" },
  { month: "December", produce: "Collards, Citrus, Brussels Sprouts", signature: "Pecans" }
];

// ─── Georgia Signature Crops ─────────────────────
const signatureCrops = [
  "Peaches",
  "Vidalia Onions",
  "Peanuts",
  "Pecans",
  "Blueberries",
  "Watermelon",
  "sweet corn"
];

// ─── Storage / Freshness Data ─────────────────────
const storageGuide = {
  "peaches": "Ripen at room temperature, then refrigerate to extend freshness",
  "tomatoes": "Store at room temperature, avoid refrigeration until fully ripe",
  "bell peppers": "Refrigerate unwashed in a dry bag",
  "strawberries": "Keep dry in refrigerator, do not wash until use",
  "blueberries": "Refrigerate and keep dry",
  "spinach": "Refrigerate in airtight container with paper towel",
  "cabbage": "Wrap and refrigerate",
  "apples": "Store in refrigerator crisper drawer",
  "grapes": "Keep refrigerated unwashed",
  "carrots": "Refrigerate in sealed container",
  "onions": "Store in cool, dry, ventilated place",
  "vidalia onions": "Store in cool, dry place away from moisture",
  "peanuts": "Store in airtight container in cool place",
  "kale": "Refrigerate in plastic bag with air holes",
  "collards": "Refrigerate in plastic bag with air holes",
  "asparagus": "Trim ends and stand in water in refrigerator",
  "lettuce": "Refrigerate in airtight container with paper towel",
  "watermelon": "Store whole at room temperature, cut pieces in refrigerator",
  "okra": "Refrigerate in paper bag or wrapped in paper towel",
  "pumpkins": "Store whole in cool, dry place; refrigerate cut pieces",
  "pecans": "Store in airtight container in cool place",
  "citrus": "Refrigerate in crisper drawer or on counter for short term",
  "brussels sprouts": "Refrigerate in plastic bag with air holes",
  "turnips": "Refrigerate in plastic bag in crisper drawer",
  "radishes": "Refrigerate in plastic bag with tops removed",
  "sweet potatoes": "Store in cool, dark, well-ventilated place",
  "sweet corn": "Refrigerate in husk or plastic bag"
};

// ─── Agent Configuration ───────────────────────────
const AGENT_CONFIG = {
  model: "gpt-4o-mini",
  persona: `
You are HarvestGA, a Georgia farm-to-table guide. 

Your knowledge is strictly limited to Georgia's agricultural ecosystem, seasonal produce, local farmers markets, and recipes using Georgia ingredients. Always provide clear, structured responses using bullet points for lists.

Instructions:
- Farmers Markets: Provide names, city/region, typical operating days. Only Georgia markets.
- Recipes: Suggest recipes using Georgia produce. Include ingredients, steps, serving size, and dietary filters if requested (vegetarian, vegan, gluten-free).
- Out-of-Scope Queries: Respond with: "I'm your Georgia farm-to-table guide! I can help you find local Georgia farmers markets, seasonal produce, and recipes using fresh Georgia ingredients."

Keep responses concise and clear.
`
};

// ─── OpenAI Client ───────────────────────────────
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// ─── Agent Execution Function ─────────────────────
// ─── Agent Execution Function ─────────────────────
// ─── Agent Execution Function ─────────────────────
async function runHarvestAgent(userQuery) {
  const now = new Date();
  const currentMonth = now.toLocaleString("default", { month: "long" });
  const lowerQuery = userQuery.toLowerCase();// ─────────────────────────────────────────────
// 📅 INTENT DETECTION (CLEARLY SEPARATED)
// ─────────────────────────────────────────────

// Current month data
const currentMonthData = seasonalCalendar.find(m => m.month === currentMonth);

// Season mapping
const seasons = {
  winter: ["December", "January", "February"],
  spring: ["March", "April", "May"],
  summer: ["June", "July", "August"],
  fall: ["September", "October", "November"]
};

// Detect intents
const isMonthQuery =
  lowerQuery.includes("this month") ||
  lowerQuery.includes("current month");

const isSeasonQuery =
  lowerQuery.includes("season") ||
  lowerQuery.includes("in season");

const isCalendarQuery =
  lowerQuery.includes("calendar") ||
  lowerQuery.includes("full calendar") ||
  lowerQuery.includes("year");



// ─────────────────────────────────────────────
// 📌 1. CURRENT MONTH ONLY
// ─────────────────────────────────────────────
if (isMonthQuery) {
  return `
📍 ${currentMonth} Produce in Georgia
────────────────────────
• Produce: ${currentMonthData.produce}
• Signature: ${currentMonthData.signature}
`;
}

// ─────────────────────────────────────────────
// 📌 2. CURRENT SEASON ONLY
// ─────────────────────────────────────────────
if (isSeasonQuery && !isCalendarQuery) {
  // figure out current season
  let currentSeason = "";
  for (const [season, months] of Object.entries(seasons)) {
    if (months.includes(currentMonth)) {
      currentSeason = season;
      break;
    }
  }

  let output = `🌿 ${currentSeason.toUpperCase()} Produce in Georgia\n`;

  seasons[currentSeason].forEach(month => {
    const data = seasonalCalendar.find(m => m.month === month);
    output += `

${month}
────────────────────────
• Produce: ${data.produce}
• Signature: ${data.signature}
`;
  });

  return output;
}

// ─────────────────────────────────────────────
// 📌 3. FULL CALENDAR
// ─────────────────────────────────────────────
if (isCalendarQuery) {
  let output = "📅 Georgia Seasonal Produce Calendar\n";

  seasonalCalendar.forEach(item => {
    const isCurrent = item.month === currentMonth;

    output += `

${isCurrent ? "⭐ " : ""}${item.month}
────────────────────────
• Produce: ${item.produce}
• Signature: ${item.signature}
• Storage Tips: ${item.tips}
`;
  });

  output += `\n⭐ = Current Month (${currentMonth})`;

  return output;
}



// ─────────────────────────────────────────────
// 🍑 GEORGIA SIGNATURE PRODUCE
// ─────────────────────────────────────────────
const isSignatureQuery =
  lowerQuery.includes("signature") ||
  lowerQuery.includes("famous") ||
  lowerQuery.includes("known for") ||
  lowerQuery.includes("what is georgia known for") ||
  lowerQuery.includes("main crop") ||
  lowerQuery.includes("top crop");

if (isSignatureQuery) {
  return `
🍑 Georgia Signature Produce
────────────────────────
${signatureCrops.map(item => `• ${item}`).join("\n")}
`;
}
// ─────────────────────────────────────────────
// 🧊 STORAGE / FRESHNESS QUERY (NEW SYSTEM)
// ─────────────────────────────────────────────
const isStorageQuery =
  lowerQuery.includes("store") ||
  lowerQuery.includes("storage") ||
  lowerQuery.includes("keep") ||
  lowerQuery.includes("fresh") ||
  lowerQuery.includes("preserve");

// Extract produce from {produce}
const matchProduce = userQuery.match(/\{([^}]+)\}/);

let detectedProduce = [];

// 1️⃣ If {braces} used
if (matchProduce) {
  detectedProduce = matchProduce[1]
    .toLowerCase()
    .split(",")
    .map(p => p.trim());
} else {
  // 2️⃣ Detect from sentence
  Object.keys(storageGuide).forEach(item => {
    if (lowerQuery.includes(item)) {
      detectedProduce.push(item);
    }
  });
}

// 3️⃣ If storage query → return results
if (isStorageQuery) {
  if (detectedProduce.length === 0) {
    return `⚠️ No storage info available for that item. Try a Georgia-grown produce item.`;
  }

  let output = "🧊 Storage Tips\n────────────────────────";

  detectedProduce.forEach(item => {
    const tip = storageGuide[item];

    if (tip) {
      output += `\n• ${item}: ${tip}`;
    } else {
      output += `\n• ${item}: ⚠️ No storage info available`;
    }
  });

  return output;
}

// ─────────────────────────────────────────────
// 🧺 FARMERS MARKET QUERY 
// ─────────────────────────────────────────────
const isMarketQuery =
  lowerQuery.includes("market") ||
  lowerQuery.includes("farmers market") ||
  lowerQuery.includes("farm stand");

// Extract city after "in ___"
let locationMatch = lowerQuery.match(/in ([a-z\s]+)/);
let location = locationMatch ? locationMatch[1].trim() : "Georgia";

if (isMarketQuery) {
  const response = await client.responses.create({
    model: AGENT_CONFIG.model,
    input: `
${AGENT_CONFIG.persona}

User is searching for farmers markets.

Location: ${location}

STRICT OUTPUT FORMAT (DO NOT DEVIATE):

For EACH market, use this exact structure:

Market Name (City, GA)
• Days/Hours: 
• Location: 
• Common Items & Prices:
  - Tomatoes: $X–$X per lb
  - Peaches: $X–$X per lb
  - Lettuce: $X–$X per head
  - Eggs: $X–$X per dozen

RULES:
- You MUST include a "Common Items & Prices" section for EVERY market
- Prices MUST include units (per lb, per dozen, per item)
- Do NOT skip prices under any circumstances
- Use realistic Georgia farmers market pricing
- If exact data is unknown, estimate based on typical Georgia market prices

Return 2–4 markets near the location.

User Query: ${userQuery}
`
  });

  return response.output_text ?? "⚠️ No market data found.";
}

  // ✅ Detect recipe-related queries
  let isRecipeQuery =
    lowerQuery.includes("recipe") ||
    lowerQuery.includes("cook") ||
    lowerQuery.includes("meal") ||
    lowerQuery.includes("dish") ||
    lowerQuery.includes("another") ||
    lowerQuery.includes("something similar") ||
    lowerQuery.includes("more like this");
    

  // ── Recipes & everything else handled by AI

  // 1️⃣ Start with current month produce
  let produceList = Object.keys(storageGuide).join(", ");

  // 2️⃣ Check for explicit braces in user query
  const match = userQuery.match(/\{([^}]+)\}/);
  if (match) {
    produceList = match[1];
  } else {
    // 3️⃣ Detect ingredients mentioned in query
    const allProduce = Object.keys(storageGuide);

    const detectedIngredients = [];
    allProduce.forEach(p => {
      if (lowerQuery.includes(p)) detectedIngredients.push(p);
    });

    // 4️⃣ Add custom aliases not in calendar
    if (lowerQuery.includes("vidalia onion")) detectedIngredients.push("Vidalia Onions");
    if (lowerQuery.includes("onion")) detectedIngredients.push("Onions");
    if (lowerQuery.includes("peanut")) detectedIngredients.push("Peanuts");

    // 5️⃣ Use detected ingredients if any
    if (detectedIngredients.length > 0) {
      // Remove duplicates and join
      produceList = [...new Set(detectedIngredients)].join(", ");
      // Mark query as recipe if ingredients detected
      isRecipeQuery = true;
    }
  }

  // 6️⃣ Call OpenAI
  const response = await client.responses.create({
    model: AGENT_CONFIG.model,
    input: `
${AGENT_CONFIG.persona}

Current Month: ${currentMonth}
Current Produce to Use: ${produceList}

Instructions:
- ALWAYS generate recipes using the specified produce list.
- If the user asks for another or similar recipe, generate a DIFFERENT recipe using the same ingredients.

User: ${userQuery}
`,
  });

  return response.output_text ?? "⚠️ No response received.";
}

// ─── App Component ────────────────────────────────
export default function App() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const handleSend = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setPrompt("");
    setLoading(true);

    try {
      const agentReply = await runHarvestAgent(trimmed);
      const assistantMsg = { role: "assistant", text: agentReply };
      setMessages(prev => [...prev, assistantMsg]);

      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error("Agent error:", err);
      setMessages(prev => [
        ...prev,
        { role: "assistant", text: "⚠️ Error contacting AI." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🍑 HarvestGA</Text>
        <Text style={styles.headerSub}>Your Georgia Farm-to-Table Guide</Text>
      </View>

      {/* Chat Area */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((msg, idx) => (
          <View
            key={idx}
            style={[
              styles.bubbleWrapper,
              msg.role === "user" ? styles.bubbleRight : styles.bubbleLeft
            ]}
          >
            <Text style={styles.bubbleLabel}>
              {msg.role === "user" ? "You" : "HarvestGA"}
            </Text>
            <View
              style={[
                styles.bubble,
                msg.role === "user" ? styles.userBubble : styles.agentBubble
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === "user" ? styles.userBubbleText : styles.agentBubbleText
                ]}
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#00f5c4" />
            <Text style={styles.loadingText}>HarvestGA is typing...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask about Georgia produce, markets, or recipes..."
          placeholderTextColor="#454343"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.sendBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2c3131", paddingTop: Platform.OS === "android" ? 30 : 0 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(64, 177, 154, 0.15)" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#e2e8f0" },
  headerSub: { fontSize: 12, color: "#00f5c4", marginTop: 2 },
  chatArea: { flex: 1 },
  chatContent: { padding: 16, flexGrow: 1 },
  bubbleWrapper: { marginBottom: 12, maxWidth: "80%" },
  bubbleLeft: { alignSelf: "flex-start" },
  bubbleRight: { alignSelf: "flex-end" },
  bubbleLabel: { fontSize: 11, color: "#ffffff", marginBottom: 4 },
  bubble: { borderRadius: 16, padding: 12 },
  userBubble: { backgroundColor: "#F4A261", borderBottomRightRadius: 4 },
  agentBubble: { alignSelf: "flex-start", backgroundColor: "#81a88d", borderWidth: 1, borderColor: "rgba(0,245,196,0.2)", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15 },
  userBubbleText: { color: "#01040c", fontWeight: "500" },
  agentBubbleText: { color: "#000000" },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "rgba(0,245,196,0.15)" },
  input: { flex: 1, backgroundColor: "#81a88d", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: "#000000", fontSize: 15, },
  sendBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#F4A261", alignItems: "center", justifyContent: "center", marginLeft: 10 },
  sendBtnText: { fontSize: 20, color: "#050810", fontWeight: "700" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  loadingText: { color: "#64748b", fontStyle: "italic" }
});