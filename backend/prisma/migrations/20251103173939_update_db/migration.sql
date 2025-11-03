-- CreateTable
CREATE TABLE `Roles` (
    `roleID` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Roles_name_key`(`name`),
    PRIMARY KEY (`roleID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Users` (
    `userID` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `role_id` VARCHAR(191) NOT NULL,
    `bank_account_number` VARCHAR(191) NULL,
    `bank_account_owner` VARCHAR(191) NULL,
    `bank_name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Users_email_key`(`email`),
    PRIMARY KEY (`userID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Courts` (
    `courtID` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('OUTDOOR', 'INDOOR') NOT NULL DEFAULT 'INDOOR',
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLOSED') NOT NULL DEFAULT 'AVAILABLE',
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`courtID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Slots` (
    `slotID` VARCHAR(191) NOT NULL,
    `slot_name` VARCHAR(191) NOT NULL,
    `start_time` VARCHAR(191) NOT NULL,
    `end_time` VARCHAR(191) NOT NULL,
    `price` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`slotID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bookings` (
    `bookingID` VARCHAR(191) NOT NULL,
    `booking_date` DATETIME(3) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `total_price` DOUBLE NOT NULL,
    `deposit_amount` DOUBLE NOT NULL,
    `booking_type` ENUM('TOURNAMENT', 'CASUAL', 'WEEKLY') NOT NULL DEFAULT 'CASUAL',
    `court_id` VARCHAR(191) NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `discount` DECIMAL(4, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`bookingID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BookingSlots` (
    `bookingSlotID` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NOT NULL,
    `slot_id` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `is_recurring` BOOLEAN NOT NULL,
    `recurring_day` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NULL,
    `num_weeks` INTEGER NULL,

    PRIMARY KEY (`bookingSlotID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payments` (
    `paymentID` VARCHAR(191) NOT NULL,
    `booking_id` VARCHAR(191) NOT NULL,
    `payment_method` ENUM('CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'MOMO', 'ZALOPAY', 'VNPAY') NOT NULL,
    `status` ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `image` VARCHAR(191) NULL,
    `transaction_id` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`paymentID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedbacks` (
    `feedbackID` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `court_id` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`feedbackID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tournaments` (
    `tournamentID` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `start_day` DATETIME(3) NOT NULL,
    `end_day` DATETIME(3) NOT NULL,
    `description` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `max_teams` INTEGER NOT NULL,
    `prize` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tournamentID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TournamentTeams` (
    `tournamentTeamID` VARCHAR(191) NOT NULL,
    `team_name` VARCHAR(191) NOT NULL,
    `member_count` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tournamentTeamID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMembers` (
    `teamMemberID` VARCHAR(191) NOT NULL,
    `tournament_team_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`teamMemberID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TournamentMatches` (
    `tournamentMatchID` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `team1_id` VARCHAR(191) NOT NULL,
    `team2_id` VARCHAR(191) NOT NULL,
    `court_id` VARCHAR(191) NULL,
    `score_team1` INTEGER NULL,
    `score_team2` INTEGER NULL,
    `status` VARCHAR(191) NOT NULL,
    `round` INTEGER NOT NULL,
    `start_time` DATETIME(3) NOT NULL,
    `end_time` DATETIME(3) NOT NULL,
    `winner_team_id` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`tournamentMatchID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaderBoards` (
    `leaderBoardID` VARCHAR(191) NOT NULL,
    `tournament_id` VARCHAR(191) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `matches_played` INTEGER NOT NULL,
    `wins` INTEGER NOT NULL,
    `losses` INTEGER NOT NULL,
    `draws` INTEGER NOT NULL,
    `points` INTEGER NOT NULL,
    `rank` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`leaderBoardID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
