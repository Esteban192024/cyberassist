import prisma from '../prisma/client.js';

export const createCertificate = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, securityLevel, levelName, xp } = req.body;

    if (!type || !securityLevel || !levelName || !xp) {
      return res.status(400).json({ error: 'Missing required fields: type, securityLevel, levelName, xp' });
    }

    // Verificar si ya existe un certificado del mismo tipo para este usuario
    const existingCertificate = await prisma.certificate.findFirst({
      where: {
        userId,
        type,
      },
    });

    if (existingCertificate) {
      return res.status(400).json({ error: 'Certificate of this type already exists for this user' });
    }

    // Obtener datos del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { nombre: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Crear certificado
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        type,
        securityLevel,
        levelName,
        xp,
      },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Certificate created successfully',
      certificate,
    });
  } catch (error) {
    console.error('Create certificate error:', error);
    res.status(500).json({ error: 'Failed to create certificate' });
  }
};

export const getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.userId;

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    res.json(certificates);
  } catch (error) {
    console.error('Get user certificates error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
};

export const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    // Verificar que el certificado pertenezca al usuario
    if (certificate.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('Get certificate by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
};
