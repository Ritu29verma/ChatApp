import User from '../models/User.js';

// Register or login a user
export const checkOrRegisterUser = async (req, res) => {
  try {
    const { username , isGuest } = req.body;

    let user;
    
    if (!isGuest) {
      // If phoneNumber is provided, check if user exists
      user = await User.findOne({ where: { username } });

      if (!user) {
        return res.status(400).json({ error: "Wrong username" }); // User not found
      }
    } else {
      // If guest login, assign GuestUserX username
      const count = await User.count();
      const username = `GuestUser${count + 1}`;
      user = await User.create({ username, isGuest: true });
    }

    console.log("User registered/found:", user);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
