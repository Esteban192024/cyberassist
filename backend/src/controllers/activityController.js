import prisma from '../prisma/client.js';

export const createActivity = async (req, res) => {
  try {
    const { type, title, details } = req.body;
    const userId = req.user.userId;

    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId,
        type,
        title,
        details: details || null,
      },
    });

    res.json({
      message: 'Activity created successfully',
      activity,
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ error: 'Failed to create activity' });
  }
};

export const getUserActivities = async (req, res) => {
  try {
    const userId = req.user.userId;

    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    });

    res.json(activities);
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({ error: 'Failed to fetch user activities' });
  }
};
