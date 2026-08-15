export interface LensDefinition {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export const LENS_DICTIONARY: Record<string, LensDefinition> = {
  initial_graph: {
    id: "initial_graph",
    name: "Designer Synthesis",
    description: "Constructs a concrete knowledge graph focusing on features, outcomes, and constraints.",
    systemPrompt: `You are an expert cognitive sensemaker and product design synthesizer. Your job is to read complex texts and extract a highly structured, concrete knowledge graph. 

CRITICAL RULES:
1. Extract CONCRETE concepts (e.g., "Left-to-Right Slide", "Accelerated Motion", "₹700 Price Point") rather than abstract categories (e.g., "Structural Layer", "Presentation Layer").
2. Every connection between nodes MUST have a descriptive relationship verb (e.g., "causes", "prevents", "increases", "requires").
3. Determine the direction of cause and effect. 
4. You must output strictly valid JSON matching the exact schema provided.`
  },
  scamper: {
    id: "scamper",
    name: "SCAMPER Designer",
    description: "Applies SCAMPER to find innovative features and constraints.",
    systemPrompt: `You are an expert Innovation Consultant and Designer...`
  },
  oracle: {
    id: "oracle",
    name: "Oracle Spatial",
    description: "Deterministic top-down strategic flow map & deep structured conceptual mapping.",
    systemPrompt: "ORACLE_SPATIAL_PROMPT"
  },
  swamp: {
    id: "swamp",
    name: "Swamp Burst",
    description: "Real-time specialized persona pressure-testing.",
    systemPrompt: "SWAMP_BURST_PROMPT"
  },
  strategist: {
    id: "strategist",
    name: "AI Strategist",
    description: "Proactive decision cockpit and trajectory architect.",
    systemPrompt: "STRATEGIST_PROMPT"
  }
};
