export type StrategyTemplateDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type StrategyTemplate = {
  id: string;
  strategyName: string;
  category: string;
  marketType: string;
  timeframe: string;
  strategyStyle: string;
  difficulty: StrategyTemplateDifficulty;
  entryRules: string;
  exitRules: string;
  stopLossRules: string;
  takeProfitRules: string;
  riskRules: string;
  checklistFocus: string[];
  commonMistakes: string[];
  notes: string;
};

export const strategyTemplateCategories = [
  "Trend Following",
  "Pullback Entry",
  "Breakout Trading",
  "Reversal Trading",
  "Support and Resistance",
  "Fibonacci Strategy",
  "RSI Strategy",
  "Price Action",
  "Scalping",
  "Swing Trading",
  "News Avoidance / Risk Control",
  "Custom Template",
];

export const strategyTemplateFilterChips = [
  "All",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Scalping",
  "Intraday",
  "Swing",
  "XAUUSD suitable",
  "Forex suitable",
  "Crypto suitable",
];

export const strategyTemplates: StrategyTemplate[] = [
  {
    id: "trend-pullback-continuation",
    strategyName: "Trend Pullback Continuation",
    category: "Trend Following",
    marketType: "Forex, Gold, Crypto, Indices",
    timeframe: "M15, M30, H1, H4",
    strategyStyle: "Trend Following / Pullback",
    difficulty: "Beginner",
    entryRules: rules([
      "Identify clear bullish or bearish market structure.",
      "Wait for price to pull back into a key area.",
      "Confirm that trend direction is still valid.",
      "Enter only after rejection candle, strong close, or confirmation candle.",
      "Avoid entry when price is in the middle of range.",
    ]),
    exitRules: rules([
      "Exit partial position at first key level if user uses partial close.",
      "Exit full position when price reaches planned take profit.",
      "Exit early only if trade idea becomes invalid.",
    ]),
    stopLossRules: rules([
      "For buy setup, stop loss should be below pullback low or invalidation area.",
      "For sell setup, stop loss should be above pullback high or invalidation area.",
      "Stop loss must be planned before entry.",
    ]),
    takeProfitRules: rules([
      "Target previous high for buy setup.",
      "Target previous low for sell setup.",
      "Prefer minimum risk reward ratio based on user settings.",
    ]),
    riskRules: rules([
      "Use fixed risk amount or risk percentage.",
      "Do not increase lot size after loss.",
      "Avoid trade if stop loss is too wide for allowed risk.",
    ]),
    checklistFocus: [
      "Trend confirmed",
      "Key level confirmed",
      "Entry reason confirmed",
      "Stop loss planned",
      "Take profit planned",
      "No revenge trade",
      "No overlot",
    ],
    commonMistakes: [
      "Entering too early during pullback",
      "Buying at resistance",
      "Selling at support",
      "Ignoring trend change",
      "Moving stop loss",
    ],
    notes: educationalNote("Use this as a structured pullback review template, then adapt the rules to the market and timeframe you actually journal."),
  },
  {
    id: "breakout-and-retest",
    strategyName: "Breakout and Retest",
    category: "Breakout Trading",
    marketType: "Forex, Gold, Crypto, Indices",
    timeframe: "M15, M30, H1",
    strategyStyle: "Breakout Trading",
    difficulty: "Intermediate",
    entryRules: rules([
      "Mark clear support or resistance.",
      "Wait for strong breakout candle.",
      "Do not enter immediately if breakout is unclear.",
      "Wait for retest of broken level.",
      "Enter only when retest shows rejection or continuation confirmation.",
    ]),
    exitRules: rules([
      "Exit at next support or resistance zone.",
      "Exit if price returns strongly back inside the broken range.",
    ]),
    stopLossRules: rules([
      "For buy breakout, stop loss below retest area.",
      "For sell breakout, stop loss above retest area.",
      "Stop loss must not be placed randomly.",
    ]),
    takeProfitRules: rules([
      "Target next major level.",
      "Use minimum RR from risk settings.",
      "Avoid trade if target is too close.",
    ]),
    riskRules: rules([
      "Reduce risk during high volatility.",
      "Avoid breakout entries before major news.",
      "Avoid chasing price after breakout candle has moved too far.",
    ]),
    checklistFocus: ["Key level confirmed", "Entry reason confirmed", "News checked", "Stop loss planned", "Risk amount accepted"],
    commonMistakes: ["Chasing breakout", "Entering fake breakout", "No retest confirmation", "Stop loss too tight", "Ignoring news"],
    notes: educationalNote("Designed for journaling planned breakout behavior, not for chasing live candles."),
  },
  {
    id: "support-resistance-rejection",
    strategyName: "Support and Resistance Rejection",
    category: "Support and Resistance",
    marketType: "Forex, Gold, Crypto, Indices",
    timeframe: "M15, M30, H1, H4",
    strategyStyle: "Price Action",
    difficulty: "Beginner",
    entryRules: rules([
      "Identify strong support or resistance.",
      "Wait for price to reach the level.",
      "Look for rejection candle or failed breakout.",
      "Enter only after confirmation candle.",
      "Avoid trading weak or untested levels.",
    ]),
    exitRules: rules(["Exit at opposite key level.", "Exit if price closes strongly beyond the level."]),
    stopLossRules: rules([
      "Buy setup stop loss below support.",
      "Sell setup stop loss above resistance.",
      "Stop loss should be placed beyond invalidation area.",
    ]),
    takeProfitRules: rules(["Target next support or resistance.", "Minimum RR should follow user settings."]),
    riskRules: rules([
      "Do not enter if stop loss distance is too large.",
      "Do not force trade when level is unclear.",
      "Avoid entering during low liquidity if spreads are high.",
    ]),
    checklistFocus: ["Key level confirmed", "Entry reason confirmed", "Stop loss planned", "Take profit planned", "Emotion stable"],
    commonMistakes: ["Entering before price reaches level", "Trading weak levels", "Ignoring breakout confirmation", "Moving stop loss", "Taking trade because of FOMO"],
    notes: educationalNote("Use this to document level quality, confirmation, invalidation, and emotional discipline."),
  },
  {
    id: "liquidity-sweep-reversal",
    strategyName: "Liquidity Sweep Reversal",
    category: "Reversal Trading",
    marketType: "Gold, Forex, Crypto, Indices",
    timeframe: "M5, M15, M30, H1",
    strategyStyle: "Reversal / Liquidity Sweep",
    difficulty: "Advanced",
    entryRules: rules([
      "Identify previous high or previous low.",
      "Wait for price to sweep that level.",
      "Confirm rejection after sweep.",
      "Enter only after market shows reversal confirmation.",
      "Avoid entry if sweep continues strongly without rejection.",
    ]),
    exitRules: rules(["Exit at opposite liquidity area or key level.", "Exit if reversal structure fails."]),
    stopLossRules: rules([
      "For buy setup, stop below swept low.",
      "For sell setup, stop above swept high.",
      "Stop loss must be placed beyond invalidation area.",
    ]),
    takeProfitRules: rules([
      "Target internal structure level first.",
      "Final target can be opposite liquidity area.",
      "Avoid trade if RR is below minimum setting.",
    ]),
    riskRules: rules([
      "Use smaller risk because reversal trades can fail fast.",
      "Do not enter without confirmation.",
      "Avoid high-impact news unless user accepts risk.",
    ]),
    checklistFocus: ["Key level confirmed", "Entry reason confirmed", "News checked", "Stop loss planned", "No revenge trade", "Emotion stable"],
    commonMistakes: ["Catching falling knife", "Entering before sweep confirms", "Ignoring strong trend", "Overlotting reversal setup", "No stop loss"],
    notes: educationalNote("Advanced reversal template for review discipline. It is not a prompt to trade against strong movement."),
  },
  {
    id: "fibonacci-pullback-rsi-8",
    strategyName: "Fibonacci Pullback with RSI 8 Confirmation",
    category: "Fibonacci Strategy",
    marketType: "Gold, Forex, Crypto, Indices",
    timeframe: "M5, M15, M30, H1, H4",
    strategyStyle: "Fibonacci / RSI Confirmation",
    difficulty: "Intermediate",
    entryRules: rules([
      "Identify latest valid swing high and swing low.",
      "Draw Fibonacci from swing low to swing high for bullish setup.",
      "Draw Fibonacci from swing high to swing low for bearish setup.",
      "Wait for price to pull back into planned Fibonacci zone.",
      "Use RSI 8 as confirmation.",
      "For bullish setup, RSI 8 should show recovery or strength.",
      "For bearish setup, RSI 8 should show weakness.",
      "Enter only after candle confirmation.",
    ]),
    exitRules: rules(["Exit at planned Fibonacci extension or previous structure level.", "Exit if RSI and price action invalidate the setup."]),
    stopLossRules: rules(["Stop loss should be beyond the swing invalidation point.", "Do not place stop loss inside normal pullback area."]),
    takeProfitRules: rules(["Target previous swing high for bullish setup.", "Target previous swing low for bearish setup.", "Optional target at Fibonacci extension if user uses extension targets."]),
    riskRules: rules(["Avoid entry if RR is below minimum setting.", "Avoid overlotting when stop loss is wide.", "Do not enter only because price touched Fibonacci level."]),
    checklistFocus: ["Trend confirmed", "Key level confirmed", "Entry reason confirmed", "Stop loss planned", "Risk amount accepted", "Emotion stable"],
    commonMistakes: ["Drawing Fibonacci on wrong swing", "Entering without confirmation", "Ignoring RSI weakness", "Moving stop loss", "Chasing price"],
    notes: educationalNote("Use this template to journal whether confluence was present before entry."),
  },
  {
    id: "rsi-8-momentum-continuation",
    strategyName: "RSI 8 Momentum Continuation",
    category: "RSI Strategy",
    marketType: "Forex, Gold, Crypto",
    timeframe: "M5, M15, M30, H1",
    strategyStyle: "Momentum / RSI",
    difficulty: "Intermediate",
    entryRules: rules([
      "Identify market direction first.",
      "Use RSI 8 to confirm momentum.",
      "For bullish bias, RSI 8 should hold strength above neutral area.",
      "For bearish bias, RSI 8 should hold weakness below neutral area.",
      "Enter after price action confirms continuation.",
      "Avoid entering when RSI is choppy and price is ranging.",
    ]),
    exitRules: rules(["Exit when momentum weakens.", "Exit at key level or planned take profit.", "Avoid holding if setup condition disappears."]),
    stopLossRules: rules(["Stop loss should be behind recent structure.", "Do not use random fixed stop loss without structure."]),
    takeProfitRules: rules(["Target nearby key level.", "Use minimum RR from settings.", "Avoid trade if target is too close."]),
    riskRules: rules(["Avoid overtrading during sideways RSI movement.", "Avoid adding positions after loss.", "Reduce risk if market is unclear."]),
    checklistFocus: ["Trend confirmed", "Entry reason confirmed", "Stop loss planned", "Take profit planned", "No revenge trade"],
    commonMistakes: ["Buying overextended move", "Selling overextended move", "Ignoring market structure", "Entering during range", "Chasing price"],
    notes: educationalNote("Use this to evaluate whether RSI confirmed structure or only justified an impulse entry."),
  },
  {
    id: "simple-moving-average-trend",
    strategyName: "Simple Moving Average Trend Setup",
    category: "Trend Following",
    marketType: "Forex, Gold, Crypto, Indices",
    timeframe: "M15, M30, H1, H4",
    strategyStyle: "Trend Following",
    difficulty: "Beginner",
    entryRules: rules([
      "Use moving averages to identify trend direction.",
      "Buy only when price is above trend moving average and structure supports bullish bias.",
      "Sell only when price is below trend moving average and structure supports bearish bias.",
      "Wait for pullback and confirmation.",
      "Avoid trades when moving averages are flat or tangled.",
    ]),
    exitRules: rules(["Exit at key level or when trend structure weakens.", "Exit if price closes against trend setup."]),
    stopLossRules: rules(["Stop loss behind recent swing or structure.", "Do not place stop loss too close to moving average noise."]),
    takeProfitRules: rules(["Target next key level.", "Follow minimum RR setting."]),
    riskRules: rules(["Avoid trading when market is ranging.", "Avoid entry if moving averages show no direction.", "Do not overlot after multiple losses."]),
    checklistFocus: ["Trend confirmed", "Entry reason confirmed", "Stop loss planned", "Risk amount accepted", "Emotion stable"],
    commonMistakes: ["Trading flat moving averages", "Entering late", "Ignoring support and resistance", "Overtrading every crossover", "Moving stop loss"],
    notes: educationalNote("Beginner-friendly structure for logging trend quality and avoiding crossover overtrading."),
  },
  {
    id: "range-high-low-setup",
    strategyName: "Range High / Range Low Setup",
    category: "Price Action",
    marketType: "Forex, Gold, Crypto",
    timeframe: "M5, M15, M30, H1",
    strategyStyle: "Range Trading",
    difficulty: "Intermediate",
    entryRules: rules([
      "Identify clear range high and range low.",
      "Buy near range low only after rejection.",
      "Sell near range high only after rejection.",
      "Avoid entering in the middle of the range.",
      "Stop trading range setup when breakout is confirmed.",
    ]),
    exitRules: rules(["Exit near opposite side of range.", "Exit if price breaks and closes outside range strongly."]),
    stopLossRules: rules(["Buy stop loss below range low.", "Sell stop loss above range high.", "Stop must be outside invalidation area."]),
    takeProfitRules: rules(["Target middle of range for safer exit.", "Target opposite range level for full exit.", "Follow minimum RR setting."]),
    riskRules: rules(["Avoid range trading during strong trend.", "Avoid range trading during major news.", "Do not add more trades inside same range without plan."]),
    checklistFocus: ["Key level confirmed", "Entry reason confirmed", "Stop loss planned", "Take profit planned", "News checked"],
    commonMistakes: ["Entering middle of range", "Ignoring breakout", "Trading range during trend", "Stop loss too tight", "FOMO after missed entry"],
    notes: educationalNote("Use this to document whether the market was genuinely ranging before entry."),
  },
  {
    id: "london-new-york-session-continuation",
    strategyName: "London / New York Session Continuation",
    category: "Scalping",
    marketType: "Forex, Gold, Indices",
    timeframe: "M5, M15, M30",
    strategyStyle: "Session Momentum",
    difficulty: "Advanced",
    entryRules: rules([
      "Mark Asian session high and low if relevant.",
      "Wait for London or New York session direction.",
      "Confirm breakout, retest, or continuation setup.",
      "Avoid random entry during session volatility.",
      "Enter only after clear confirmation.",
    ]),
    exitRules: rules(["Exit at session key level.", "Exit before major news if risk is high.", "Exit if momentum disappears."]),
    stopLossRules: rules(["Stop loss behind session structure.", "Avoid placing stop too close during high volatility."]),
    takeProfitRules: rules(["Target next intraday key level.", "Use planned RR.", "Avoid unrealistic targets during slow session."]),
    riskRules: rules(["Reduce risk during volatile session open.", "Avoid revenge trade after first loss.", "Maximum trades per day should be respected."]),
    checklistFocus: ["News checked", "Trend confirmed", "Entry reason confirmed", "Risk amount accepted", "No revenge trade", "No overlot"],
    commonMistakes: ["Overtrading session open", "Chasing fast candle", "Ignoring news", "Revenge trade after loss", "Taking too many trades per day"],
    notes: educationalNote("For journaling session behavior and discipline. It does not use live session timing or broker data."),
  },
  {
    id: "risk-first-a-plus-only",
    strategyName: "Risk-First A+ Setup Only",
    category: "News Avoidance / Risk Control",
    marketType: "All markets",
    timeframe: "All timeframes",
    strategyStyle: "Discipline / Risk Management",
    difficulty: "Beginner",
    entryRules: rules([
      "Only trade when checklist score is 80% or higher.",
      "Only trade when RR meets minimum setting.",
      "Only trade when risk amount is within allowed risk rule.",
      "Only trade when ruleFollowed can be marked Yes.",
      "Skip trade if emotional state is unstable.",
    ]),
    exitRules: rules(["Follow planned exit.", "Do not exit early without valid reason.", "Record lesson after trade."]),
    stopLossRules: rules(["Stop loss must be set before entry.", "Never move stop loss further away after entry."]),
    takeProfitRules: rules(["Take profit must be planned before entry.", "Target must justify the risk."]),
    riskRules: rules([
      "Maximum risk per trade must follow settings.",
      "Stop trading after daily loss limit.",
      "Stop trading after max losing streak warning.",
      "Do not overlot.",
    ]),
    checklistFocus: ["All checklist items", "Rule followed", "Risk amount accepted", "Emotion stable"],
    commonMistakes: ["Taking B setup", "Ignoring risk limit", "Trading without screenshot", "Trading without notes", "Revenge trading"],
    notes: educationalNote("A discipline template for simplifying strategy selection and reviewing execution quality."),
  },
];

function rules(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function educationalNote(extra: string) {
  return `${extra}\nEducational template only. Edit it before using if it does not match your plan. This is not a trade signal and does not promise profit.`;
}
