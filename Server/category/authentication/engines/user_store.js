const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Point to the shared data folder
const USERS_FILE = path.join(__dirname, '..', '..', 'data', 'users.json');

const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

module.exports = {
  findUserByEmail: (email) => {
    const users = readUsers();
    return users.find(u => u.email === email);
  },

  createUser: async (name, email, password) => {
    const users = readUsers();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashedPassword };
    users.push(newUser);
    writeUsers(users);
    return newUser;
  },

  verifyPassword: async (inputPassword, hashedPassword) => {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }
};
