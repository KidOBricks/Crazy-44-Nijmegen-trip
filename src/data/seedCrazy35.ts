import type { Category, Task } from '../types/game';

export const DEFAULT_RULES_TEXT = `Welcome to Crazy 44! Complete as many challenges as possible with your squad and rack up the highest score before the deadline.

• Schedule: Knock out outdoor landmark and riverfront challenges while there is daylight, then tackle indoor, square, and quick street challenges.
• Stay Together: Your whole team must stay together for the entire game. Unless a challenge specifically says "one teammate," everyone in the squad should be visible in the photo or video.
• Zero Budget: No challenge requires spending money—everything is 100% free. Do not buy anything for a task.
• Proof Required: Upload a photo or video directly inside each task. No proof = no points. If a submission is rejected, check the feedback and re-upload!
• Scoring:
  - Base Points: 1 Point per completed challenge (unless a task lists higher points).
  - Bonus Points: +1 Bonus Point awarded by organizers for standout creativity, commitment, or comedy.
  - Penalties: -5 Points for breaking rules, bothering people who say no, or arriving late to the final meetup.
• Golden Rule & Etiquette: Keep it friendly and respectful. Skip busy families with young kids and approach fellow students, young adults, or café staff instead. If someone says no, smile, say "dank je wel," and move on.`;

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Part 1: Explore Nijmegen (Landmarks & Local Spots)', order: 1 },
  { id: 'cat-2', name: 'Part 2: Dutch & International Culture', order: 2 },
  { id: 'cat-3', name: 'Part 3: Sinterklaas & Quick Street Challenges', order: 3 },
  { id: 'cat-4', name: 'Part 4: Squad Challenges (Anywhere, Anytime)', order: 4 },
];

interface RawSeedTask {
  categoryId: string;
  title: string;
  description: string;
  points?: number;
}

