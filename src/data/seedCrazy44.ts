import type { Category, Task } from '../types/game';

export const CURRENT_TASKS_SEED_VERSION = 2;

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
  { id: 'cat-2', name: 'Part 2: Shop & City Center Challenges', order: 2 },
  { id: 'cat-3', name: 'Part 3: Sinterklaas & Street Fun', order: 3 },
  { id: 'cat-4', name: 'Part 4: Squad Challenges (Anywhere, Anytime)', order: 4 },
  { id: 'cat-5', name: 'Part 5: Multi-Task Handicaps & Swaps', order: 5 },
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
    title: 'De Waagh drama',
    description: 'Strike a dramatic Shakespearean pose on the stairs of De Waagh at the Grote Markt.',
  },
  {
    categoryId: 'cat-1',
    title: "Nijmegen's anthem",
    description: 'Go to Kronenburgerpark and take a video of your team lip-syncing to "Kronenburg Park" by Frank Boeijen Groep.',
  },
  {
    categoryId: 'cat-1',
    title: 'Pass a new law',
    description: 'Stand outside the Stadhuis (City Hall) and film a 10-second speech declaring a ridiculous new law for Nijmegen.',
  },
  {
    categoryId: 'cat-1',
    title: 'Oldest shopping street',
    description: 'Walk down Lange Hezelstraat (the oldest shopping street in the Netherlands) and take a group photo outside the coolest or weirdest shop you spot.',
  },
  {
    categoryId: 'cat-1',
    title: 'Marikenstraat illusion',
    description: 'Take a forced-perspective photo between the two levels of the Marikenstraat (one teammate on the upper walkway "crushing" or high-fiving the rest of the squad below).',
  },
  {
    categoryId: 'cat-1',
    title: 'Statue swap',
    description: 'Find any statue in the city center (other than Moenen) and have your whole team copy its exact pose.',
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

  // Part 2: Shop & City Center Challenges (12-18)
  {
    categoryId: 'cat-2',
    title: 'Kruidvat makeover',
    description: "Go into Kruidvat or Etos and do one teammate's makeup using only the free store testers (take a before-and-after photo!).",
  },
  {
    categoryId: 'cat-2',
    title: 'Team colour manicure',
    description: "Paint everyone's fingernails in your team's colour using tester nail polish at Kruidvat/HEMA (or washable markers).",
  },
  {
    categoryId: 'cat-2',
    title: 'Luxury perfume ad',
    description: 'Walk into Douglas or ICI PARIS XL, spray on the fanciest tester perfume you can find, and pose like a dramatic perfume commercial.',
  },
  {
    categoryId: 'cat-2',
    title: 'Rep the local club',
    description: 'Spot someone wearing NEC Nijmegen football merch (or find NEC gear in a shop window) and take a photo with it.',
  },
  {
    categoryId: 'cat-2',
    title: 'Multilingual birthday',
    description: 'Sing "Happy Birthday" in at least 3 different languages (none of them English or Dutch) in a public square.',
  },
  {
    categoryId: 'cat-2',
    title: 'Grote Markt dance',
    description: 'Do a 10-second TikTok, K-pop, or Eurovision group dance at the Grote Markt.',
  },
  {
    categoryId: 'cat-2',
    title: 'Ridiculous try-on',
    description: 'Go into HEMA, Primark, or Flying Tiger and take a group photo wearing the ugliest sunglasses, hats, or accessories on the racks.',
  },

  // Part 3: Sinterklaas & Street Fun (19-26)
  {
    categoryId: 'cat-3',
    title: 'Spot a Piet',
    description: 'Find a real Piet (or Sinterklaas) walking around the city center and get a selfie together (or a giant Sinterklaas/Piet display if none are left).',
  },
  {
    categoryId: 'cat-3',
    title: 'Mannequin twin',
    description: 'Find a shop window mannequin and have your whole team copy its exact pose right outside the glass.',
  },
  {
    categoryId: 'cat-3',
    title: 'High-five speedrun',
    description: 'Film one teammate getting 5 high-fives in 20 seconds (aim for fellow students or friendly passersby—skip busy families!).',
  },
  {
    categoryId: 'cat-3',
    title: 'Sinterklaas song cover',
    description: 'Look up "Zie ginds komt de stoomboot" on your phone and film your team singing along to the chorus in a public square.',
  },
  {
    categoryId: 'cat-3',
    title: 'Human pyramid',
    description: 'Build a human pyramid with your squad in front of a Nijmegen landmark and hold it for 5 seconds.',
  },
  {
    categoryId: 'cat-3',
    title: 'Ugly mirror selfie',
    description: 'Take a group selfie in a shop mirror or elevator with everyone making their ugliest face.',
  },
  {
    categoryId: 'cat-3',
    title: 'Colour twin stranger',
    description: "Spot a willing stranger wearing your team's assigned colour and take a selfie together.",
  },
  {
    categoryId: 'cat-3',
    title: '5-second showdown',
    description: 'Challenge one willing fellow student or café bartender to a single round of Rock-Paper-Scissors on video.',
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
    description: "Film a 10-second slow-motion squad walk across a square like you're walking away from an explosion.",
  },
  {
    categoryId: 'cat-4',
    title: 'Movie freeze-frame',
    description: 'Recreate an iconic scene from a famous movie on a street corner.',
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
    description: 'Roast/insult a tree for 15 seconds, then sincerely apologize and hug it.',
  },
  {
    categoryId: 'cat-4',
    title: 'Dizzy sprint',
    description: 'Spin in a circle 10 times and immediately try to run 10 meters in a straight line.',
  },
  {
    categoryId: 'cat-4',
    title: 'Tiny space squeeze',
    description: 'Fit your entire squad into the smallest spot possible (a revolving door, tiny doorway, or single bench) and take a photo.',
  },
  {
    categoryId: 'cat-4',
    title: 'Team colour scavenger',
    description: "Collect one item or accessory in your team's assigned colour for every single person in your squad (using items you already have, find, or borrow—no buying!).",
  },

  // Part 5: Multi-Task Handicaps & Swaps (36-44)
  {
    categoryId: 'cat-5',
    title: 'Shoelace swap',
    description: 'Two teammates completely unlace and swap shoelaces with each other—and keep them in for at least 3 other tasks.',
  },
  {
    categoryId: 'cat-5',
    title: 'Emotional support leaf',
    description: 'Pick up a single leaf or pinecone off the ground and treat it like a fragile newborn baby across 3 consecutive tasks.',
  },
  {
    categoryId: 'cat-5',
    title: 'Ink commitment',
    description: 'Get a temporary tattoo—or have a stranger/teammate draw a tattoo on your arm or face with pen/marker (20 POINTS for a real tattoo!!).',
  },
  {
    categoryId: 'cat-5',
    title: 'Backwards fit',
    description: 'One teammate must wear their jacket, hoodie, or backpack completely backwards for 3 consecutive tasks.',
  },
  {
    categoryId: 'cat-5',
    title: 'Floor is lava',
    description: "For 3 tasks in a row, one teammate is banned from touching the bare ground directly (they must stand on curbs, benches, stairs, or teammates' backs/feet in every photo or video).",
  },
  {
    categoryId: 'cat-5',
    title: 'Handcuffed',
    description: 'Two teammates must tie their wrists together using a scarf, sleeve, or shoelace and complete 3 tasks attached at the wrist.',
  },
  {
    categoryId: 'cat-5',
    title: 'Blindfolded VIP',
    description: 'One teammate is blindfolded (using a scarf, beanie, or sleeve) and has to be guided around by the squad through 3 consecutive tasks without peeking (briefly lift only when crossing roads or bike lanes).',
  },
  {
    categoryId: 'cat-5',
    title: 'Secret Service detail',
    description: 'Declare one teammate "The President" for 3 consecutive tasks—the rest of the squad must act as dead-serious Secret Service bodyguards (finger to earpiece, scanning rooftops, opening doors, and striking a bodyguard pose in every photo or video).',
  },
  {
    categoryId: 'cat-5',
    title: 'Human shadow',
    description: 'For 3 consecutive tasks, one teammate must stand right behind another teammate and mirror their exact stance, gestures, and facial expressions in every single photo and video.',
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
