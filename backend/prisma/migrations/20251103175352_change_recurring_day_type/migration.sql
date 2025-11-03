/*
  Warnings:

  - You are about to alter the column `recurring_day` on the `bookingslots` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Int`.

*/
-- DropIndex
DROP INDEX `Bookings_court_id_fkey` ON `bookings`;

-- DropIndex
DROP INDEX `Bookings_user_id_fkey` ON `bookings`;

-- DropIndex
DROP INDEX `BookingSlots_booking_id_fkey` ON `bookingslots`;

-- DropIndex
DROP INDEX `BookingSlots_slot_id_fkey` ON `bookingslots`;

-- DropIndex
DROP INDEX `Feedbacks_court_id_fkey` ON `feedbacks`;

-- DropIndex
DROP INDEX `Feedbacks_user_id_fkey` ON `feedbacks`;

-- DropIndex
DROP INDEX `LeaderBoards_tournament_id_fkey` ON `leaderboards`;

-- DropIndex
DROP INDEX `Payments_booking_id_fkey` ON `payments`;

-- DropIndex
DROP INDEX `TeamMembers_tournament_team_id_fkey` ON `teammembers`;

-- DropIndex
DROP INDEX `TeamMembers_user_id_fkey` ON `teammembers`;

-- DropIndex
DROP INDEX `TournamentMatches_court_id_fkey` ON `tournamentmatches`;

-- DropIndex
DROP INDEX `TournamentMatches_team1_id_fkey` ON `tournamentmatches`;

-- DropIndex
DROP INDEX `TournamentMatches_team2_id_fkey` ON `tournamentmatches`;

-- DropIndex
DROP INDEX `TournamentMatches_tournament_id_fkey` ON `tournamentmatches`;

-- DropIndex
DROP INDEX `TournamentMatches_winner_team_id_fkey` ON `tournamentmatches`;

-- DropIndex
DROP INDEX `Users_role_id_fkey` ON `users`;

-- AlterTable
ALTER TABLE `bookingslots` MODIFY `recurring_day` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Roles`(`roleID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bookings` ADD CONSTRAINT `Bookings_court_id_fkey` FOREIGN KEY (`court_id`) REFERENCES `Courts`(`courtID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bookings` ADD CONSTRAINT `Bookings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingSlots` ADD CONSTRAINT `BookingSlots_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`bookingID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BookingSlots` ADD CONSTRAINT `BookingSlots_slot_id_fkey` FOREIGN KEY (`slot_id`) REFERENCES `Slots`(`slotID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payments` ADD CONSTRAINT `Payments_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`bookingID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedbacks` ADD CONSTRAINT `Feedbacks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Feedbacks` ADD CONSTRAINT `Feedbacks_court_id_fkey` FOREIGN KEY (`court_id`) REFERENCES `Courts`(`courtID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMembers` ADD CONSTRAINT `TeamMembers_tournament_team_id_fkey` FOREIGN KEY (`tournament_team_id`) REFERENCES `TournamentTeams`(`tournamentTeamID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMembers` ADD CONSTRAINT `TeamMembers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `Users`(`userID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentMatches` ADD CONSTRAINT `TournamentMatches_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournaments`(`tournamentID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentMatches` ADD CONSTRAINT `TournamentMatches_team1_id_fkey` FOREIGN KEY (`team1_id`) REFERENCES `TournamentTeams`(`tournamentTeamID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentMatches` ADD CONSTRAINT `TournamentMatches_team2_id_fkey` FOREIGN KEY (`team2_id`) REFERENCES `TournamentTeams`(`tournamentTeamID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentMatches` ADD CONSTRAINT `TournamentMatches_winner_team_id_fkey` FOREIGN KEY (`winner_team_id`) REFERENCES `TournamentTeams`(`tournamentTeamID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TournamentMatches` ADD CONSTRAINT `TournamentMatches_court_id_fkey` FOREIGN KEY (`court_id`) REFERENCES `Courts`(`courtID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaderBoards` ADD CONSTRAINT `LeaderBoards_tournament_id_fkey` FOREIGN KEY (`tournament_id`) REFERENCES `Tournaments`(`tournamentID`) ON DELETE RESTRICT ON UPDATE CASCADE;
