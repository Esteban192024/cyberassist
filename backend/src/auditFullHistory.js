import prisma from './prisma/client.js';
import dotenv from 'dotenv';

dotenv.config();

async function auditFullHistory() {
  console.log('=== AUDITORÍA COMPLETA DE HISTORIAL ===\n');

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
      },
    });

    for (const user of users) {
      console.log(`\n=== USUARIO: ${user.email} (${user.nombre}) ===`);
      console.log(`ID: ${user.id}\n`);

      // UserProgress actual
      const userProgress = await prisma.userProgress.findUnique({
        where: { userId: user.id },
      });

      console.log('--- UserProgress ACTUAL ---');
      if (userProgress) {
        console.log(`diagnosticMastered: ${userProgress.diagnosticMastered}`);
        console.log(`diagnosticTotal: ${userProgress.diagnosticTotal}`);
        console.log(`simulationMastered: ${userProgress.simulationMastered}`);
        console.log(`simulationTotal: ${userProgress.simulationTotal}`);
        console.log(`programComplete: ${userProgress.programComplete}`);
        console.log(`createdAt: ${userProgress.createdAt}`);
        console.log(`updatedAt: ${userProgress.updatedAt}`);
      } else {
        console.log('No hay UserProgress');
      }

      // TODOS los diagnósticos
      const allDiagnostics = await prisma.diagnostic.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      console.log('\n--- HISTORIAL COMPLETO DE DIAGNÓSTICOS ---');
      console.log(`Total registros: ${allDiagnostics.length}`);
      allDiagnostics.forEach((diag, index) => {
        console.log(`\n[${index + 1}] ID: ${diag.id}`);
        console.log(`    Score: ${diag.score}/${diag.total}`);
        console.log(`    Mastered Total: ${diag.masteredTotal}`);
        console.log(`    Mastered Goal: ${diag.masteredGoal}`);
        console.log(`    Created At: ${diag.createdAt}`);
        console.log(`    Risk Level: ${diag.riskLevel}`);
      });

      // TODAS las simulaciones
      const allSimulations = await prisma.simulation.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
      });

      console.log('\n--- HISTORIAL COMPLETO DE SIMULACIONES ---');
      console.log(`Total registros: ${allSimulations.length}`);
      allSimulations.forEach((sim, index) => {
        console.log(`\n[${index + 1}] ID: ${sim.id}`);
        console.log(`    Score: ${sim.score}/${sim.total}`);
        console.log(`    Mastered Total: ${sim.masteredTotal}`);
        console.log(`    Mastered Goal: ${sim.masteredGoal}`);
        console.log(`    Created At: ${sim.createdAt}`);
        console.log(`    Risk Level: ${sim.riskLevel}`);
      });

      // Análisis de valores máximos
      const maxDiagnosticMastered = Math.max(...allDiagnostics.map(d => d.masteredTotal), 0);
      const maxSimulationMastered = Math.max(...allSimulations.map(s => s.masteredTotal), 0);

      console.log('\n--- ANÁLISIS DE VALORES MÁXIMOS ---');
      console.log(`Máximo diagnosticMastered en historial: ${maxDiagnosticMastered}`);
      console.log(`Máximo simulationMastered en historial: ${maxSimulationMastered}`);
      console.log(`diagnosticMastered actual en UserProgress: ${userProgress?.diagnosticMastered ?? 'N/A'}`);
      console.log(`simulationMastered actual en UserProgress: ${userProgress?.simulationMastered ?? 'N/A'}`);

      // Verificar si hubo alguna sesión con 15
      const had15Diagnostics = allDiagnostics.some(d => d.masteredTotal === 15);
      const had15Simulations = allSimulations.some(s => s.masteredTotal === 15);

      console.log('\n--- ¿HUBO SESIÓN COMPLETA (15/15)? ---');
      console.log(`Diagnóstico con 15/15: ${had15Diagnostics ? 'SÍ' : 'NO'}`);
      console.log(`Simulación con 15/15: ${had15Simulations ? 'SÍ' : 'NO'}`);
    }

    console.log('\n\n=== FIN DE AUDITORÍA ===');
  } catch (error) {
    console.error('Error durante auditoría:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditFullHistory();
