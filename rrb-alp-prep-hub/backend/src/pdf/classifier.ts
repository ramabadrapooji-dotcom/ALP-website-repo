import { logger } from '../utils/logger';

export interface ClassificationResult {
  subject: string;
  chapter?: string;
  topic?: string;
  confidence: number;
}

// ─── Keyword Dictionaries ─────────────────────────────────────────────────────
// Each entry: { keywords: string[], weight: number }
// Higher weight = stronger signal

interface KeywordEntry {
  keywords: string[];
  weight: number;
  chapter?: string;
  topic?: string;
}

const SUBJECT_KEYWORDS: Record<string, KeywordEntry[]> = {
  Mathematics: [
    // Number System
    { keywords: ['lcm', 'hcf', 'divisible', 'prime', 'remainder', 'factor', 'multiple', 'digit', 'coprime'], weight: 3, chapter: 'Number System', topic: 'HCF and LCM' },
    { keywords: ['percentage', 'percent', '%', 'discount', 'profit', 'loss', 'cost price', 'selling price', 'marked price'], weight: 3, chapter: 'Arithmetic', topic: 'Profit and Loss' },
    { keywords: ['simple interest', 'compound interest', 's.i', 'c.i', 'rate of interest', 'principal', 'amount'], weight: 3, chapter: 'Arithmetic', topic: 'Simple Interest' },
    { keywords: ['ratio', 'proportion', 'mixture', 'alligation'], weight: 2, chapter: 'Arithmetic', topic: 'Ratio and Proportion' },
    { keywords: ['average', 'mean', 'arithmetic mean'], weight: 2, chapter: 'Arithmetic', topic: 'Averages' },
    { keywords: ['speed', 'distance', 'time', 'km/h', 'm/s', 'train', 'overtake'], weight: 3, chapter: 'Time, Speed, Distance', topic: 'Speed and Distance' },
    { keywords: ['work', 'pipe', 'cistern', 'tap', 'fill', 'empty'], weight: 3, chapter: 'Time, Speed, Distance', topic: 'Time and Work' },
    { keywords: ['boat', 'stream', 'upstream', 'downstream'], weight: 3, chapter: 'Time, Speed, Distance', topic: 'Boats and Streams' },
    { keywords: ['angle', 'triangle', 'circle', 'polygon', 'quadrilateral', 'square', 'rectangle', 'parallel', 'perpendicular'], weight: 2, chapter: 'Geometry' },
    { keywords: ['area', 'perimeter', 'volume', 'surface area', 'cube', 'cylinder', 'sphere', 'cone', 'hemisphere'], weight: 3, chapter: 'Mensuration' },
    { keywords: ['sin', 'cos', 'tan', 'cot', 'sec', 'cosec', 'trigonometry', 'height', 'elevation', 'depression'], weight: 3, chapter: 'Trigonometry' },
    { keywords: ['equation', 'polynomial', 'algebraic', 'linear', 'quadratic', 'identity', 'expression'], weight: 2, chapter: 'Algebra' },
    { keywords: ['bar graph', 'pie chart', 'line graph', 'histogram', 'median', 'mode', 'data'], weight: 2, chapter: 'Statistics and Data Interpretation' },
    { keywords: ['fraction', 'decimal', 'bodmas', 'simplify', 'number', 'integer'], weight: 1, chapter: 'Number System' },
  ],

  Reasoning: [
    { keywords: ['analogy', 'is to', '::', 'as the'], weight: 3, chapter: 'Verbal Reasoning', topic: 'Analogy' },
    { keywords: ['coding', 'decoding', 'code', 'cipher'], weight: 3, chapter: 'Verbal Reasoning', topic: 'Coding-Decoding' },
    { keywords: ['blood relation', 'father', 'mother', 'son', 'daughter', 'brother', 'sister', 'uncle', 'aunt', 'nephew', 'niece'], weight: 3, chapter: 'Verbal Reasoning', topic: 'Blood Relations' },
    { keywords: ['direction', 'north', 'south', 'east', 'west', 'left', 'right', 'turn', 'facing'], weight: 3, chapter: 'Verbal Reasoning', topic: 'Direction Sense' },
    { keywords: ['series', 'next term', 'pattern', 'sequence', 'missing', 'following'], weight: 2, chapter: 'Verbal Reasoning', topic: 'Series Completion' },
    { keywords: ['odd one out', 'different', 'classification', 'group'], weight: 2, chapter: 'Verbal Reasoning', topic: 'Classification' },
    { keywords: ['syllogism', 'conclusion', 'premise', 'all', 'some', 'no', 'statement'], weight: 3, chapter: 'Verbal Reasoning', topic: 'Syllogism' },
    { keywords: ['mirror image', 'water image', 'reflection'], weight: 3, chapter: 'Non-Verbal Reasoning', topic: 'Mirror and Water Images' },
    { keywords: ['venn diagram', 'set', 'intersection', 'union'], weight: 2, chapter: 'Mathematical Reasoning', topic: 'Venn Diagrams' },
    { keywords: ['arrangement', 'sitting', 'seating', 'row', 'circular'], weight: 3, chapter: 'Mathematical Reasoning', topic: 'Seating Arrangement' },
    { keywords: ['puzzle', 'box', 'floor', 'rank', 'order'], weight: 2, chapter: 'Mathematical Reasoning', topic: 'Puzzle' },
    { keywords: ['alphabet', 'letter', 'word', 'alphabetical'], weight: 1, chapter: 'Verbal Reasoning', topic: 'Alphabet Test' },
  ],

  Physics: [
    { keywords: ['velocity', 'acceleration', 'displacement', 'kinematics', 'projectile', 'uniform', 'motion'], weight: 3, chapter: 'Mechanics', topic: 'Motion' },
    { keywords: ['force', 'newton', 'friction', 'momentum', 'inertia', 'mass', 'weight', 'impulse'], weight: 3, chapter: 'Mechanics', topic: "Newton's Laws of Motion" },
    { keywords: ['work', 'energy', 'power', 'kinetic', 'potential', 'joule', 'watt'], weight: 3, chapter: 'Mechanics', topic: 'Work, Energy and Power' },
    { keywords: ['gravity', 'gravitational', 'escape velocity', 'satellite', 'orbit', 'kepler', 'planet'], weight: 3, chapter: 'Mechanics', topic: 'Gravitation' },
    { keywords: ['oscillation', 'pendulum', 'frequency', 'amplitude', 'shm', 'simple harmonic'], weight: 3, chapter: 'Mechanics', topic: 'Simple Harmonic Motion' },
    { keywords: ['sound', 'wave', 'frequency', 'wavelength', 'echo', 'resonance', 'decibel', 'ultrasound'], weight: 2, chapter: 'Mechanics', topic: 'Waves and Sound' },
    { keywords: ['temperature', 'heat', 'thermal', 'celsius', 'fahrenheit', 'kelvin', 'specific heat'], weight: 3, chapter: 'Heat and Thermodynamics' },
    { keywords: ['thermodynamics', 'entropy', 'carnot', 'adiabatic', 'isothermal'], weight: 3, chapter: 'Heat and Thermodynamics', topic: 'Laws of Thermodynamics' },
    { keywords: ['reflection', 'mirror', 'angle of incidence', 'angle of reflection'], weight: 3, chapter: 'Light and Optics', topic: 'Reflection' },
    { keywords: ['refraction', 'snell', 'refractive index', 'critical angle', 'total internal reflection'], weight: 3, chapter: 'Light and Optics', topic: 'Refraction' },
    { keywords: ['lens', 'focal length', 'convex', 'concave', 'image', 'object', 'magnification'], weight: 2, chapter: 'Light and Optics', topic: 'Lenses' },
    { keywords: ['prism', 'dispersion', 'spectrum', 'rainbow', 'scattering'], weight: 2, chapter: 'Light and Optics', topic: 'Dispersion of Light' },
    { keywords: ['ohm', 'resistance', 'current', 'voltage', 'circuit', 'electric', 'ampere', 'volt', 'series', 'parallel'], weight: 3, chapter: 'Electricity and Magnetism', topic: "Ohm's Law" },
    { keywords: ['magnetic', 'electromagnet', 'solenoid', 'magnetic field', 'faraday', 'induction', 'flux'], weight: 3, chapter: 'Electricity and Magnetism', topic: 'Electromagnetic Induction' },
    { keywords: ['radioactive', 'alpha', 'beta', 'gamma', 'half life', 'nuclear', 'fission', 'fusion'], weight: 3, chapter: 'Modern Physics', topic: 'Radioactivity' },
    { keywords: ['photoelectric', 'photon', 'quantum', 'planck', 'x-ray'], weight: 2, chapter: 'Modern Physics', topic: 'Photoelectric Effect' },
  ],

  Chemistry: [
    { keywords: ['atom', 'molecule', 'element', 'compound', 'mixture'], weight: 2, chapter: 'Basic Chemistry' },
    { keywords: ['electron', 'proton', 'neutron', 'nucleus', 'atomic number', 'mass number', 'isotope', 'bohr'], weight: 3, chapter: 'Basic Chemistry', topic: 'Atomic Structure' },
    { keywords: ['ionic bond', 'covalent bond', 'metallic bond', 'electrovalent', 'bond', 'valency'], weight: 3, chapter: 'Basic Chemistry', topic: 'Chemical Bonding' },
    { keywords: ['periodic table', 'periodic law', 'group', 'period', 'alkali', 'halogen', 'noble gas'], weight: 3, chapter: 'Periodic Table' },
    { keywords: ['electronegativity', 'ionization energy', 'atomic radius', 'electron affinity'], weight: 2, chapter: 'Periodic Table', topic: 'Periodic Properties' },
    { keywords: ['acid', 'base', 'salt', 'ph', 'neutralization', 'litmus', 'indicator'], weight: 3, chapter: 'Chemical Reactions', topic: 'Acids, Bases and Salts' },
    { keywords: ['oxidation', 'reduction', 'redox', 'oxidizing', 'reducing'], weight: 3, chapter: 'Chemical Reactions', topic: 'Oxidation and Reduction' },
    { keywords: ['electrolysis', 'electroplating', 'electrode', 'cathode', 'anode', 'electrolyte'], weight: 3, chapter: 'Chemical Reactions', topic: 'Electrolysis' },
    { keywords: ['corrosion', 'rusting', 'galvanization', 'passivation'], weight: 2, chapter: 'Chemical Reactions', topic: 'Corrosion' },
    { keywords: ['carbon', 'hydrocarbon', 'organic', 'methane', 'ethane', 'benzene', 'alcohol', 'polymer'], weight: 3, chapter: 'Organic Chemistry' },
    { keywords: ['metal', 'non-metal', 'alloy', 'iron', 'copper', 'aluminium', 'zinc', 'ore', 'extraction'], weight: 2, chapter: 'Applied Chemistry', topic: 'Metals and Non-metals' },
    { keywords: ['soap', 'detergent', 'saponification', 'emulsification'], weight: 3, chapter: 'Applied Chemistry', topic: 'Soaps and Detergents' },
    { keywords: ['fertilizer', 'nitrogen', 'urea', 'ammonia', 'phosphate'], weight: 2, chapter: 'Applied Chemistry', topic: 'Fertilizers' },
    { keywords: ['fuel', 'combustion', 'petroleum', 'coal', 'biogas', 'lpg', 'cng'], weight: 2, chapter: 'Applied Chemistry', topic: 'Fuels' },
    { keywords: ['mole', 'avogadro', 'molar mass', 'stoichiometry'], weight: 2, chapter: 'Basic Chemistry', topic: 'Mole Concept' },
  ],

  Biology: [
    { keywords: ['cell', 'nucleus', 'membrane', 'mitochondria', 'ribosome', 'organelle', 'cytoplasm', 'chloroplast'], weight: 3, chapter: 'Cell Biology', topic: 'Cell Structure' },
    { keywords: ['mitosis', 'meiosis', 'cell division', 'chromosome', 'dna', 'rna', 'replication'], weight: 3, chapter: 'Cell Biology', topic: 'Cell Division' },
    { keywords: ['digestion', 'stomach', 'intestine', 'enzyme', 'liver', 'pancreas', 'absorption', 'saliva'], weight: 3, chapter: 'Human Biology', topic: 'Digestive System' },
    { keywords: ['heart', 'blood', 'artery', 'vein', 'capillary', 'circulation', 'plasma', 'rbc', 'wbc', 'platelet', 'blood group'], weight: 3, chapter: 'Human Biology', topic: 'Circulatory System' },
    { keywords: ['lung', 'breathing', 'respiration', 'oxygen', 'carbon dioxide', 'trachea', 'bronchi', 'alveoli'], weight: 3, chapter: 'Human Biology', topic: 'Respiratory System' },
    { keywords: ['brain', 'nerve', 'neuron', 'spinal cord', 'reflex', 'nervous system', 'receptor'], weight: 3, chapter: 'Human Biology', topic: 'Nervous System' },
    { keywords: ['kidney', 'urine', 'excretion', 'nephron', 'dialysis', 'bladder'], weight: 3, chapter: 'Human Biology', topic: 'Excretory System' },
    { keywords: ['hormone', 'gland', 'endocrine', 'insulin', 'thyroid', 'adrenaline', 'pituitary'], weight: 3, chapter: 'Human Biology', topic: 'Endocrine System' },
    { keywords: ['bone', 'skeleton', 'joint', 'cartilage', 'marrow', 'vertebra'], weight: 2, chapter: 'Human Biology', topic: 'Skeletal System' },
    { keywords: ['photosynthesis', 'chlorophyll', 'sunlight', 'glucose', 'carbon dioxide', 'stomata'], weight: 3, chapter: 'Plant Biology', topic: 'Photosynthesis' },
    { keywords: ['heredity', 'genetics', 'mendel', 'dominant', 'recessive', 'allele', 'genotype', 'phenotype'], weight: 3, chapter: 'Genetics and Evolution', topic: "Mendel's Laws" },
    { keywords: ['evolution', 'darwin', 'natural selection', 'adaptation', 'mutation', 'species'], weight: 3, chapter: 'Genetics and Evolution', topic: 'Evolution' },
    { keywords: ['ecosystem', 'food chain', 'food web', 'producer', 'consumer', 'decomposer', 'biodiversity'], weight: 3, chapter: 'Ecology' },
    { keywords: ['pollution', 'environment', 'ozone', 'greenhouse', 'acid rain', 'deforestation'], weight: 2, chapter: 'Ecology', topic: 'Environmental Pollution' },
    { keywords: ['vitamin', 'deficiency', 'scurvy', 'rickets', 'protein', 'carbohydrate', 'nutrition'], weight: 3, chapter: 'Diseases and Health', topic: 'Vitamins and Deficiency Diseases' },
    { keywords: ['disease', 'bacteria', 'virus', 'infection', 'immunity', 'vaccine', 'antibody', 'antigen', 'malaria', 'tuberculosis'], weight: 3, chapter: 'Diseases and Health', topic: 'Communicable Diseases' },
  ],
};

