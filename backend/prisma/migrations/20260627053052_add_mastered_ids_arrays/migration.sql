-- AlterTable
ALTER TABLE "UserProgress" ADD COLUMN     "diagnosticMasteredIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "simulationMasteredIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
