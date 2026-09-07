// ---------- content ----------
const RELICS = [
  // economy (score / coin)
  { id: 'pockets',    name: 'Deep Pockets', price: 4, desc: '+2 coins at the end of every round.' },
  { id: 'numer',      name: 'Numerologist', price: 7, desc: 'Cells showing 3 or more score double chips.' },
  { id: 'momentum',   name: 'Momentum',     price: 7, desc: 'Every 12 cells dug in a round add +1 mult. Resets each round.' },
  { id: 'flagpole',   name: 'Flagpole',     price: 4, desc: 'Each correctly flagged mine pays 1 coin when the round clears.' },
  { id: 'insurance',  name: 'Insurance',    price: 4, desc: 'Hitting a mine pays 3 coins.' },
  { id: 'warm',       name: 'Warm Start',   price: 8, desc: 'Mult starts at 2 instead of 1.' },
  // board / tile effects
  { id: 'sonar',      name: 'Sonar',        price: 6, desc: 'Once per round, tap a hidden cell to learn whether it is a mine.' },
  { id: 'kevlar',     name: 'Kevlar Vest',  price: 6, desc: 'The first mine you hit each round costs no heart.' },
  { id: 'carto',      name: 'Cartographer', price: 5, desc: 'Start each round with four safe cells already dug.' },
  { id: 'shovel',     name: 'Lucky Shovel', price: 5, desc: 'Once per round, dig up a random safe cell.' },
  { id: 'heart',      name: 'Heartstone',   price: 7, desc: '+1 max heart, and heal one now.' },
  { id: 'survey',     name: 'Surveyor',     price: 7, desc: 'Your first dig each round lights up every mine sharing its row or column.' },
  { id: 'coldsweat',  name: 'Cold Sweat',   price: 5, desc: 'Down to your last heart, every dig marks what sits beside it.' },
  { id: 'hound',      name: 'Bloodhound',   price: 5, desc: 'Every mine that bites you gives up the location of another.' },
  { id: 'powderkeg',  name: 'Powder Keg',   price: 6, desc: 'A mine still takes its heart, but the blast clears the 3×3 around it.' },
  { id: 'deadman',    name: "Dead Man's Switch", price: 8, desc: 'Once per run, the hit that would end you is defused instead.' },
  { id: 'sidestep',   name: 'Sidestep',     price: 8, desc: 'The first mine you hit each round steps aside. It reappears elsewhere and you keep the cell and the heart.' },
  { id: 'lodestone',  name: 'Lodestone',    price: 8, desc: 'The board tilts. Mines slide to the walls; the middle opens up.' },
  { id: 'groundswell',name: 'Groundswell',  price: 6, desc: 'Your first dig each round also cracks open a distant empty pocket.' },
  { id: 'deepvein',   name: 'Deep Vein',    price: 6, desc: 'Any dig that opens eight or more cells at once pulls up one more safe cell for free.' },
];
const MEDKIT = { id: 'medkit', name: 'Medkit', price: 4, desc: 'Heal one heart. Consumed on purchase.', consumable: true };
const BOSSES = [
  { id: 'nocascade', name: 'Dead Air',       desc: 'Empty cells no longer dig up their neighbours.' },
  { id: 'double',    name: 'Heavy Ordnance', desc: 'Every mine costs two hearts.' },
  { id: 'tax',       name: 'Quota',          desc: 'The target is 40% higher.' },
  { id: 'fog',       name: 'Fog',            desc: 'Numbers above 3 only show as 3+.' },
];
const MAX_RELICS = 6;