/**
 * Classify a question's subject/topic using keyword matching.
 * Returns the best-scoring subject with chapter and topic.
 */
export function classifyQuestion(questionText: string, options: string[]): ClassificationResult {
  const fullText = `${questionText} ${options.join(' ')}`.toLowerCase();

  const scores: Record<string, { score: number; chapter?: string; topic?: string }> = {};

  for (const [subject, entries] of Object.entries(SUBJECT_KEYWORDS)) {
    let totalScore = 0;
    let bestChapter: string | undefined;
    let bestTopic: string | undefined;
    let bestEntryScore = 0;

    for (const entry of entries) {
      let entryScore = 0;
      for (const keyword of entry.keywords) {
        if (fullText.includes(keyword.toLowerCase())) {
          entryScore += entry.weight;
        }
      }

      totalScore += entryScore;

      if (entryScore > bestEntryScore) {
        bestEntryScore = entryScore;
        bestChapter = entry.chapter;
        bestTopic = entry.topic;
      }
    }

    scores[subject] = {
      score: totalScore,
      chapter: bestChapter,
      topic: bestTopic,
    };
  }

  // Find subject with highest score
  let bestSubject = 'Mathematics';
  let bestScore = 0;

  for (const [subject, result] of Object.entries(scores)) {
    if (result.score > bestScore) {
      bestScore = result.score;
      bestSubject = subject;
    }
  }

  // Confidence based on score strength and separation from second-best
  const sortedScores = Object.values(scores)
    .map((r) => r.score)
    .sort((a, b) => b - a);

  const topScore = sortedScores[0];
  const secondScore = sortedScores[1] ?? 0;
  const separation = topScore - secondScore;

  let confidence = 0;
  if (topScore === 0) {
    confidence = 0;
  } else if (separation >= 6) {
    confidence = 90;
  } else if (separation >= 3) {
    confidence = 75;
  } else if (topScore >= 3) {
    confidence = 60;
  } else {
    confidence = 40;
  }

  const result = scores[bestSubject];

  logger.debug(
    `Classification: "${questionText.slice(0, 50)}..." → ${bestSubject} (score: ${bestScore}, confidence: ${confidence}%)`
  );

  return {
    subject: bestSubject,
    chapter: result?.chapter,
    topic: result?.topic,
    confidence,
  };
}
