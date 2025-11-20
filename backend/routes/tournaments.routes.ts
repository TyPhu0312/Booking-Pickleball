import  express  from "express";
import {
getTournaments,
getTournamentById,
createTournament,
updateTournament,
deleteTournament,
updateTournamentStatus,
getTournamentStats,
getActiveTournaments,
getUpcomingTournaments,
getAllTournaments,
} from "../controllers/tournaments.controller";

const router = express.Router();

router.get("/stats", getTournamentStats);
router.get("/active", getActiveTournaments);
router.get("/upcoming", getUpcomingTournaments);
router.get("/all", getAllTournaments);
router.post("/create", createTournament);
router.get("/getTournamentById/:id", getTournamentById);
router.put("/update/:id", updateTournament);
router.delete("/delete/:id", deleteTournament);
router.put("/updateStatus/:id", updateTournamentStatus);

router.get("/", getTournaments);

export default router;