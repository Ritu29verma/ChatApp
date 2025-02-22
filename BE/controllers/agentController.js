import  Agent  from '../models/Agent.js';

// Register or login an agent
export const checkOrRegisterAgent = async (req, res) => {
  try {
    const { phoneNumber, isGuest } = req.body;

    let agent;
    
    if (!isGuest) {
      // If phoneNumber is provided, check if agent exists
      agent = await Agent.findOne({ where: { phoneNumber } });

      if (!agent) {
        const count = await Agent.count();
        const username = `Agent${count + 1}`;
        agent = await Agent.create({ phoneNumber, username, isGuest: false });
      }
    } else {
      // If guest login, assign GuestAgentX username
      const count = await Agent.count();
      const username = `GuestAgent${count + 1}`;
      agent = await Agent.create({ phoneNumber: null, username, isGuest: true });
    }

    console.log("Agent registered/found:", agent);
    res.status(200).json(agent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Get all agents
export const getAllAgents = async (req, res) => {
  try {
    const agents = await Agent.findAll();
    res.json(agents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
};
