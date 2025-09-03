const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;

// In-memory data (later replace with DB)
let users = {};
let quests = [
  {
    id: 'math-1',
    title: 'Build a pulley system',
    subject: 'Physics',
    description: 'Design a pulley system to fetch water from a well.',
    reward: { energyUnits: 5, bricks: 3 }
  },
  {
    id: 'chem-1',
    title: 'Balance fertilizer ratios',
    subject: 'Chemistry',
    description: 'Balance fertilizer ratios for better crop yield.',
    reward: { materials: 4 }
  },
  {
    id: 'bio-1',
    title: 'Plant an eco-farm',
    subject: 'Biology',
    description: 'Unlock eco points by planting farms.',
    reward: { ecoPoints: 6 }
  }
];

// Helper to create a new user
function createUser(username, password) {
  users[username] = {
    password, // plain password for now (later: hash it!)
    village: {
      bricks: 0,
      energyUnits: 0,
      materials: 0,
      ecoPoints: 0,
      buildings: []
    },
    completedQuests: []
  };
}

// --- ROUTES ---

// Signup
app.post('/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username and password required' });

  if (users[username])
    return res.status(400).json({ error: 'User already exists' });

  createUser(username, password);
  res.json({ message: 'User created successfully', username });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users[username];

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.password !== password)
    return res.status(401).json({ error: 'Invalid password' });

  res.json({ message: 'Login successful', username });
});

// Get quests (supports ?subject filter)
app.get('/quests', (req, res) => {
  const subject = req.query.subject;
  if (subject) {
    return res.json(
      quests.filter(q => q.subject.toLowerCase() === subject.toLowerCase())
    );
  }
  res.json(quests);
});

// Get village stats
app.get('/village/:username', (req, res) => {
  const user = users[req.params.username];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.village);
});

// Complete a quest
app.post('/quests/:id/complete', (req, res) => {
  const { username } = req.body;
  const questId = req.params.id;

  const user = users[username];
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.completedQuests.includes(questId)) {
    return res.status(400).json({ error: 'Quest already completed' });
  }

  const quest = quests.find(q => q.id === questId);
  if (!quest) return res.status(404).json({ error: 'Quest not found' });

  // Award resources
  const village = user.village;
  for (const [key, value] of Object.entries(quest.reward)) {
    village[key] = (village[key] || 0) + value;
  }

  user.completedQuests.push(questId);
  res.json({ message: 'Quest completed', village });
});

// Upgrade building
app.post('/village/:username/upgrade', (req, res) => {
  const { building, cost } = req.body;
  const user = users[req.params.username];
  if (!user) return res.status(404).json({ error: 'User not found' });

  const village = user.village;

  // Check resources
  for (const [resource, amount] of Object.entries(cost)) {
    if ((village[resource] || 0) < amount) {
      return res.status(400).json({ error: `Not enough ${resource}` });
    }
  }

  // Deduct & add building
  for (const [resource, amount] of Object.entries(cost)) {
    village[resource] -= amount;
  }
  village.buildings.push(building);

  res.json({ message: `${building} built!`, village });
});

// Leaderboard
app.get('/leaderboard', (req, res) => {
  const leaderboard = Object.entries(users)
    .map(([username, data]) => {
      const v = data.village;
      const totalResources =
        (v.bricks || 0) +
        (v.energyUnits || 0) +
        (v.materials || 0) +
        (v.ecoPoints || 0);
      return {
        username,
        totalResources,
        buildings: v.buildings.length
      };
    })
    .sort((a, b) => b.totalResources - a.totalResources);

  res.json(leaderboard);
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`✅ Smart Village backend running at http://localhost:${PORT}`);
});
