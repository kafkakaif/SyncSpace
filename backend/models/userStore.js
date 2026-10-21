import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './User.js';

// In-memory fallback storage when MongoDB is not connected
const inMemoryUsers = new Map();

export const isMongoConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

export const findUserByEmail = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isMongoConnected()) {
    return await User.findOne({ email: normalizedEmail });
  }

  // Fallback in-memory
  const user = inMemoryUsers.get(normalizedEmail);
  if (!user) return null;

  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    password: user.password,
    avatar: user.avatar,
    createdAt: user.createdAt,
    comparePassword: async (candidate) => {
      return bcrypt.compare(candidate, user.password);
    },
    toJSON: () => ({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    }),
  };
};

export const findUserById = async (id) => {
  if (isMongoConnected()) {
    return await User.findById(id).select('-password');
  }

  for (const user of inMemoryUsers.values()) {
    if (user._id === id) {
      return {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      };
    }
  }

  return null;
};

export const createUser = async ({ name, email, password, avatar = '' }) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (isMongoConnected()) {
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      avatar,
    });
    await newUser.save();
    return newUser;
  }

  // Fallback in-memory
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const user = {
    _id: id,
    id,
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    avatar,
    createdAt: new Date().toISOString(),
  };

  inMemoryUsers.set(normalizedEmail, user);

  return {
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    createdAt: user.createdAt,
    comparePassword: async (candidate) => {
      return bcrypt.compare(candidate, user.password);
    },
    toJSON: () => ({
      _id: user._id,
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt,
    }),
  };
};

export const clearInMemoryUsers = () => {
  inMemoryUsers.clear();
};
