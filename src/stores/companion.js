import { reactive } from 'vue'

export const companionBus = reactive({
  evt: null
})

const POOLS = {
  boot: [
    'Ahh, a fresh visitor. Welcome!',
    'New explorer detected. Vibes: excellent.',
    'You made it past the boot screen. Impressive.'
  ],
  outfit: [
    'Inspecting the loadout? Bold choice.',
    'That armor has seen some renders.'
  ],
  innerraise: [
    'Training the spirit, I see. Hydrate.',
    'Meditate. Then ship.'
  ],
  inventory: [
    'The vault! Handle with care, some bite.',
    'Serious artifact energy in here.'
  ],
  journal: [
    'The devlog tells all the drama.',
    'Every build log is a war story.'
  ],
  settings: [
    'Tweak away, hero.',
    'Settings are where hope goes to get optimized.'
  ],
  theme: [
    'Ooh, fresh paint job. Very chic.',
    'New coat of pixels. I dig it.'
  ],
  music: [
    'Now we jam!',
    'Beat drop authorized.'
  ],
  artifact_legendary: [
    'LEGENDARY drop! Vendor price: priceless.',
    'The crown jewel. Don\'t scuff it.'
  ],
  artifact_epic: [
    'Epic tier! Don\'t break it on launch day.',
    'Shiny. Very shiny.'
  ],
  artifact_uncommon: [
    'An experiment gone right, I love that.',
    'Promising prototype energy.'
  ],
  artifact_worn: [
    'A failure. My favorite kind.',
    'We learn most from the broken ones.'
  ],
  click: [
    'Boop!',
    'Hehehe!',
    'You\'re fun. Keep doing that.'
  ],
  idle: [
    'I keep this place glitch-free.',
    'The boss isn\'t watching. Go wild.',
    'I ate all the bugs. Literally.',
    'Still loading... just vibing.',
    'Shhh. I\'m debugging in my head.',
    'Have you tried turning yourself off and on?',
    'I once shipped a game in my sleep.',
    'This realm runs on caffeine and spaghetti code.'
  ],
  sleep: [
    'Dreaming in shaders...',
    'Rebooting my personality...'
  ],
  play: [
    'Wheee!',
    'Physics go brr.',
    'I\'m doing parkour. Almost.'
  ],
  skill_unlock: [
    'Skill acquired! Stats up.',
    'Another node lit. You\'re cooking.',
    'Cha-ching! Added to the tree.',
    'Power surge detected. Respect.'
  ],
  konami: [
    'KONAMI? In MY portfolio? It\'s more likely than you think.',
    'Cheat code detected. Reality bending...',
    'Up up down down... you know the drill, champ.',
    'Extra lives granted. (You had none.)'
  ],
  pet: [
    'Boop! (double-tap = PLAY)',
    'Hehe. Double-tap to play!',
    'Pets accepted. Double-tap = game!',
    'Purr. (robots purr, trust me)'
  ],
  game_start: [
    'Pixel hunt! GO!',
    'Catch the pixels!',
    'Ready... GO!'
  ],
  game_over: [
    'Time\'s up! Score logged.',
    'Great run. Told you I was good.',
    'My rockets have eyes. Next time YOU chase.'
  ],
  card: [
    'The Legendary Card. Make it a keepsake.',
    'Fancy. My circuits feel honored.',
    'Premium status achieved. Drip confirmed.'
  ],
  share: [
    'Share it far, traveler!',
    'That card is now a legend in the making.',
    'Go on, show the realm what a real Wanderer looks like.'
  ],
  blocked_click: [
    'Nice try! The vault has no back door.',
    'Right-click? Rude. My pixels are watching.',
    'Inspecting the menu? Save the suspense!',
    'There is nothing behind this menu. I checked.'
  ],
  blocked_f12: [
    'Nice try, keep it up !!',
    'F12? Nope. I saw that coming.',
    'Wrong button, champ. Try the tab bar!',
    'The source code is sacred. And it\'s mine.'
  ],
  blocked_key: [
    'Nice try, keep it up !!',
    'Shhh. Some secrets stay secret.',
    'Ctrl who? We don\'t do that here.',
    'Peeking is cheating. The boss is watching.',
    'That shortcut leads to a wall. Trust me.'
  ]
}

export function tell(type, payload) {
  companionBus.evt = { type, payload, at: Date.now() }
}

export function messageFor(type) {
  const pool = POOLS[type]
  if (!pool || !pool.length) return null
  return pool[Math.floor(Math.random() * pool.length)]
}
