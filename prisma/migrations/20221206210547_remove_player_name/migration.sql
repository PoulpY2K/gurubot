/*
  Warnings:

  - You are about to drop the column `name` on the `Player` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Player_name_key` ON `Player`;

-- AlterTable
ALTER TABLE `Player` DROP COLUMN `name`;
