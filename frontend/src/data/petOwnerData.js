// Master pet types (matches PETS table in DB schema)
export const petTypes = [
  { id: 1, name: "Dog", emoji: "🐶" },
  { id: 2, name: "Cat", emoji: "🐱" },
  { id: 3, name: "Rabbit", emoji: "🐰" },
  { id: 4, name: "Bird", emoji: "🐦" },
];

export const petOwnerProfile = {
  name: "Jane Smith",
  initials: "JS",
  email: "jane@example.com",
  role: "Pet Owner",
  status: "Active",
  phone: "+60 12-345 6789",
  joined: "10 Feb 2026",
  lastLogin: "Today, 8:42 AM",
  bio: "Cat and dog parent. Loves learning emergency first-aid for furry friends.",
  avatarUrl: "",
  // Matches user_pets table: userPetID, petID (type), userPetName, breed
  pets: [
    {
      id: 1,
      name: "Milo",
      type: "Dog",
      emoji: "🐶",
      breed: "Golden Retriever",
    },
    {
      id: 2,
      name: "Luna",
      type: "Cat",
      emoji: "🐱",
      breed: "Persian",
    },
  ],
};

export const dashboardStats = [
  { title: "Bookmarked topics", value: 6, icon: "🔖" },
  { title: "Quizzes attempted", value: 4, icon: "🧠" },
  { title: "Average score", value: "82%", icon: "📊" },
  { title: "Feedback sent", value: 2, icon: "💬" },
];

export const recentTopics = [
  {
    id: 101,
    title: "Choking & Airway Blockage",
    pet: "Dog",
    petEmoji: "🐶",
    severity: "High",
  },
  {
    id: 102,
    title: "Dog Heatstroke & Overheating",
    pet: "Dog",
    petEmoji: "🐶",
    severity: "Medium",
  },
  {
    id: 103,
    title: "Cat Poisoning Response",
    pet: "Cat",
    petEmoji: "🐱",
    severity: "High",
  },
];

export const bookmarkedTopics = [
  {
    id: 101,
    title: "Choking & Airway Blockage",
    pet: "Dog",
    petEmoji: "🐶",
    severity: "High",
    summary:
      "Recognise the signs of choking and learn the safe steps to clear your pet's airway.",
    savedAt: "Today",
  },
  {
    id: 102,
    title: "Dog Heatstroke & Overheating",
    pet: "Dog",
    petEmoji: "🐶",
    severity: "Medium",
    summary:
      "Heatstroke is a medical emergency. Learn how to cool down your dog safely.",
    savedAt: "Yesterday",
  },
  {
    id: 103,
    title: "Cat Poisoning Response",
    pet: "Cat",
    petEmoji: "🐱",
    severity: "High",
    summary:
      "Know the common household poisons and the right steps to take before reaching the vet.",
    savedAt: "3 days ago",
  },
  {
    id: 104,
    title: "Rabbit Heatstroke Care",
    pet: "Rabbit",
    petEmoji: "🐰",
    severity: "Medium",
    summary:
      "Rabbits cannot sweat. Learn signs and immediate cooling measures.",
    savedAt: "1 week ago",
  },
  {
    id: 105,
    title: "Bird Wound & Bleeding Care",
    pet: "Bird",
    petEmoji: "🐦",
    severity: "Low",
    summary:
      "How to handle small wounds and bleeding for birds before veterinary care.",
    savedAt: "2 weeks ago",
  },
  {
    id: 106,
    title: "Dog Seizure First Aid",
    pet: "Dog",
    petEmoji: "🐶",
    severity: "High",
    summary:
      "Stay calm and follow these steps if your dog has a sudden seizure.",
    savedAt: "3 weeks ago",
  },
];

