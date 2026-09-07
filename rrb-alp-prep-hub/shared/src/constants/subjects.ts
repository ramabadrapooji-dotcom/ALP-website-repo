// ─── Subject Definitions ──────────────────────────────────────────────────────
export const SUBJECTS = [
  'Mathematics',
  'Reasoning',
  'Physics',
  'Chemistry',
  'Biology',
] as const;

export type SubjectName = typeof SUBJECTS[number];

// ─── Chapter → Topic → Subtopic Hierarchy ─────────────────────────────────────
export interface SubtopicDef {
  name: string;
}

export interface TopicDef {
  name: string;
  subtopics?: SubtopicDef[];
}

export interface ChapterDef {
  name: string;
  topics: TopicDef[];
}

export interface SubjectDef {
  name: SubjectName;
  shortCode: string;
  color: string;         // CSS color for UI
  icon: string;          // emoji or icon name
  chapters: ChapterDef[];
}

// ─── Full Curriculum ──────────────────────────────────────────────────────────
export const CURRICULUM: SubjectDef[] = [
  {
    name: 'Mathematics',
    shortCode: 'MATH',
    color: '#6366f1',
    icon: '📐',
    chapters: [
      {
        name: 'Number System',
        topics: [
          { name: 'Natural Numbers', subtopics: [{ name: 'Divisibility Rules' }, { name: 'Prime Numbers' }] },
          { name: 'HCF and LCM', subtopics: [{ name: 'HCF by Division Method' }, { name: 'LCM Calculation' }] },
          { name: 'Fractions and Decimals', subtopics: [{ name: 'Conversion' }, { name: 'Operations' }] },
          { name: 'BODMAS' },
          { name: 'Simplification' },
          { name: 'Remainder Theorem' },
        ],
      },
      {
        name: 'Arithmetic',
        topics: [
          { name: 'Percentage', subtopics: [{ name: 'Percentage Change' }, { name: 'Percentage of a Value' }] },
          { name: 'Profit and Loss', subtopics: [{ name: 'Discount' }, { name: 'Marked Price' }] },
          { name: 'Simple Interest' },
          { name: 'Compound Interest' },
          { name: 'Ratio and Proportion', subtopics: [{ name: 'Direct Proportion' }, { name: 'Inverse Proportion' }] },
          { name: 'Averages' },
          { name: 'Mixtures and Alligation' },
        ],
      },
      {
        name: 'Algebra',
        topics: [
          { name: 'Basic Algebraic Identities' },
          { name: 'Linear Equations' },
          { name: 'Quadratic Equations' },
          { name: 'Polynomials' },
        ],
      },
      {
        name: 'Time, Speed, Distance',
        topics: [
          { name: 'Speed and Distance' },
          { name: 'Time and Work', subtopics: [{ name: 'Pipes and Cisterns' }] },
          { name: 'Trains' },
          { name: 'Boats and Streams' },
        ],
      },
      {
        name: 'Geometry',
        topics: [
          { name: 'Lines and Angles' },
          { name: 'Triangles', subtopics: [{ name: 'Congruence' }, { name: 'Similarity' }, { name: 'Pythagoras Theorem' }] },
          { name: 'Circles' },
          { name: 'Quadrilaterals' },
          { name: 'Polygons' },
        ],
      },
      {
        name: 'Mensuration',
        topics: [
          { name: 'Area and Perimeter', subtopics: [{ name: 'Rectangle' }, { name: 'Triangle' }, { name: 'Circle' }] },
          { name: 'Volume and Surface Area', subtopics: [{ name: 'Cube' }, { name: 'Cylinder' }, { name: 'Cone' }, { name: 'Sphere' }] },
        ],
      },
      {
        name: 'Trigonometry',
        topics: [
          { name: 'Trigonometric Ratios' },
          { name: 'Standard Values' },
          { name: 'Heights and Distances' },
        ],
      },
      {
        name: 'Statistics and Data Interpretation',
        topics: [
          { name: 'Mean, Median, Mode' },
          { name: 'Bar Graphs' },
          { name: 'Pie Charts' },
          { name: 'Line Graphs' },
          { name: 'Tables' },
        ],
      },
    ],
  },

  {
    name: 'Reasoning',
    shortCode: 'REAS',
    color: '#f59e0b',
    icon: '🧠',
    chapters: [
      {
        name: 'Verbal Reasoning',
        topics: [
          { name: 'Analogy' },
          { name: 'Classification' },
          { name: 'Series Completion' },
          { name: 'Coding-Decoding' },
          { name: 'Blood Relations' },
          { name: 'Direction Sense' },
          { name: 'Syllogism' },
          { name: 'Statement and Conclusions' },
          { name: 'Alphabet Test' },
          { name: 'Number Ranking and Time Sequence' },
        ],
      },
      {
        name: 'Non-Verbal Reasoning',
        topics: [
          { name: 'Pattern Completion' },
          { name: 'Figure Matrix' },
          { name: 'Paper Folding' },
          { name: 'Mirror and Water Images' },
          { name: 'Embedded Figures' },
          { name: 'Counting of Figures' },
        ],
      },
      {
        name: 'Mathematical Reasoning',
        topics: [
          { name: 'Mathematical Operations' },
          { name: 'Number Series' },
          { name: 'Data Sufficiency' },
          { name: 'Puzzle' },
          { name: 'Seating Arrangement' },
          { name: 'Venn Diagrams' },
        ],
      },
    ],
  },

  {
    name: 'Physics',
    shortCode: 'PHY',
    color: '#3b82f6',
    icon: '⚛️',
    chapters: [
      {
        name: 'Mechanics',
        topics: [
          { name: 'Motion', subtopics: [{ name: 'Kinematics' }, { name: 'Equations of Motion' }] },
          { name: "Newton's Laws of Motion" },
          { name: 'Work, Energy and Power' },
          { name: 'Centre of Mass and Momentum' },
          { name: 'Gravitation', subtopics: [{ name: "Kepler's Laws" }, { name: 'Satellites' }] },
          { name: 'Simple Harmonic Motion' },
          { name: 'Waves and Sound' },
        ],
      },
      {
        name: 'Heat and Thermodynamics',
        topics: [
          { name: 'Temperature and Heat' },
          { name: 'Thermal Expansion' },
          { name: 'Specific Heat Capacity' },
          { name: 'Laws of Thermodynamics' },
        ],
      },
      {
        name: 'Light and Optics',
        topics: [
          { name: 'Reflection' },
          { name: 'Refraction', subtopics: [{ name: 'Snell\'s Law' }, { name: 'Total Internal Reflection' }] },
          { name: 'Lenses' },
          { name: 'Mirrors' },
          { name: 'Dispersion of Light' },
          { name: 'Human Eye' },
        ],
      },
      {
        name: 'Electricity and Magnetism',
        topics: [
          { name: 'Electric Charge and Field' },
          { name: "Ohm's Law", subtopics: [{ name: 'Series and Parallel Circuits' }] },
          { name: 'Heating Effect of Current' },
          { name: 'Magnetic Effects of Current' },
          { name: 'Electromagnetic Induction' },
          { name: 'AC and DC' },
        ],
      },
      {
        name: 'Modern Physics',
        topics: [
          { name: 'Radioactivity' },
          { name: 'Nuclear Fission and Fusion' },
          { name: 'Photoelectric Effect' },
          { name: 'X-rays' },
        ],
      },
    ],
  },

  {
    name: 'Chemistry',
    shortCode: 'CHEM',
    color: '#10b981',
    icon: '🧪',
    chapters: [
      {
        name: 'Basic Chemistry',
        topics: [
          { name: 'Matter and Its Classification' },
          { name: 'Elements, Compounds and Mixtures' },
          { name: 'Atoms and Molecules' },
          { name: 'Atomic Structure', subtopics: [{ name: 'Bohr Model' }, { name: 'Quantum Numbers' }] },
          { name: 'Chemical Bonding', subtopics: [{ name: 'Ionic Bond' }, { name: 'Covalent Bond' }] },
          { name: 'Mole Concept' },
        ],
      },
      {
        name: 'Periodic Table',
        topics: [
          { name: 'Periodic Law' },
          { name: 'Periods and Groups' },
          { name: 'Periodic Properties', subtopics: [{ name: 'Atomic Radius' }, { name: 'Ionization Energy' }, { name: 'Electronegativity' }] },
        ],
      },
      {
        name: 'Chemical Reactions',
        topics: [
          { name: 'Types of Reactions' },
          { name: 'Acids, Bases and Salts', subtopics: [{ name: 'pH Scale' }, { name: 'Neutralization' }] },
          { name: 'Oxidation and Reduction' },
          { name: 'Electrolysis' },
          { name: 'Corrosion' },
        ],
      },
      {
        name: 'Organic Chemistry',
        topics: [
          { name: 'Carbon and Its Compounds' },
          { name: 'Hydrocarbons' },
          { name: 'Functional Groups' },
          { name: 'Polymers' },
        ],
      },
      {
        name: 'Applied Chemistry',
        topics: [
          { name: 'Fuels' },
          { name: 'Soaps and Detergents' },
          { name: 'Fertilizers' },
          { name: 'Metals and Non-metals', subtopics: [{ name: 'Extraction of Metals' }, { name: 'Alloys' }] },
        ],
      },
    ],
  },

  {
    name: 'Biology',
    shortCode: 'BIO',
    color: '#ec4899',
    icon: '🔬',
    chapters: [
      {
        name: 'Cell Biology',
        topics: [
          { name: 'Cell Structure' },
          { name: 'Cell Division', subtopics: [{ name: 'Mitosis' }, { name: 'Meiosis' }] },
          { name: 'Cell Organelles' },
        ],
      },
      {
        name: 'Human Biology',
        topics: [
          { name: 'Digestive System' },
          { name: 'Circulatory System', subtopics: [{ name: 'Heart' }, { name: 'Blood and Blood Groups' }] },
          { name: 'Respiratory System' },
          { name: 'Nervous System' },
          { name: 'Excretory System' },
          { name: 'Skeletal System' },
          { name: 'Endocrine System', subtopics: [{ name: 'Hormones and their Functions' }] },
          { name: 'Reproductive System' },
        ],
      },
      {
        name: 'Plant Biology',
        topics: [
          { name: 'Photosynthesis' },
          { name: 'Plant Nutrition' },
          { name: 'Plant Reproduction' },
          { name: 'Plant Hormones' },
        ],
      },
      {
        name: 'Genetics and Evolution',
        topics: [
          { name: "Mendel's Laws" },
          { name: 'DNA and RNA' },
          { name: 'Heredity and Variation' },
          { name: 'Evolution' },
        ],
      },
      {
        name: 'Ecology',
        topics: [
          { name: 'Ecosystem' },
          { name: 'Food Chain and Food Web' },
          { name: 'Biodiversity' },
          { name: 'Environmental Pollution' },
        ],
      },
      {
        name: 'Diseases and Health',
        topics: [
          { name: 'Communicable Diseases' },
          { name: 'Vitamins and Deficiency Diseases' },
          { name: 'Immunity' },
          { name: 'Nutrition' },
        ],
      },
    ],
  },
];

// ─── Flat helpers ─────────────────────────────────────────────────────────────
export function getAllSubjects(): string[] {
  return CURRICULUM.map((s) => s.name);
}

export function getSubjectDef(name: string): SubjectDef | undefined {
  return CURRICULUM.find((s) => s.name === name);
}

export function getAllChaptersForSubject(subject: string): ChapterDef[] {
  return getSubjectDef(subject)?.chapters ?? [];
}

export function getAllTopicsForSubject(subject: string): TopicDef[] {
  return getAllChaptersForSubject(subject).flatMap((c) => c.topics);
}

export function getAllTopicsFlat(): Array<{ subject: string; chapter: string; topic: string }> {
  return CURRICULUM.flatMap((s) =>
    s.chapters.flatMap((c) =>
      c.topics.map((t) => ({ subject: s.name, chapter: c.name, topic: t.name }))
    )
  );
}
