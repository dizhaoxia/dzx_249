import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getDb } from '../db';
import { config } from '../config';
import { authMiddleware } from '../middleware/auth';
import { User } from '../types';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { phone, password, nickname } = req.body;

    if (!phone || !password || !nickname) {
      return res.status(400).json({ error: '手机号、密码和昵称为必填项' });
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入正确的手机号格式' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少6位' });
    }

    if (nickname.length < 1 || nickname.length > 20) {
      return res.status(400).json({ error: '昵称长度为1-20个字符' });
    }

    const db = await getDb();

    const existingUser = await db.get<User>('SELECT * FROM users WHERE phone = ?', [phone]);
    if (existingUser) {
      return res.status(400).json({ error: '该手机号已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const createdAt = dayjs().toISOString();

    await db.run(
      'INSERT INTO users (id, phone, password, nickname, created_at) VALUES (?, ?, ?, ?, ?)',
      [userId, phone, hashedPassword, nickname, createdAt]
    );

    const token = jwt.sign(
      { userId, phone, nickname } as object,
      config.jwtSecret as string,
      { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      token,
      user: { id: userId, phone, nickname },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ error: '手机号和密码为必填项' });
    }

    const db = await getDb();
    const user = await db.get<User>('SELECT * FROM users WHERE phone = ?', [phone]);

    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, nickname: user.nickname } as object,
      config.jwtSecret as string,
      { expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );

    res.json({
      token,
      user: { id: user.id, phone: user.phone, nickname: user.nickname },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const user = await db.get<User>('SELECT id, phone, nickname, created_at FROM users WHERE id = ?', [req.user.userId]);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export default router;