const RAW_SEED_TASKS: RawSeedTask[] = [
  // Part 1: Explore Nijmegen (1-11)
  {
    categoryId: 'cat-1',
    title: 'Bow to the devil',
    description: 'Take a dramatic group photo "worshipping" the Moenen statue next to the Stevenskerk.',
  },
  {
    categoryId: 'cat-1',
    title: 'All three bridges',
    description: 'Snap a group selfie from the Waalkade or Valkhof Park with all three bridges crossing the Waal visible behind you.',
  },
  {
    categoryId: 'cat-1',
    title: '1,000-year-old history',
    description: 'Touch something verifiably older than 100 years (easy wins: St. Nicholas Chapel in Valkhof Park or the Stevenskerk) and get a picture.',
  },
  {
    categoryId: 'cat-1',
    title: 'Shakespeare on the stairs',
    description: 'Perform a 15-second dramatic Shakespeare monologue on the stairs of De Waagh at the Grote Markt.',
  },
  {
    categoryId: 'cat-1',
    title: "Nijmegen's anthem",
    description: 'Go to Kronenburgerpark and film your team lip-syncing dramatically to "Kronenburg Park" by Frank Boeijen Groep.',
  },
  {
    categoryId: 'cat-1',
    title: 'Pass a new law',
    description: 'Stand outside the Stadhuis (City Hall) and film a 10-second speech declaring a ridiculous new law for Nijmegen.',
  },
  {
    categoryId: 'cat-1',
    title: 'Oldest shopping street',
    description: 'Walk down Lange Hezelstraat (the oldest shopping street in the Netherlands) and take a group photo outside the quirkiest shop you spot.',
  },
  {
    categoryId: 'cat-1',
    title: 'Marikenstraat illusion',
    description: 'Take a creative forced-perspective photo between the two levels of the Marikenstraat (one teammate on the upper walkway, one on the lower level).',
  },
  {
    categoryId: 'cat-1',
    title: 'Statue swap',
    description: 'Find any statue in the city center (other than Moenen) and have your whole team copy its pose.',
  },
  {
    categoryId: 'cat-1',
    title: 'Street art hunt',
    description: 'Find and take selfies with 3 different murals or pieces of street art around the center.',
  },
  {
    categoryId: 'cat-1',
    title: 'Plein 44 piggy-back',
    description: 'Film a teammate getting—or giving—a piggy-back ride across Plein 44.',
  },

  // Part 2: Dutch & International Culture (12-18)
  {
    categoryId: 'cat-2',
    title: 'Supermarket infomercial',
    description: 'Walk into a Dutch supermarket or HEMA, pick up the weirdest-looking Dutch snack or product (do NOT buy it—put it back!), and film a 15-second dramatic TV commercial for it.',
  },
  {
    categoryId: 'cat-2',
    title: 'Tour de Nijmegen',
    description: 'Stand safely next to a busy bike path and give a 15-second hyped-up Tour de France commentary.',
  },
  {
    categoryId: 'cat-2',
    title: 'National anthem relay',
    description: "Film your team singing 10 seconds of a teammate's home country's national anthem back-to-back in a public square.",
  },
  {
    categoryId: 'cat-2',
    title: 'Rep the local club',
    description: 'Spot someone wearing NEC Nijmegen football merch (or find NEC gear in a shop window) and take a photo with it.',
  },
  {
    categoryId: 'cat-2',
    title: 'Multilingual birthday',
    description: 'Sing "Happy Birthday" loudly in at least 3 different languages (none of them English or Dutch) in a public square.',
  },
  {
    categoryId: 'cat-2',
    title: 'Grote Markt flashmob',
    description: 'Perform a 15-second TikTok, K-pop, or Eurovision group dance at the Grote Markt.',
  },
  {
    categoryId: 'cat-2',
    title: 'Haring happen (Herring chomp)',
    description: 'Film your whole team doing the classic Dutch herring pose—tilting your heads all the way back and lowering an imaginary raw herring by the tail into your mouths in sync (no need to actually purchase the fish if you do not desire to do so).',
  },

  // Part 3: Sinterklaas & Quick Street Challenges (19-26)
  {
    categoryId: 'cat-3',
    title: 'Sinterklaas spotter',
    description: 'Find a Sinterklaas shop window display, banner, or leftover intocht decoration in the city center and take a dramatic group selfie with it (bonus point if you spot a Piet!).',
  },
  {
    categoryId: 'cat-3',
    title: 'Sinterklaas shoe tradition',
    description: 'Take off one shoe per teammate, line them up neatly outside a shop window or landmark, and film your team singing a 10-second song asking Sinterklaas to fill them.',
  },
  {
    categoryId: 'cat-3',
    title: 'High-five speedrun',
    description: 'Film one teammate getting 5 high-fives in 20 seconds (aim for fellow students or friendly passersby—skip busy families!).',
  },
  {
    categoryId: 'cat-3',
    title: 'Sinterklaas song cover',
    description: 'Look up the classic Dutch song "Zie ginds komt de stoomboot" on your phone and film your team singing along to the first 15 seconds in a public square.',
  },
  {
    categoryId: 'cat-3',
    title: 'Album cover',
    description: 'Find a cool staircase, alleyway, or historic doorway in the center and pose like your squad is dropping a 90s pop or rap album.',
  },
  {
    categoryId: 'cat-3',
    title: 'Action pose',
    description: "Pull off a synchronized Charlie's Angels or superhero landing pose in front of a Nijmegen landmark.",
  },
  {
    categoryId: 'cat-3',
    title: 'Dog spotter',
    description: 'Take a group photo waving happily at a dog in the city center (only pet it if the owner stops and says yes!).',
  },
  {
    categoryId: 'cat-3',
    title: '5-second showdown',
    description: 'Challenge one willing stranger or café bartender to a single round of Rock-Paper-Scissors on video.',
  },

  // Part 4: Squad Challenges (27-35)
  {
    categoryId: 'cat-4',
    title: 'Levitation shot',
    description: "Take a group photo where nobody's feet are touching the ground.",
  },
  {
    categoryId: 'cat-4',
    title: 'Action movie slow-mo',
    description: "Film a 10-second dramatic slow-motion squad walk across a square or street like you're walking away from an explosion.",
  },
  {
    categoryId: 'cat-4',
    title: 'Movie freeze-frame',
    description: 'Recreate an iconic scene from a famous movie on a random street corner.',
  },
  {
    categoryId: 'cat-4',
    title: 'Outfit swap',
    description: 'Two teammates switch jackets, sweaters, or accessories for at least 3 tasks.',
  },
  {
    categoryId: 'cat-4',
    title: 'One-word karaoke',
    description: 'Sing the chorus of a famous song, one word per person around the circle, without messing up.',
  },
  {
    categoryId: 'cat-4',
    title: 'Tree beef & peace',
    description: 'Aggressively roast/insult a tree for 30 seconds, then sincerely apologize and hug it.',
  },
  {
    categoryId: 'cat-4',
    title: 'Dizzy sprint',
    description: 'Spin in a circle 10 times and immediately try to run 10 meters in a straight line.',
  },
  {
    categoryId: 'cat-4',
    title: 'Travel vlogger',
    description: 'Film a 20-second over-the-top English travel-vlog intro explaining why Nijmegen is the greatest city on Earth.',
  },
  {
    categoryId: 'cat-4',
    title: 'Team colour scavenger',
    description: "Collect one item or accessory in your team's assigned colour for every single person in your squad (using items you already have, find, or borrow—no need to buy!).",
  },
];

export function buildSeedTasks(now = Date.now()): Task[] {
  return RAW_SEED_TASKS.map((raw, idx) => ({
    id: `task-${idx + 1}`,
    number: idx + 1,
    title: raw.title,
    description: raw.description,
    categoryId: raw.categoryId,
    points: raw.points ?? 1,
    createdAt: now,
    updatedAt: now,
  }));
}
