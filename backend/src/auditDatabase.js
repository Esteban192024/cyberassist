import prisma from './prisma/client.js';
import dotenv from 'dotenv';

dotenv.config();

async function auditDatabase() {
  console.log('=== AUDITORÍA DE BASE DE DATOS ===\n');

  try {
    // 1. Obtener todos los usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        xp: true,
        level: true,
        createdAt: true,
      },
    });

    console.log('=== USUARIOS EN POSTGRESQL ===');
    console.log(`Total usuarios: ${users.length}`);
    users.forEach(user => {
      console.log(`\n--- Usuario: ${user.email} (${user.nombre}) ---`);
      console.log(`ID: ${user.id}`);
      console.log(`XP (PostgreSQL): ${user.xp}`);
      console.log(`Nivel (PostgreSQL): ${user.level}`);
      console.log(`Creado: ${user.createdAt}`);
    });

    // 2. Para cada usuario, obtener sus datos completos
    for (const user of users) {
      console.log(`\n\n=== AUDITORÍA COMPLETA: ${user.email} ===`);

      // UserProgress
      const userProgress = await prisma.userProgress.findUnique({
        where: { userId: user.id },
      });

      console.log('\n--- UserProgress ---');
      if (userProgress) {
        console.log(`diagnosticMastered: ${userProgress.diagnosticMastered}`);
        console.log(`diagnosticTotal: ${userProgress.diagnosticTotal}`);
        console.log(`simulationMastered: ${userProgress.simulationMastered}`);
        console.log(`simulationTotal: ${userProgress.simulationTotal}`);
        console.log(`programComplete: ${userProgress.programComplete}`);
        console.log(`topicLearning: ${JSON.stringify(userProgress.topicLearning, null, 2)}`);
      } else {
        console.log('No hay UserProgress para este usuario');
      }

      // Certificados
      const certificates = await prisma.certificate.findMany({
        where: { userId: user.id },
        orderBy: { issuedAt: 'desc' },
      });

      console.log('\n--- Certificados ---');
      if (certificates.length > 0) {
        console.log(`Total certificados: ${certificates.length}`);
        certificates.forEach(cert => {
          console.log(`\n  ID: ${cert.id}`);
          console.log(`  Tipo: ${cert.type}`);
          console.log(`  Security Level: ${cert.securityLevel}`);
          console.log(`  Level Name: ${cert.levelName}`);
          console.log(`  XP: ${cert.xp}`);
          console.log(`  Issued At: ${cert.issuedAt}`);
        });
      } else {
        console.log('No hay certificados para este usuario');
      }

      // Logros desbloqueados
      const userAchievements = await prisma.userAchievement.findMany({
        where: { userId: user.id },
        include: {
          achievement: true,
        },
        orderBy: {
          unlockedAt: 'desc',
        },
      });

      console.log('\n--- Logros Desbloqueados ---');
      if (userAchievements.length > 0) {
        console.log(`Total logros: ${userAchievements.length}`);
        userAchievements.forEach(ua => {
          console.log(`\n  Código: ${ua.achievement.code}`);
          console.log(`  Nombre: ${ua.achievement.name}`);
          console.log(`  Categoría: ${ua.achievement.category}`);
          console.log(`  XP Reward: ${ua.achievement.xpReward}`);
          console.log(`  Unlocked At: ${ua.unlockedAt}`);
        });
      } else {
        console.log('No hay logros desbloqueados para este usuario');
      }

      // Diagnósticos
      const diagnostics = await prisma.diagnostic.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      console.log('\n--- Últimos 5 Diagnósticos ---');
      if (diagnostics.length > 0) {
        diagnostics.forEach(d => {
          console.log(`\n  ID: ${d.id}`);
          console.log(`  Score: ${d.score}/${d.total}`);
          console.log(`  Mastered Total: ${d.masteredTotal}`);
          console.log(`  Mastered Goal: ${d.masteredGoal}`);
          console.log(`  Risk Level: ${d.riskLevel}`);
          console.log(`  Created At: ${d.createdAt}`);
        });
      } else {
        console.log('No hay diagnósticos para este usuario');
      }

      // Simulaciones
      const simulations = await prisma.simulation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      console.log('\n--- Últimas 5 Simulaciones ---');
      if (simulations.length > 0) {
        simulations.forEach(s => {
          console.log(`\n  ID: ${s.id}`);
          console.log(`  Score: ${s.score}/${s.total}`);
          console.log(`  Mastered Total: ${s.masteredTotal}`);
          console.log(`  Mastered Goal: ${s.masteredGoal}`);
          console.log(`  Risk Level: ${s.riskLevel}`);
          console.log(`  Created At: ${s.createdAt}`);
        });
      } else {
        console.log('No hay simulaciones para este usuario');
      }
    }

    console.log('\n\n=== FIN DE AUDITORÍA ===');

  } catch (error) {
    console.error('Error durante la auditoría:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();