export const availableQuizzes = [
  {
    id: 1,
    title: "Dog & Cat Choking Quiz",
    pet: "Dog & Cat",
    petEmoji: "🐶🐱",
    questions: 8,
    passingScore: 70,
    difficulty: "Beginner",
    attempted: true,
    bestScore: 90,
  },
  {
    id: 2,
    title: "Dog Heatstroke Quiz",
    pet: "Dog",
    petEmoji: "🐶",
    questions: 6,
    passingScore: 80,
    difficulty: "Intermediate",
    attempted: true,
    bestScore: 65,
  },
  {
    id: 3,
    title: "Cat Poisoning Quiz",
    pet: "Cat",
    petEmoji: "🐱",
    questions: 7,
    passingScore: 70,
    difficulty: "Intermediate",
    attempted: false,
    bestScore: null,
  },
  {
    id: 4,
    title: "Bird Wound Care Quiz",
    pet: "Bird",
    petEmoji: "🐦",
    questions: 5,
    passingScore: 70,
    difficulty: "Beginner",
    attempted: false,
    bestScore: null,
  },
];

// Questions for the quiz attempt page (keyed by quizId)
export const quizQuestions = {
  1: [
    {
      id: 1,
      questionText: "What should you do first when a pet is choking?",
      options: [
        "Stay calm and keep the pet still",
        "Give food immediately",
        "Force the pet to drink water",
        "Ignore it",
      ],
      correctAnswer: "Stay calm and keep the pet still",
    },
    {
      id: 2,
      questionText: "When should you contact a veterinarian?",
      options: [
        "If the pet cannot breathe",
        "Only after one week",
        "Never",
        "Only if the pet eats",
      ],
      correctAnswer: "If the pet cannot breathe",
    },
    {
      id: 3,
      questionText:
        "Which of the following is a sign that an object has been swallowed?",
      options: [
        "Drooling and pawing at the mouth",
        "Wagging tail",
        "Eating eagerly",
        "Loud purring",
      ],
      correctAnswer: "Drooling and pawing at the mouth",
    },
  ],
  2: [
    {
      id: 1,
      questionText: "Where should you move an overheated dog?",
      options: [
        "A cool shaded area",
        "Direct sunlight",
        "A hot room",
        "Inside a closed car",
      ],
      correctAnswer: "A cool shaded area",
    },
    {
      id: 2,
      questionText: "Which is a clear early sign of heatstroke in a dog?",
      options: [
        "Heavy panting and drooling",
        "Quiet sleeping",
        "Cool dry nose",
        "Eating normally",
      ],
      correctAnswer: "Heavy panting and drooling",
    },
  ],
  3: [
    {
      id: 1,
      questionText: "Which household item is highly toxic to cats?",
      options: ["Lilies", "Lettuce", "Rice", "Cooked chicken"],
      correctAnswer: "Lilies",
    },
    {
      id: 2,
      questionText: "After suspected poisoning, you should:",
      options: [
        "Contact a vet immediately",
        "Wait and observe for a day",
        "Give the cat milk",
        "Force vomiting at home without advice",
      ],
      correctAnswer: "Contact a vet immediately",
    },
  ],
  4: [
    {
      id: 1,
      questionText: "Before handling an injured bird, you should:",
      options: [
        "Speak softly and approach slowly",
        "Grab quickly",
        "Spray water",
        "Shake the cage",
      ],
      correctAnswer: "Speak softly and approach slowly",
    },
    {
      id: 2,
      questionText: "If a small wound is bleeding lightly, you should:",
      options: [
        "Apply gentle pressure with clean gauze",
        "Pour alcohol on it",
        "Ignore it",
        "Bandage it tightly",
      ],
      correctAnswer: "Apply gentle pressure with clean gauze",
    },
  ],
};

export const recentQuizAttempts = [
  {
    id: 1,
    quizTitle: "Dog & Cat Choking Quiz",
    score: 90,
    result: "Passed",
    attemptedAt: "Today",
  },
  {
    id: 2,
    quizTitle: "Dog Heatstroke Quiz",
    score: 65,
    result: "Failed",
    attemptedAt: "Yesterday",
  },
];

export const myFeedback = [
  {
    id: 1,
    guideTitle: "Choking & Airway Blockage",
    rating: 5,
    message:
      "Very clear step-by-step instructions. The images really helped me understand what to do.",
    submittedAt: "2 hours ago",
    status: "New",
  },
  {
    id: 2,
    guideTitle: "Dog Heatstroke & Overheating",
    rating: 3,
    message:
      "Step 4 needs more detail. I was not sure how much water to give.",
    submittedAt: "Yesterday",
    status: "Reviewed",
  },
];
