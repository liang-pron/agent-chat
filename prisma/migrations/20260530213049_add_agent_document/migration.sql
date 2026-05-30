-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "githubUrl" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "modelConfig" TEXT NOT NULL,
    "document" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Agent" ("avatarUrl", "category", "createdAt", "description", "githubUrl", "id", "modelConfig", "name", "systemPrompt") SELECT "avatarUrl", "category", "createdAt", "description", "githubUrl", "id", "modelConfig", "name", "systemPrompt" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
